const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('./../utils/appError');

const multerStorage = multer.memoryStorage(); // store the image into memory instead of disk, #201 0340

const multerFilter = (req, file, cb) => { // filter if it is image, #199 0800
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload images.',400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  {name: 'imageCover', maxCount: 1},
  {name: 'images', maxCount: 3}
]);

// tour images accepted middleware, #203 0830
exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // going to store the filename into body, #204 0540
  await sharp(req.files.imageCover[0].buffer) // read from memory, see line 17
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) images (loop)
  req.body.images = [];
  await Promise.all(  // using promise, #204 1105
    req.files.images.map(async(file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i+1}.jpeg`;
      await sharp(file.buffer) // read from memory, see line 17
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({quality: 90})
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    }) // do not semi-colon here
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, {path: "reviews"})
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group : {
        _id: { $toUpper: '$difficulty' },
        numTours: {$sum: 1}, // add one for each document
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
      //   $match: { _id: { $ne: "EASY" } }
      // }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats: stats
      }
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: { // match only for example 2021-01-01 - 2021-12-31
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        }
      }
    },
    {
      $group: {
        _id: {$month: '$startDates'}, // transfer the Date to month representation only
        numTourStarts: {$sum: 1},
        tours: {$push: '$name'}
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan: plan
    }
  });
});

// /tours-within/233/center/22.395240, 114.105406/unit/mi
exports.getToursWithin = catchAsync(async(req, res, next) => {
  const {distance, latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit ==='mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(new AppError("Please provide latitutr and longitude in the format lat, lng", 400));
  };
  const tours = await Tour.find({
      startLocation: {
          $geoWithin: {
            $centerSphere: [
              [lng, lat],
              radius
            ]}}
  });
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const {latlng, unit} = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371: 0.001; // mi = miles; default meter

  if (!lat || !lng) {
    next(new AppError("Please provide latitutr and longitude in the format lat, lng", 400));
  };

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: "distance",
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
