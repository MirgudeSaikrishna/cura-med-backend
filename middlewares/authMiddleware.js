const jwt = require('jsonwebtoken');
const Seller = require('../models/seller');

const authMiddleware = async (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const email = decoded.email;
            const user = await Seller.findOne({ email: email });
            if (user) {
                next();
            } else {
                return res.json({ status: 'error', error: 'Unauthorised' });
            }
        } catch (err) {
            return res.json({ status: 'error', error: 'Invalid token' });
        }
    } else {
        return res.json({ status: 'error', error: 'No token provided' });
    }
};
module.exports = authMiddleware;