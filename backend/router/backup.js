// make router for backup
import express from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import archiver from 'archiver';
import cron from 'node-cron';
import mongoose from 'mongoose';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current file directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backup storage configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Set up MongoDB GridFS for larger backups
let gfs;
mongoose.connection.once('open', () => {
  gfs = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'backups'
  });
});

// Define a backup schema
const backupSchema = new mongoose.Schema({
  filename: String,
  type: { type: String, enum: ['full', 'incremental'] },
  createdAt: { type: Date, default: Date.now },
  size: Number,
  status: { type: String, enum: ['completed', 'failed', 'in_progress'] },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Backup' }, // For incremental backups
  metadata: Object
});

const Backup = mongoose.model('Backup', backupSchema);

// Schedule schema for automated backups
const scheduleSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  type: { type: String, enum: ['full', 'incremental'], default: 'incremental' },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
  time: String,
  day: Number, // For weekly (0-6) or monthly (1-31)
  retention: { type: Number, default: 7 } // Days to keep backups
});

const BackupSchedule = mongoose.model('BackupSchedule', scheduleSchema);

// Create multer storage for restoring backups
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(BACKUP_DIR, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `restore-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Helper Functions
// ---------------

// Create MongoDB dump
const createMongoDBDump = async (type, referenceId = null) => {
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const dbName = mongoose.connection.db.databaseName;
    const outputDir = path.join(BACKUP_DIR, `${dbName}_${type}_${timestamp}`);
    
    // Create backup entry
    const backup = new Backup({
      filename: `${dbName}_${type}_${timestamp}`,
      type,
      status: 'in_progress',
      reference: referenceId
    });
    await backup.save();
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Set up mongodump command
    let command = `mongodump --db ${dbName} --out ${outputDir}`;
    
    // For incremental backups, we need to check the oplog
    if (type === 'incremental' && referenceId) {
      const reference = await Backup.findById(referenceId);
      if (reference && reference.metadata && reference.metadata.timestamp) {
        // Use oplog to only get changes since the last backup
        command += ` --oplog --oplogReplay --oplogLimit ${reference.metadata.timestamp}`;
      } else {
        // Fall back to full backup if reference is invalid
        type = 'full';
      }
    }
    
    // Execute mongodump
    return new Promise((resolve, reject) => {
      exec(command, async (error, stdout, stderr) => {
        if (error) {
          console.error(`mongodump error: ${error.message}`);
          await Backup.findByIdAndUpdate(backup._id, { 
            status: 'failed',
            metadata: { error: error.message } 
          });
          reject(error);
          return;
        }
        
        if (stderr) {
          console.log(`mongodump stderr: ${stderr}`);
        }
        
        // Compress the output directory
        const archive = archiver('zip', {
          zlib: { level: 9 } // Maximum compression
        });
        
        const zipFilename = `${outputDir}.zip`;
        const output = fs.createWriteStream(zipFilename);
        
        output.on('close', async () => {
          const stats = fs.statSync(zipFilename);
          
          // Store backup metadata
          const oplogTimestamp = type === 'incremental' ? 
            await getOplogTimestamp() : null;
          
          // Update backup entry
          await Backup.findByIdAndUpdate(backup._id, {
            status: 'completed',
            size: stats.size,
            metadata: {
              timestamp: oplogTimestamp,
              command,
              outputDir,
              zipFilename
            }
          });
          
          // Clean up the uncompressed directory
          fs.rmSync(outputDir, { recursive: true, force: true });
          
          resolve(backup._id);
        });
        
        archive.on('error', async (err) => {
          await Backup.findByIdAndUpdate(backup._id, { 
            status: 'failed',
            metadata: { error: err.message } 
          });
          reject(err);
        });
        
        archive.pipe(output);
        archive.directory(outputDir, false);
        archive.finalize();
      });
    });
  } catch (error) {
    console.error('Error in createMongoDBDump:', error);
    throw error;
  }
};

// Get current oplog timestamp for incremental backups
const getOplogTimestamp = async () => {
  return new Promise((resolve, reject) => {
    exec('mongosh admin --eval "db.oplog.rs.find().sort({$natural: -1}).limit(1).pretty()"', 
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error getting oplog timestamp: ${error.message}`);
          resolve(null);
          return;
        }
        
        // Parse the timestamp from output
        const match = stdout.match(/"ts"\s*:\s*Timestamp\(\s*(\d+),\s*(\d+)\s*\)/);
        if (match && match[1] && match[2]) {
          resolve(`${match[1]}:${match[2]}`);
        } else {
          resolve(null);
        }
      }
    );
  });
};

