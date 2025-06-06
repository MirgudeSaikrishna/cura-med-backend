const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/sregister', sellerController.sellerRegister);
router.get('/S_view', authMiddleware, sellerController.sellerView);

module.exports = router;