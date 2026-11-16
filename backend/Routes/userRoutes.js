const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controller/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/rbacMiddleware');

router.get('/', protect, checkPermission('read_user'), getUsers);
router.post('/', protect, checkPermission('create_user'), createUser);
router.put('/:id', protect, checkPermission('update_user'), updateUser);
router.delete('/:id', protect, checkPermission('delete_user'), deleteUser);

module.exports = router;
