const router = require('express').Router();
const auth = require('../auth');
const usersController = require('../../controllers/users');

router.get('/user', auth.required, usersController.getUserController);

router.put('/user', auth.required, usersController.putUserController);

router.post('/users/login', usersController.loginController);

router.post('/users', usersController.postUserController);

module.exports = router;
