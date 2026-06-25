const express = require('express');
const router = express.Router();
const { getSubscriptions, getSubscription, createSubscription, updateSubscription, pauseSubscription, resumeSubscription, cancelSubscription, deleteSubscription } = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getSubscriptions);
router.post('/', authorize('superAdmin', 'operationsManager', 'customerSupport'), createSubscription);
router.get('/:id', getSubscription);
router.put('/:id', authorize('superAdmin', 'operationsManager'), updateSubscription);
router.delete('/:id', authorize('superAdmin'), deleteSubscription);
router.patch('/:id/pause', authorize('superAdmin', 'operationsManager', 'customerSupport'), pauseSubscription);
router.patch('/:id/resume', authorize('superAdmin', 'operationsManager', 'customerSupport'), resumeSubscription);
router.patch('/:id/cancel', authorize('superAdmin', 'operationsManager', 'customerSupport'), cancelSubscription);

module.exports = router;
