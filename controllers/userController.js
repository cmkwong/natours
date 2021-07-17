const multer = require('multer'); // upload image, #198 0130
const sharp = require('sharp'); // image processing, #201 0240
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({ // name the storage file, #199 0300
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`) // user-{user-id}-{timestamp}
//   }
// });
const multerStorage = multer.memoryStorage(); // store the image into memory instead of disk, #201 0340

const multerFilter = (req, file, cb) => { // filter if it is image, #199 0800
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image! Please upload images.',400), false);
  }
};

// seting the destination for uploading images, #198 0130
// moving from userRoute to here #199 0030
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.updateUserPhoto = upload.single('photo'); // middleware

exports.resizeUserPhoto = catchAsync(async (req, res, next) => { // for shape because it should return promise, #204 0100
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // for further usage of updateMe Middleware, #201 1220

  await sharp(req.file.buffer) // read from memory, see line 17
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);

  next(); // go to updateMe middleware
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// this is get user info from current user id, that is little difference to getOne
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async(req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This route is not for password updates. Please use /updateMyPassword.", 400));
  };

  // 2) Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");
  if (req.file) filteredBody.photo = req.file.filename; // save file of image, #200 0120

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {active: false});
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: ' This route is not yet defined! Please use /signup instead.'
  });
};

// Never update password by using findByIdAndUpdate
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
