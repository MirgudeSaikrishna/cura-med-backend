const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/U_view', userController.userView);
router.get('/nearest', userController.nearestSellers);

module.exports = router;
