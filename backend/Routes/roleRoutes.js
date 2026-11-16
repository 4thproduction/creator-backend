const express = require('express');
const router = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require('../controller/roleController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.get('/', protect, checkPermission('read_role'), getRoles);
router.post('/', protect, checkPermission('create_role'), createRole);
router.put('/:id', protect, checkPermission('update_role'), updateRole);
router.delete('/:id', protect, checkPermission('delete_role'), deleteRole);

module.exports = router;
