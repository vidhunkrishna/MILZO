const express = require('express');
const router = express.Router();
const { getFeedbacks, getFeedback, createFeedback, updateFeedback, resolveFeedback, escalateFeedback, addComment, deleteFeedback } = require('../controllers/feedback.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getFeedbacks);
router.post('/', createFeedback);
router.get('/:id', getFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', authorize('superAdmin'), deleteFeedback);
router.patch('/:id/resolve', resolveFeedback);
router.patch('/:id/escalate', authorize('superAdmin', 'operationsManager'), escalateFeedback);
router.post('/:id/comments', addComment);

module.exports = router;
