class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    // BUILD THE QUERY
    // 1A) Filtering
    const queryObj = {...this.queryString};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced filtering
    // console.log(queryObj);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));
    // { difficulty: 'easy', duration: {$gte: 5} } Mongo Command Syntax
    // { difficulty: 'easy', duration: { gte: '5' } } Express Syntax
    // get, gt, lte, lt

    // 1C) create mongo query
    // let query = Tour.find(JSON.parse(queryStr)); // Tour.find() return a find query
    this.query.find(JSON.parse(queryStr));

    return this; // return entire object
  }
  sort() {
    // 2) Sorting
    if (this.queryString.sort) {
      // console.log(this.queryString.sort); // print the error
      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy) // req.query.sort = param name
      // sort('price ratingAverage')
    } else {
      this.query = this.query.sort('-createdAt'); // default
    }
    return this;
  }
  limitFields() {
    // 3) Field limiting
    // console.log(req.query.fields); // name,duration,difficulty,price
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      // console.log(fields); // name duration difficulty price
      this.query = this.query.select(fields); // query = query.select("name duration price);
    } else {
      this.query = this.query.select('-__v'); // default: (-) exclude __v attribute
    }
    return this;
  }
  paginate() {
    // 4) Pagination
    const page = this.queryString.page * 1 || 1; // default value = 1
    const limit = this.queryString.limit * 1 || 100; // default value = 100
    const skip = (page - 1) * limit;
    // ?page=2&limit=10: 1-10 -> page 1, 11-20 -> page 2, 21-30 -> page 3
    this.query = this.query.skip(skip).limit(limit)

    return this;
  }
}
module.exports = APIFeatures;
