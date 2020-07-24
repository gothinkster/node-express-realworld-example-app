const router = require('express').Router();
const auth = require('../auth');
const profilesController = require('../../controllers/profiles');

// Preload user profile on routes with ':username'
router.param('username', (req, res, next, username) => {
  User.findOne({username: username}).then(user =>{
    if (!user) { return res.sendStatus(404); }

    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/:username', auth.optional, profilesController.getUsernameController);

router.post('/:username/follow', auth.required, profilesController.getUsernameFollowController);

router.delete('/:username/follow', auth.required, profilesController.deleteUsernameFollowController);

module.exports = router;
