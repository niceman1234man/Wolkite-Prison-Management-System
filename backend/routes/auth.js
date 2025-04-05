// Face login route
router.post('/face-login', async (req, res) => {
  try {
    const { faceDescriptor, userId, livenessScore } = req.body;
    
    // Validate input
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, message: 'Invalid face descriptor data' });
    }
    
    // Check liveness score if provided
    if (livenessScore && !livenessScore.isLive) {
      console.log('Failed liveness check during login attempt', livenessScore);
      return res.status(400).json({ 
        success: false, 
        message: 'Liveness check failed. Please ensure you are a real person.' 
      });
    }
    
    let query = {};
    
    // If userId is provided, limit search to that user
    if (userId) {
      query = { id: userId };
    }
    
    // Find users with face descriptors
    const db = await getDatabase();
    const users = await db.collection('users')
      .find({ 
        ...query,
        faceDescriptor: { $exists: true, $ne: null } 
      })
      .toArray();
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: userId ? 'User has no registered face' : 'No matching face found' 
      });
    }
    
    // Find the user with the closest face match
    const threshold = 0.6; // Adjust based on your needs
    let bestMatch = null;
    let bestDistance = Infinity;
    
    for (const user of users) {
      if (!user.faceDescriptor) continue;
      
      // Calculate Euclidean distance between descriptors
      const distance = calculateFaceDistance(faceDescriptor, user.faceDescriptor);
      
      if (distance < threshold && distance < bestDistance) {
        bestMatch = user;
        bestDistance = distance;
      }
    }
    
    if (!bestMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Face not recognized' 
      });
    }
    
    // User authenticated - generate token and session
    const token = jwt.sign(
      { id: bestMatch.id, email: bestMatch.email, role: bestMatch.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Log the successful login
    console.log(`User logged in via face authentication: ${bestMatch.email}`);
    
    // Send back user info without sensitive data
    const { password, faceDescriptor: fd, ...userWithoutSensitiveData } = bestMatch;
    
    return res.json({
      success: true,
      message: 'Face authentication successful',
      token,
      user: userWithoutSensitiveData
    });
    
  } catch (error) {
    console.error('Face login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during face authentication' });
  }
});

// Helper function to calculate Euclidean distance between face descriptors
function calculateFaceDistance(descriptor1, descriptor2) {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return Infinity;
  }
  
  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
  }
  
  return Math.sqrt(sum);
} 