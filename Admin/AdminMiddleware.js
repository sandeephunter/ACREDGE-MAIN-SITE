const { db } = require('../config/firebase');

const ADMIN_NUMBERS = ['+917847940928', '+919990006705', '+919389883992', '+919572016410'];

const isAdmin = async (req, res, next) => {
  try {
    const userPhoneNumber = req.user?.phoneNumber;
    
    if (!userPhoneNumber || !ADMIN_NUMBERS.includes(userPhoneNumber)) {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required." 
      });
    }

    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ message: "Error verifying admin status" });
  }
};

module.exports = { isAdmin, ADMIN_NUMBERS };