// Restore from backup
const restoreFromBackup = async (backupId) => {
  try {
    const backup = await Backup.findById(backupId);
    if (!backup || backup.status !== 'completed') {
      throw new Error('Backup not found or not completed');
    }
    
    const zipFilename = backup.metadata.zipFilename;
    if (!fs.existsSync(zipFilename)) {
      throw new Error('Backup file not found');
    }
    
    // Extract the zip file
    const extractDir = path.join(BACKUP_DIR, 'tmp', backup._id.toString());
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    await new Promise((resolve, reject) => {
      exec(`unzip -o ${zipFilename} -d ${extractDir}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Extract error: ${error.message}`);
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // If this is an incremental backup, we need the full backup chain
    let restoreChain = [];
    if (backup.type === 'incremental') {
      restoreChain = await getBackupChain(backup._id);
    } else {
      restoreChain = [backup];
    }
    
    // Perform the restore operations in sequence
    const dbName = mongoose.connection.db.databaseName;
    for (const [index, backupToRestore] of restoreChain.entries()) {
      const isFirst = index === 0;
      const restoreDir = isFirst 
        ? path.join(extractDir, dbName) 
        : path.join(BACKUP_DIR, 'tmp', backupToRestore._id.toString(), dbName);
      
      // Prepare mongorestore command
      let command = `mongorestore --db ${dbName}`;
      
      // Drop database only for the first backup in chain (which should be a full backup)
      if (isFirst) {
        command += ' --drop';
      }
      
      command += ` ${restoreDir}`;
      
      // Execute mongorestore
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`mongorestore error: ${error.message}`);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.log(`mongorestore stderr: ${stderr}`);
          }
          
          resolve();
        });
      });
    }
    
    // Clean up extract directories
    fs.rmSync(path.join(BACKUP_DIR, 'tmp'), { recursive: true, force: true });
    
    return true;
  } catch (error) {
    console.error('Error in restoreFromBackup:', error);
    throw error;
  }
};

// Get the full chain of backups needed for restore (for incremental backups)
const getBackupChain = async (backupId) => {
  const chain = [];
  let currentId = backupId;
  
  // Loop until we find a full backup or hit the end of the chain
  while (currentId) {
    const backup = await Backup.findById(currentId);
    if (!backup) break;
    
    chain.unshift(backup); // Add to start of array
    
    if (backup.type === 'full') {
      // Found the full backup, we're done
      break;
    } else if (backup.reference) {
      // Continue with the reference backup
      currentId = backup.reference;
    } else {
      // No reference, can't continue
      throw new Error('Incremental backup chain is broken - missing reference');
    }
  }
  
  // Ensure the first backup is a full backup
  if (chain.length === 0 || chain[0].type !== 'full') {
    throw new Error('Cannot restore: No full backup found in chain');
  }
  
  return chain;
};

// Clean up old backups based on retention policy
const cleanupOldBackups = async (days = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Get old backups
    const oldBackups = await Backup.find({
      createdAt: { $lt: cutoffDate },
      status: 'completed'
    });
    
    // Keep track of how many were removed
    let removedCount = 0;
    
    for (const backup of oldBackups) {
      // Check if this backup is referenced by newer incremental backups
      const hasReferences = await Backup.exists({
        reference: backup._id,
        createdAt: { $gte: cutoffDate }
      });
      
      // Don't delete backups that are referenced by newer ones
      if (hasReferences) continue;
      
      // Delete the zip file if it exists
      if (backup.metadata && backup.metadata.zipFilename && 
          fs.existsSync(backup.metadata.zipFilename)) {
        fs.unlinkSync(backup.metadata.zipFilename);
      }
      
      // Delete the backup record
      await Backup.findByIdAndDelete(backup._id);
      removedCount++;
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
    throw error;
  }
};

// Schedule backup jobs
const scheduleBackupJobs = async () => {
  // Clear existing scheduled jobs
  Object.keys(scheduledJobs).forEach(id => {
    if (scheduledJobs[id]) {
      scheduledJobs[id].stop();
      delete scheduledJobs[id];
    }
  });
  
  // Get all enabled schedules
  const schedules = await BackupSchedule.find({ enabled: true });
  
  for (const schedule of schedules) {
    let cronExpression;
    
    // Build cron expression based on frequency
    const [hour, minute] = schedule.time.split(':');
    
    switch (schedule.frequency) {
      case 'daily':
        cronExpression = `${minute} ${hour} * * *`;
        break;
      case 'weekly':
        // day is 0-6 (Sunday-Saturday)
        cronExpression = `${minute} ${hour} * * ${schedule.day || 0}`;
        break;
      case 'monthly':
        // day is 1-31
        cronExpression = `${minute} ${hour} ${schedule.day || 1} * *`;
        break;
      default:
        cronExpression = `${minute} ${hour} * * *`; // Default to daily
    }
    
    // Schedule the job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scheduled ${schedule.frequency} backup at ${new Date()}`);
        
        // For incremental backups, find the most recent successful backup
        let referenceId = null;
        
        if (schedule.type === 'incremental') {
          const latestBackup = await Backup.findOne({
            status: 'completed'
          }).sort({ createdAt: -1 });
          
          if (latestBackup) {
            referenceId = latestBackup._id;
          }
        }
        
        // Create the backup
        await createMongoDBDump(
          referenceId ? 'incremental' : 'full', 
          referenceId
        );
        
        // Clean up old backups
        await cleanupOldBackups(schedule.retention);
        
      } catch (error) {
        console.error(`Error in scheduled backup: ${error.message}`);
      }
    });
    
    // Store the job
    scheduledJobs[schedule._id] = job;
  }
};

