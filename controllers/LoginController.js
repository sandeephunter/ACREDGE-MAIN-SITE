const { admin, db } = require('../config/firebase');
const jwt = require('jsonwebtoken');
const NodeCache = new require('node-cache');
const { encrypt, decrypt } = require('../utils/tokenEncryption');
const tokenCache = new NodeCache({ stdTTL: 300 });

exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { idToken } = req.body;

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    const expiresIn = '7d';
    const token = jwt.sign({ phoneNumber }, process.env.JWT_SECRET, { expiresIn });
    
    const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
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
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Encrypt token before sending
    const encryptedToken = encrypt(token);

    res.status(200).json({ 
      message: "Logged in successfully",
      token: encryptedToken
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: "Verification error occurred." });
  }
};

exports.isAuthenticated = async (req, res, next) => {
  try {
    const encryptedToken = req.headers.authorization;

    if (!encryptedToken) {
      return res.status(401).json({ message: "No token provided." });
    }

    let token;
    try {
      token = decrypt(encryptedToken);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token format." });
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
  try {
    const encryptedToken = req.headers.authorization;

    if (!encryptedToken) {
      return res.status(200).json({ 
        message: "Already Logged Out, Please login again to continue." 
      });
    }

    try {
      const token = decrypt(encryptedToken);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      await db.collection('tokens').doc(decoded.phoneNumber).delete();
      tokenCache.del(decoded.phoneNumber);
    } catch (error) {
      // Token might be invalid, but we still want to complete the logout
    }

    res.status(200).json({ 
      message: "Logged out successfully",
      action: "CLEAR_LOCAL_STORAGE"
    });
  } catch (error) {
    res.status(500).json({ message: "Logout error occurred." });
  }
};