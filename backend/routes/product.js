const express = require('express');
const router = express.Router();

const {
    getProducts,
    newProduct,
    getSignalProduct,
    updateProduct,
    deleteProduct

} = require('../controllers/productController')

const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');

router.route('/products').get(getProducts);

router.route('/product/:id').get(getSignalProduct);

router.route('/admin/product/new').post(isAuthenticatedUser,authorizeRoles('admin'), newProduct);

router.route('/admin/product/:id')
    .put(isAuthenticatedUser,authorizeRoles('admin'), updateProduct) 
    .delete(isAuthenticatedUser, authorizeRoles('admin'), deleteProduct);

module.exports = router;