const mongoose = require('mongoose');
const Article = mongoose.model('Article');

exports.getTagsController = (req, res, next) => {
  Article.find().distinct('tagList').then(tags => {
    return res.json({tags: tags});
  }).catch(next);
};
