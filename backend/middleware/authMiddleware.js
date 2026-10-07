const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1 & 2. Check that the header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 3. Extract the JWT token
      token = req.headers.authorization.split(' ')[1];

      // 4. Verify it
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 5, 6 & 7. Get user ID from decoded token, find user, exclude password
      req.user = await User.findById(decoded.userId).select('-password');

      // Check if associated user could not be found
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // 9. Call next() when authentication succeeds
      next();
    } catch (error) {
      // 10. Return HTTP 401 when token is invalid or expired
      return res.status(401).json({ message: 'Not authorized' });
    }
  } else {
    // 10. Return HTTP 401 when token is missing
    return res.status(401).json({ message: 'Not authorized' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // 1 & 2. Assume protect has already authenticated user, read req.user.role
    // 3. Check whether that role exists in the allowed roles
    if (!roles.includes(req.user.role)) {
      // 5. Return HTTP 403 when user does not have permission
      return res.status(403).json({ message: 'Access denied' });
    }
    // 4. Call next() when permitted
    next();
  };
};

module.exports = {
  protect,
  authorizeRoles
};
