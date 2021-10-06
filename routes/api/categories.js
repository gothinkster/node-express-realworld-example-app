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

module.exports = router;
