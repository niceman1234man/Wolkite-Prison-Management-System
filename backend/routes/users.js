// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, faceDescriptor, faceImage, livenessScore } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    
    // Check if liveness is provided and if it failed
    if (faceDescriptor && livenessScore && !livenessScore.isLive) {
      return res.status(400).json({ 
        success: false, 
        message: 'Liveness check failed. Please ensure you are a real person.' 
      });
    }
    
    const db = await getDatabase();
    
    // Check if email already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    // Check for duplicate face if face descriptor is provided
    if (faceDescriptor && Array.isArray(faceDescriptor)) {
      const threshold = 0.6; // Adjust based on your needs
      
      // Find users with face descriptors
      const usersWithFaces = await db.collection('users')
        .find({ faceDescriptor: { $exists: true, $ne: null } })
        .toArray();
        
      // Check for similar faces
      for (const user of usersWithFaces) {
        if (!user.faceDescriptor) continue;
        
        const distance = calculateFaceDistance(faceDescriptor, user.faceDescriptor);
        if (distance < threshold) {
          return res.status(400).json({ 
            success: false, 
            message: 'This face is already registered with another account.' 
          });
        }
      }
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      id: uuid.v4(),
      name,
      email,
      password: hashedPassword,
      role: 'user',
      created: new Date(),
      faceDescriptor: faceDescriptor || null,
      faceImage: faceImage || null,
      lastLogin: null
    };
    
    await db.collection('users').insertOne(newUser);
    
    // Generate token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Remove sensitive fields before sending response
    const { password: pwd, faceDescriptor: fd, ...userToReturn } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userToReturn
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Find user by email endpoint
router.post('/find-by-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Return minimal user info
    const { password, faceDescriptor, ...userInfo } = user;
    return res.json({ success: true, user: userInfo });
    
  } catch (error) {
    console.error('Find user by email error:', error);
    return res.status(500).json({ success: false, message: 'Server error while finding user' });
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