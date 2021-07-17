const path = require('path');
const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser"); // getting the cookie from request #188 15:00
const compression = require('compression');
const cors = require('cors');

// require routes
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy'); // Heroku acts as a proxy, #223 0451

app.set('view engine', 'pug'); // set the pug for filling the template
app.set('views', path.join(__dirname, 'views')) // C:\Users\Chris\projects\Udemy_Learning\200922_NodeJS-Express-MongoDB-Bootcamp-2020\4-natours

// ***************** MIDDLEWARE *****************//
//--------- Middleware stack ---------//

// Access-Control-Allow-Origin *, #225
app.use(cors());
// api.natours.com, (front-end) natours.com
// app.use(cors({
//   origin: 'https://www.natours.com' // allowlist
// }));

app.options('*', cors()); // #225

// 	Serve static files from a folder and not from a route.
app.use(express.static(path.join(__dirname, 'public')));

// Set Security HTTP headers
app.use(helmet());

// use the env config
console.log(process.env.NODE_ENV);

// Development logging
if (process.env.NODE_ENV === 'development') {
  // morgan is for developer
  app.use(morgan('dev')); // dev, tiny
}

// Limit requiest from same API
const limiter = rateLimit({ // 100 limit for same IP in one hr
  max: 100,
  windowMs: 60*60*1000,
  message: "Too many request from this IP, please try again in an hour!"
});
app.use('/api',limiter);

app.post('/webhook-checkout',
 express.raw({type: 'application/json'})
 bookingController.webhookCheckout
); // why before the body parser? #226 0638

// Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // getting the user data from a form so updateUserData() (in viewController) can be used, #194 0930
app.use(cookieParser());

// Data santiization against NoSQL query injection
app.use(mongoSanitize());

// Data santization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

// ***************** ROUTES *****************//
app.use('/', viewRouter); // middleware: root
app.use('/api/v1/tours', tourRouter); // middleware
app.use('/api/v1/users', userRouter); // middleware
app.use('/api/v1/reviews', reviewRouter); // middleware
app.use('/api/v1/bookings', bookingRouter); // middleware

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404)); // = next(err)
});

// error handler MIDDLEWARE (will be used often in tourController.js)
app.use(globalErrorHandler);

module.exports = app;
