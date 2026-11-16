const Role = require('../Models/Role');

const getAllRoles = async (page, limit) => {
  const query = Role.find().sort({ createdAt: -1, _id: -1 });
  if (page === undefined || limit === undefined) return await query;

  const [total, roles] = await Promise.all([
    Role.countDocuments(),
    query.skip((page - 1) * limit).limit(limit),
  ]);
  return { roles, total, page, limit };
};

const getRoleById = async (id) => {
  return await Role.findById(id);
};

const createRole = async (name, permissions) => {
  const existing = await Role.findOne({ name });
  if (existing) throw new Error('Role with this name already exists');
  return await Role.create({ name, permissions });
};

const updateRole = async (id, name, permissions) => {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');
  role.name = name || role.name;
  role.permissions = permissions !== undefined ? permissions : role.permissions;
  return await role.save();
};

const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw new Error('Role not found');
  await role.deleteOne();
};

module.exports = { getAllRoles, getRoleById, createRole, updateRole, deleteRole };
