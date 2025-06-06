const Product = require('../models/product');
const Seller = require('../models/seller');
const path = require('path');
const fs = require('fs');

exports.getProductsByShop = async (req, res) => {
    const shopName = req.params.shopName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = { seller: shopName };
    if (search) {
        filter.name = { $regex: search, $options: 'i' };
    }

    try {
        const [products, total, location] = await Promise.all([
            Product.find(filter).skip(skip).limit(limit),
            Product.countDocuments(filter),
            Seller.findOne({ shopName: shopName }).select('location')
        ]);

        if (products && products.length > 0) {
            return res.json({
                status: 'ok',
                products,
                location,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } else {
            return res.json({ status: 'error', error: 'no products found' });
        }
    } catch (error) {
        return res.status(500).json({ status: 'error', error: 'Internal server error' });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { name, price, description, seller } = req.body;
        console.log(req.body);
        const image = req.file ? `/uploads/${req.file.filename}` : '';
        const product = await Product.create({ seller, name, price, description, image });
        return res.json({ status: 'ok' });
    } catch (err) {
        return res.json({ status: 'error', error: 'Error adding product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ status: 'error', error: 'Product ID is required' });
        }
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ status: 'error', error: 'Product not found' });
        }
        if (product.image) {
            const imagePath = path.join(__dirname, '..', 'uploads', path.basename(product.image));
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Failed to delete image:', err);
                }
            });
        }
        return res.json({ status: 'ok', message: 'Product and image deleted' });
    } catch (err) {
        return res.status(500).json({ status: 'error', error: 'Error deleting product' });
    }
};