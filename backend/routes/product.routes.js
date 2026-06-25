const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock } = require('../controllers/product.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);
router.get('/', getProducts);
router.post('/', authorize('superAdmin', 'operationsManager'), createProduct);
router.get('/:id', getProduct);
router.put('/:id', authorize('superAdmin', 'operationsManager'), updateProduct);
router.delete('/:id', authorize('superAdmin'), deleteProduct);
router.patch('/:id/stock', authorize('superAdmin', 'operationsManager'), updateStock);

module.exports = router;
