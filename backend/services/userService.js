const User = require('../Models/User');

const getAllUsers = async (page = 1, limit = 10) => {
  const [total, users] = await Promise.all([
    User.countDocuments(),
    User.find()
      .populate('role', 'name permissions')
      .select('-password')
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);
  return { users, total, page, limit };
};

const getUserById = async (id) => {
  return await User.findById(id).populate('role', 'name permissions').select('-password');
};

const createUser = async (name, email, password, roleId) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('User with this email already exists');
  return await User.create({ name, email, password, role: roleId });
};

const updateUser = async (id, name, email, roleId, password) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');

  if (email && email !== user.email) {
    const existing = await User.findOne({ email });
    if (existing) throw new Error('Email already in use');
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.role = roleId || user.role;
  if (password) user.password = password;

  return await user.save();
};

const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new Error('User not found');
  await user.deleteOne();
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser };
