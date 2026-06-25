const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/admin.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', authorize('superAdmin'), getUsers);
router.post('/', authorize('superAdmin'), createUser);
router.put('/:id', authorize('superAdmin'), updateUser);
router.delete('/:id', authorize('superAdmin'), deleteUser);

module.exports = router;
