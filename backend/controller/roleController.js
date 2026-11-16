const roleService = require('../services/roleService');

const getRoles = async (req, res) => {
  try {
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = [10, 20, 50, 100].includes(Number(req.query.limit)) ? Number(req.query.limit) : 10;
    const roles = paginated
      ? await roleService.getAllRoles(page, limit)
      : await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const role = await roleService.createRole(name, permissions || []);
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;
    const role = await roleService.updateRole(req.params.id, name, permissions);
    res.json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteRole = async (req, res) => {
  try {
    await roleService.deleteRole(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getRoles, createRole, updateRole, deleteRole };
