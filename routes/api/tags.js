const router = require('express').Router();
const tagsController = require('../../controllers/tags');

// return a list of tags
router.get('/', tagsController.getTagsController);

module.exports = router;
