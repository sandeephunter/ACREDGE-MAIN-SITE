const { admin, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const NodeCache = new require('node-cache');
const tokenCache = new NodeCache({ stdTTL: 300 });

exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken, rememberMe, sameWhatsapp } = req.body;

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    const expiresIn = rememberMe ? '7d' : '24h';
    const token = jwt.sign({ phoneNumber }, process.env.JWT_SECRET, { expiresIn });

    const expirationDate = new Date(Date.now() + (rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
    
    // Store token in Firestore
    await db.collection('tokens').doc(phoneNumber).set({
      token,
      expiresAt: admin.firestore.Timestamp.fromDate(expirationDate)
    });

    // Check and update user profile in Firestore
    const userProfile = await db
      .collection('UserProfile')
      .doc(phoneNumber)
      .get();

    if (!userProfile.exists) {
      await db.collection('UserProfile').doc(phoneNumber).set({
        phoneNumber,
        sameNumberOnWhatsapp: sameWhatsapp ? phoneNumber : '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ 
      message: "Logged in successfully",
      token
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: "Verification error occurred." });
  }
};

// The isAuthenticated and logout functions remain the same
exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const cachedToken = tokenCache.get(decoded.phoneNumber);
    if (cachedToken === token) {
      req.user = { phoneNumber: decoded.phoneNumber };
      return next();
    }

    const tokenDoc = await db
      .collection('tokens')
      .doc(decoded.phoneNumber)
      .get();

    if (!tokenDoc.exists || tokenDoc.data().token !== token || 
        tokenDoc.data().expiresAt.toDate() < new Date()) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    tokenCache.set(decoded.phoneNumber, token);
    req.user = { phoneNumber: decoded.phoneNumber };
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: "Authentication failed." });
  }
};

exports.logout = async (req, res) => {
  console.log('Logout process started');
  
  try {
    const token = req.cookies.token;
    console.log('Token from cookies:', token ? 'Token exists' : 'No token found');

    if (!token) {
      console.log('No token present - user already logged out');
      return res.status(200).json({ 
        message: "Already Logged Out, Please login again to continue." 
      });
    }

    try {
      console.log('Attempting to verify JWT token');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully', { 
        phoneNumber: decoded.phoneNumber 
      });

      console.log('Attempting to delete token from database');
      await db.collection('tokens').doc(decoded.phoneNumber).delete();
      console.log('Token deleted from database successfully');

      console.log('Attempting to remove token from cache');
      tokenCache.del(decoded.phoneNumber);
      console.log('Token removed from cache successfully');
    } catch (jwtError) {
      console.error('JWT verification failed during logout:', {
        error: jwtError.message,
        name: jwtError.name,
        stack: jwtError.stack
      });
    }

    // Clear the cookie from the response
    console.log('Attempting to clear token cookie');
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    console.log('Token cookie cleared successfully');

    console.log('Logout process completed successfully');
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error('Comprehensive logout error:', {
      error: error.message,
      name: error.name,
      stack: error.stack
    });
    res.status(500).json({ message: "Logout error occurred." });
  }
};