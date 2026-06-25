const express = require('express');
const router = express.Router();
const { getVendors, getVendor, createVendor, updateVendor, deleteVendor, updateVendorStatus, verifyVendorKYC } = require('../controllers/vendor.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getVendors);
router.post('/', authorize('superAdmin', 'operationsManager'), createVendor);
router.get('/:id', getVendor);
router.put('/:id', authorize('superAdmin', 'operationsManager'), updateVendor);
router.delete('/:id', authorize('superAdmin'), deleteVendor);
router.patch('/:id/status', authorize('superAdmin', 'operationsManager'), updateVendorStatus);
router.patch('/:id/verify-kyc', authorize('superAdmin', 'operationsManager'), verifyVendorKYC);

module.exports = router;
