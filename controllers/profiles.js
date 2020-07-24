const mongoose = require('mongoose');
const User = mongoose.model('User');

exports.getUsernameController = (req, res, next) =>{
  if(req.payload){
    User.findById(req.payload.id).then(user =>{
      if(!user){ return res.json({profile: req.profile.toProfileJSONFor(false)}); }

      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  } else {
    return res.json({profile: req.profile.toProfileJSONFor(false)});
  }
};


exports.getUsernameFollowController = (req, res, next) =>{
  const profileId = req.profile._id;

  User.findById(req.payload.id).then(user =>{
    if (!user) { return res.sendStatus(401); }

    return user.follow(profileId).then(() => {
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
};

exports.deleteUsernameFollowController = (req, res, next) =>{
  var profileId = req.profile._id;

  User.findById(req.payload.id).then(user =>{
    if (!user) { return res.sendStatus(401); }

    return user.unfollow(profileId).then(() => {
      return res.json({profile: req.profile.toProfileJSONFor(user)});
    });
  }).catch(next);
};
