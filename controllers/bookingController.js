const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // passed the secret key into stripe, #210 0740
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tourRouter
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    // information of session, #210 1550
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, // need some fields, #213 0225
    success_url: `${req.protocol}://${req.get('host')}/my-tour?alert=booking`, // use this url instead above one, #226, 0930; alert=booking for setting alert, #226 2905
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    // information of product, #210 1550
    display_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session: session
  });
});

// exports.createBookingCheckout = catchAsync( async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;
//
//   if (!tour && !user && !price) return next();  // passing this middleware twice, #213 1045
//   await Booking.create({tour, user, price});    // create document in MongoDB
//
//   // next(); // not ideal to pass the URL (L16) to next middleware, #213 0840
//   res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async(session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({email: session.customer_email})).id; // neeed the User model to use mongoDB enquery to find required document, #226, 1855
  const price = session.display_items[0].amount / 100;
  await Booking.create({tour, user, price});    // create document in MongoDB
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature']; // so we need the req keep clean before the body-parser
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET // secret key of webhook for checkout
    )
  } catch(err) {
    return res.status(400).send(`Webhook error: ${err.message}`); // it is stripe who receive the error, #226 1340
  }
  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }
  res.status(200).json({received: true});
};

exports.createBooking = factory.createOne(Booking);
exports.geteBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
