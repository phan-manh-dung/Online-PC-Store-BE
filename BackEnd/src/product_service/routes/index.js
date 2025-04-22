const ProductRouter = require('./Product_Route');
const CategoryRouter = require('./Category_Route');
const SupplierRouter = require('./Supplier_Route');
const InventoryRouter = require('./Inventory_Route');
const PromotionRouter = require('./Promotion_Route');
const routes = (app) => {
    app.use('/api/product', ProductRouter);
    app.use('/api/category', CategoryRouter);
    app.use('/api/supplier', SupplierRouter);
    app.use('/api/inventory', InventoryRouter);
    app.use('/api/promotion', PromotionRouter);
};

module.exports = routes;