// Store scheduled jobs
const scheduledJobs = {};

// Routes
// ------

// Get backup history
router.get('/history', async (req, res) => {
  try {
    const backups = await Backup.find()
      .sort({ createdAt: -1 })
      .select('-metadata.command'); // Exclude command from response
    
    res.json(backups);
  } catch (error) {
    console.error('Error fetching backup history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new backup
router.post('/create', async (req, res) => {
  try {
    const { type } = req.body;
    
    if (type !== 'full' && type !== 'incremental') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid backup type. Must be "full" or "incremental"' 
      });
    }
    
    // For incremental backups, find the most recent successful backup
    let referenceId = null;
    
    if (type === 'incremental') {
      const latestBackup = await Backup.findOne({
        status: 'completed'
      }).sort({ createdAt: -1 });
      
      if (latestBackup) {
        referenceId = latestBackup._id;
      } else {
        // If no previous backup exists, default to full backup
        console.log('No previous backup found for incremental. Defaulting to full.');
      }
    }
    
    // Create the backup
    const backupId = await createMongoDBDump(
      referenceId ? 'incremental' : 'full', 
      referenceId
    );
    
    res.json({ success: true, backupId });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Restore from backup
router.post('/restore/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await restoreFromBackup(id);
    
    res.json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload and restore from a backup file
router.post('/restore-upload', upload.single('backupFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No backup file provided' });
    }
    
    const uploadedPath = req.file.path;
    const extractDir = path.join(BACKUP_DIR, 'uploads', 'extract');
    
    // Ensure extract directory exists
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Extract the uploaded zip
    await new Promise((resolve, reject) => {
      exec(`unzip -o ${uploadedPath} -d ${extractDir}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Extract error: ${error.message}`);
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    const restoreDir = path.join(extractDir, dbName);
    
    // Restore the database
    await new Promise((resolve, reject) => {
      exec(`mongorestore --db ${dbName} --drop ${restoreDir}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`mongorestore error: ${error.message}`);
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // Clean up
    fs.unlinkSync(uploadedPath);
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    res.json({ success: true, message: 'Backup restored successfully from uploaded file' });
  } catch (error) {
    console.error('Error restoring from uploaded backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Download a backup
router.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const backup = await Backup.findById(id);
    if (!backup || backup.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Backup not found or not completed' });
    }
    
    const zipFilename = backup.metadata.zipFilename;
    if (!fs.existsSync(zipFilename)) {
      return res.status(404).json({ success: false, message: 'Backup file not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${backup.filename}.zip`);
    
    // Stream the file
    const fileStream = fs.createReadStream(zipFilename);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get backup schedules
router.get('/schedule', async (req, res) => {
  try {
    const schedules = await BackupSchedule.find();
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching backup schedules:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create or update a backup schedule
router.post('/schedule', async (req, res) => {
  try {
    const { id, enabled, type, frequency, time, day, retention } = req.body;
    
    let schedule;
    if (id) {
      // Update existing schedule
      schedule = await BackupSchedule.findById(id);
      if (!schedule) {
        return res.status(404).json({ success: false, message: 'Schedule not found' });
      }
    } else {
      // Create new schedule
      schedule = new BackupSchedule();
    }
    
    // Update fields
    schedule.enabled = enabled;
    schedule.type = type || 'incremental';
    schedule.frequency = frequency || 'daily';
    schedule.time = time || '02:00';
    if (day !== undefined) schedule.day = day;
    if (retention) schedule.retention = retention;
    
    await schedule.save();
    
    // Update scheduled jobs
    await scheduleBackupJobs();
    
    res.json({ success: true, schedule });
  } catch (error) {
    console.error('Error creating/updating backup schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a backup schedule
router.delete('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Stop the job if it's running
    if (scheduledJobs[id]) {
      scheduledJobs[id].stop();
      delete scheduledJobs[id];
    }
    
    // Delete the schedule
    await BackupSchedule.findByIdAndDelete(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup schedule:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a backup
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const backup = await Backup.findById(id);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }
    
    // Check if this backup is referenced by any incremental backups
    const hasReferences = await Backup.exists({ reference: id });
    if (hasReferences) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete this backup as it is referenced by incremental backups' 
      });
    }
    
    // Delete the zip file if it exists
    if (backup.metadata && backup.metadata.zipFilename && 
        fs.existsSync(backup.metadata.zipFilename)) {
      fs.unlinkSync(backup.metadata.zipFilename);
    }
    
    // Delete the backup record
    await Backup.findByIdAndDelete(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run backup cleanup manually
router.post('/cleanup', async (req, res) => {
  try {
    const { days } = req.body;
    
    const removedCount = await cleanupOldBackups(days || 7);
    
    res.json({ success: true, removedCount });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize scheduled jobs on server start
(async function() {
  try {
    await scheduleBackupJobs();
    console.log('Backup schedules initialized');
  } catch (error) {
    console.error('Error initializing backup schedules:', error);
  }
})();

export default router;