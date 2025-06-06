const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage: storage });

router.get('/products/:shopName', productController.getProductsByShop);
router.post('/addproduct', upload.single('image'),authMiddleware, productController.addProduct);
router.post('/deleteProduct',authMiddleware, productController.deleteProduct);

module.exports = router;