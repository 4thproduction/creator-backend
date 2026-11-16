const User = require('../Models/User');

const login = async (email, password) => {
  const user = await User.findOne({ email }).populate('role');
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await user.matchPassword(password);
  if (!isMatch) throw new Error('Invalid email or password');


  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = { login };
