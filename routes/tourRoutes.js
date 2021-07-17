const express = require('express');

const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

// for create review on a tour
router.use('/:tourId/reviews', reviewRouter);

router
.route('/top-5-cheap')
.get(
  tourController.aliasTopTours,
  tourController.getAllTours);

router
  .route("/tour-stats")
  .get(tourController.getTourStats);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlan);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/22.395240, 114.105406/unit/mi

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours) // No protect because expose this part to anyone but not only user
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour); // chain middleware

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages, // added a route to perform the middleware, #203 1000
    tourController.resizeTourImages,
    tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour);

module.exports = router;
