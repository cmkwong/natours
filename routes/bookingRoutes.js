const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect); // parent middleware, #215 0245

router.get('/checkout-session/:tourId',
  bookingController.getCheckoutSession
);

router.use(authController.restrictTo('admin', 'lead-guide')); // parent middleware, #215 0245

router.route('/') // create the route for booking, #215 0230
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router.route('/:id')
  .get(bookingController.geteBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
