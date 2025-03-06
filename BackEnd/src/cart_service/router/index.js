const CartRouter = require('./CartRouter');
const routes = (app) => {
  app.use('/api/cart', CartRouter);
};

module.exports = routes;
