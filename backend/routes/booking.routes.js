const express = require('express');
const router = express.Router();
const { getBookings, getBooking, createBooking, updateBooking, cancelBooking, convertToOrder, getBookingCalendar, deleteBooking } = require('../controllers/booking.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/calendar', getBookingCalendar);
router.get('/', getBookings);
router.post('/', authorize('superAdmin', 'operationsManager', 'customerSupport'), createBooking);
router.get('/:id', getBooking);
router.put('/:id', authorize('superAdmin', 'operationsManager', 'customerSupport'), updateBooking);
router.delete('/:id', authorize('superAdmin'), deleteBooking);
router.patch('/:id/cancel', authorize('superAdmin', 'operationsManager', 'customerSupport'), cancelBooking);
router.post('/:id/convert', authorize('superAdmin', 'operationsManager'), convertToOrder);

module.exports = router;
