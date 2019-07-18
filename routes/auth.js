var jwt = require('express-jwt');
var secret = require('../config').secret;

function getTokenFromHeader(req) {
  if (req && req.headers && typeof req.headers.authorization === 'string') {
    const authorizationParts = req.headers.authorization.trim().split(' ');


    if (authorizationParts.length === 2) {
      const isAuthFirstPartEqualTo = value => authorizationParts[0] === value;

      if (isAuthFirstPartEqualTo('Token') || isAuthFirstPartEqualTo('Bearer')) {
        return authorizationParts[1];
      }
    }
  }

  return null;
}

var auth = {
  required: jwt({
    secret: secret,
    userProperty: 'payload',
    getToken: getTokenFromHeader
  }),
  optional: jwt({
    secret: secret,
    userProperty: 'payload',
    credentialsRequired: false,
    getToken: getTokenFromHeader
  })
};

module.exports = auth;
