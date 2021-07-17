const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on("uncaughtException", err => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT REJECTION, SHUTTING DOWN ...")
  process.exit(1);
});

// setting the node env, must before defining the app
dotenv.config({
  path: './config.env'
});
const app = require('./app');

// console.log(app.get('env'));
// console.log(process.env);

// setting mongoose
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
mongoose
  // .connect(process.env.DATABASE_LOCAL, { // connect to local database
  .connect(DB, { // that return 'promise' so we can use 'then'
    useNewUrlParser: true, // some option to deal with some depreacation warnings:
    useCreateIndex: true, // https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065060?start=473#notes
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful'));

// ***************** START SERVER *****************//
const port = process.env.PORT; // listen port 3000
const server = app.listen(port, () => {
  console.log(`App running on port ${port} ... `);
});

process.on("unhandledRejection", err => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION, SHUTTING DOWN ...")
  server.close(() => { // give the server time to finish all the request
    process.exit(1);
  });
});

process.on('SIGTERM', () => { // received from heroku that stopping signal, #224, 0150
  console.log('SIGTERM RECEIVED. Shutting down gracefully.');
  server.close(() => {
    console.log('Processing terminated!');
  });
});
