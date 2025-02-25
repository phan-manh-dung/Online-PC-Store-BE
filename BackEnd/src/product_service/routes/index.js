const ProductRouter = require('./Product_Route');
const routes = (app) => {
    app.use('/api/product', ProductRouter);
};

module.exports = routes;
