const router = require('express').Router();
const auth = require('../auth');
const articleController = require('../../controllers/articles');

// Preload article objects on routes with ':article'
router.param('article', (req, res, next, slug) => {
  Article.findOne({ slug: slug})
    .populate('author')
    .then(article => {
      if (!article) { return res.sendStatus(404); }

      req.article = article;

      return next();
    }).catch(next);
});

router.param('comment', (req, res, next, id) => {
  Comment.findById(id).then(comment =>{
    if(!comment) { return res.sendStatus(404); }

    req.comment = comment;

    return next();
  }).catch(next);
});

router.get('/', auth.optional, articleController.getArticlesController);

router.get('/feed', auth.required, articleController.getArticleFeedController);

router.post('/', auth.required, articleController.postArticlesController);

// return a article
router.get('/:article', auth.optional, articleController.getArticleReturnController);

// update article
router.put('/:article', auth.required, articleController.updateArticleController);

// delete article
router.delete('/:article', auth.required, articleController.deleteArticleController);

// Favorite an article
router.post('/:article/favorite', auth.required, articleController.favoriteArticleController);

// Unfavorite an article
router.delete('/:article/favorite', auth.required, articleController.unfavoriteArticleController);

// return an article's comments
router.get('/:article/comments', auth.optional, articleController.returnArticleCommentController);

// create a new comment
router.post('/:article/comments', auth.required, articleController.createArticleCommentController);

router.delete('/:article/comments/:comment', auth.required, articleController.deleteArticleCommentController);

module.exports = router;
