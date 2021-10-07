const router = require('express').Router();
const mongoose = require('mongoose');

const Category = mongoose.model('Category');
const User = mongoose.model('User');
const auth = require('../auth');

// add a category
router.post('/', auth.required, (req, res, next) => {
  User.findById(req.payload.id)
    .then((user) => {
      if (!user) {
        return res.sendStatus(401);
      }

      const category = new Category(req.body.category);
      category.createdBy = user;

      return category.save().then(() => {
        res.json({ category: category.toJSONFor(user) });
      });
    })
    .catch(next);
});

// get all categories
router.get('/', auth.optional, (req, res, next) => {
  const query = {};
  let limit = 20;
  let offset = 0;

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit;
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset;
  }

  if (typeof req.query.tag !== 'undefined') {
    query.tagList = { $in: [req.query.tag] };
  }

  Promise.all([req.query.createdBy ? User.findOne({ createdBy: req.query.createdBy }) : null])
    .then((results) => {
      const createdBy = results[0];

      if (createdBy) {
        query.createdBy = createdBy._id;
      }

      return Promise.all([
        Category.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: 'desc' })
          .populate('articles')
          .populate('createdBy')
          .exec(),
        Category.count(query).exec(),
        req.payload ? User.findById(req.payload.id) : null,
      ]).then((result) => {
        const categories = result[0];
        const categoriesCount = result[1];
        const user = result[2];

        return res.json({
          categories: categories.map((category) => category.toJSONFor(user)),
          categoriesCount,
        });
      });
    })
    .catch(next);
});

module.exports = router;
