const express = require('express');
const router = express.Router();
const { getSubscriptions, getSubscription, createSubscription, updateSubscription, pauseSubscription, resumeSubscription, cancelSubscription, deleteSubscription } = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getSubscriptions);
router.post('/', authorize('superAdmin', 'operationsManager', 'customerSupport', 'customer'), createSubscription);
router.get('/:id', getSubscription);
router.put('/:id', authorize('superAdmin', 'operationsManager', 'customer'), updateSubscription);
router.delete('/:id', authorize('superAdmin', 'customer'), deleteSubscription);
router.patch('/:id/pause', authorize('superAdmin', 'operationsManager', 'customerSupport', 'customer'), pauseSubscription);
router.patch('/:id/resume', authorize('superAdmin', 'operationsManager', 'customerSupport', 'customer'), resumeSubscription);
router.patch('/:id/cancel', authorize('superAdmin', 'operationsManager', 'customerSupport', 'customer'), cancelSubscription);

module.exports = router;
