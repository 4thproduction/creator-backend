const jwt = require('jsonwebtoken');

const generateToken = (id, permissions) => {
  return jwt.sign({ id, permissions }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

module.exports = generateToken;
