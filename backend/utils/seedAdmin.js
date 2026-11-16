const User = require('../Models/User');
const Role = require('../Models/Role');

const ALL_PERMISSIONS = [
  'view_dashboard',
  'create_user',
  'read_user',
  'update_user',
  'delete_user',
  'create_role',
  'read_role',
  'update_role',
  'delete_role',
  'read_creator',
  'create_creator',
  'update_creator',
  'delete_creator',
  'export_creator',
];

const seedAdmin = async () => {
  try {
    await Role.updateMany({ permissions: 'approve_creator' }, { $pull: { permissions: 'approve_creator' } });
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@rbac.com').toLowerCase();
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      const role = await Role.findById(existingAdmin.role);
      if (role?.name === 'Super Admin') {
        role.permissions = [...new Set([...role.permissions, ...ALL_PERMISSIONS])];
        await role.save();
      }
      return;
    }

    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        permissions: ALL_PERMISSIONS,
      });
      console.log('Super Admin role created');
    } else {
      superAdminRole.permissions = [...new Set([...superAdminRole.permissions, ...ALL_PERMISSIONS])];
      await superAdminRole.save();
    }

    await User.create({
      name: process.env.ADMIN_NAME || 'Super Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: superAdminRole._id,
    });

    console.log(`Admin seeded: ${adminEmail}`);
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

module.exports = seedAdmin;
