const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(viewController.alerts); // create another middleware for alert, #226 2940

router.get('/',
  // bookingController.createBookingCheckout, // #213, 0610
  authController.isLoggedIn,
  viewsController.getOverview
);
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours); // create new route, #214 0035

// update user data
router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

module.exports = router;
