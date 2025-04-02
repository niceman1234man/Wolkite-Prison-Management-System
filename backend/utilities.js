import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            console.log('No auth header provided');
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        
        const token = authHeader.split(" ")[1];
        if (!token) {
            console.log('No token found in auth header');
            return res.status(401).json({ success: false, message: "No token provided" });
        }
        
        jwt.verify(token, process.env.TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                console.log('Token verification error:', err.message);
                return res.status(403).json({ success: false, message: "Invalid or expired token" });
            }
            
            if (!user || !user.id) {
                console.log('User ID not found in decoded token:', user);
                return res.status(401).json({ success: false, message: "Invalid user in token" });
            }
            
            console.log(`User authenticated with ID: ${user.id}`);
            req.user = user;
            next();
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, message: "Server error in authentication" });
    }
}