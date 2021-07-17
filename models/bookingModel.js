const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  price: {
    type: Number,
    require: [true, 'Booking must have a price.']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: {
    type: Boolean,
    default: true
  }
});

// populate the tour and the user automatically whenever there is a query start with 'find', #212 0425
bookingSchema.pre(/^find/, function (next){
  this.populate('user').populate({  // user & tour name
    path: 'tour',
    select: 'name'
  });
  next(); // Remember to call next(), #214 0925
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; // define the schema, #212 0420
