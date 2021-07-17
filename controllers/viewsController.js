const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
  const {alert} = req.query;  // const alert = req.query.alert, 'alert' comes from URL parameter on bookingController
  if (alert === 'booking') {
    res.locals.alert = "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediately, please come back later."
  }
  next();
};

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build templete
  // 3) Render that template using tour data from 1)
  res.status(200)
    .set(
      'Content-Security-Policy',
      "script-src 'self' https://js.stripe.com/v3"
    )
    .render('overview', { // parameters that pass into pug
      title: 'All Tours',
      tours: tours
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({slug: req.params.slug}).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  // rendering error page(No such tour name), #192 0120
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }

  // 2) Build template
  // 3) Render template using data from 1)
  res.status(200)
    .set(
        'Content-Security-Policy',
        "base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com https://js.stripe.com/v3 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"
      )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour: tour
    });
});

exports.getLoginForm = (req, res) => {
  res.status(200)
    .set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com ws://127.0.0.1:62751/"
    )
    .render('login', {
      title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200)
    .set(
        'Content-Security-Policy',
        "connect-src 'self' https://cdnjs.cloudflare.com ws://127.0.0.1:62751/; script-src https://js.stripe.com/v3 'self' blob:"
    )
    .render('account', {
      title: 'Your account'
  });
};

exports.getMyTours = catchAsync( async (req, res, next) => {
  // 1) find all bookings with that user
  const bookings = await Booking.find({user: req.user.id});

  // 2) find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour); // using map function to loop, #214 0430
  const tours = await Tour.find({ _id: {$in: tourIDs} });  // using $in, #214 0528

  res.status(200)
    .set(
        'Content-Security-Policy',
        "script-src https://js.stripe.com/v3 'self' blob:"
    )
    .render('overview', {
      title: 'My Tours',
      tours: tours
  })
});

// Update the user data by form, #194 1310
exports.updateUserData = catchAsync(async(req, res, next) => {
  // console.log('UPDATE USER ACCOUNT', req.body); // As app.js L51, #194 1020
  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  }, {
    new: true,
    runValidators: true
  });
  res.status(200).render('account', { // render the account pug
      title: 'Your account',
      user: updatedUser
  });
});
