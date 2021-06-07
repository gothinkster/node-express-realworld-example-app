const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if(!token) {
    // 401 - not found
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    // When you register or try to login a user, a token is assigned to that user
    // using the user ID, this is how a token is assigned to a specific user. On
    // verifying the token, we just assign the requested user to the user in the
    // requested token since that user would have been passed while creating the token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();

  } catch (res) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}
