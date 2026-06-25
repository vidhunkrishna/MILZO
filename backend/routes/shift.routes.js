const express = require('express');
const router = express.Router();
const { getShifts, getShift, createShift, updateShift, deleteShift, markAttendance, handleLeaveRequest } = require('../controllers/shift.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getShifts);
router.post('/', authorize('superAdmin', 'operationsManager', 'deliveryManager'), createShift);
router.get('/:id', getShift);
router.put('/:id', authorize('superAdmin', 'operationsManager', 'deliveryManager'), updateShift);
router.delete('/:id', authorize('superAdmin'), deleteShift);
router.patch('/:id/attendance', authorize('superAdmin', 'operationsManager', 'deliveryManager'), markAttendance);
router.patch('/:id/leave', authorize('superAdmin', 'operationsManager', 'deliveryManager'), handleLeaveRequest);

module.exports = router;
