const router = require('express').Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const auth = require('../auth');

// Preload user profile on routes with ':username'
router.param('username', (req, res, next, username) => {
  User.findOne({username: username}).then(user =>{
    if (!user) { return res.sendStatus(404); }

    req.profile = user;

    return next();
  }).catch(next);
});

router.get('/:username', auth.optional, (req, res, next) =>{
  if(req.payload){
    User.findById(req.payload.id).then(user =>{
      if(!user){ return res.json({profile: req.profile.toProfileJSONFor(false)}); }

      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  } else {
    return res.json({profile: req.profile.toProfileJSONFor(false)});
  }
});

router.post('/:username/follow', auth.required, (req, res, next) =>{
  var profileId = req.profile._id;

  User.findById(req.payload.id).then(user =>{
    if (!user) { return res.sendStatus(401); }

    return user.follow(profileId).then(() => {
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
});

router.delete('/:username/follow', auth.required, (req, res, next) =>{
  var profileId = req.profile._id;

  User.findById(req.payload.id).then(user =>{
    if (!user) { return res.sendStatus(401); }

    return user.unfollow(profileId).then(() => {
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
});

module.exports = router;
