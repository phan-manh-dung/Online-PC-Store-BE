const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const serviceRegistry = require('./src/services/serviceRegistry');
const listEndpoints = require('express-list-endpoints');
const path = require('path');

const app = express();

// Routes
const userRoutes = require('./src/routes/userRouter');
const productRoutes = require('./src/routes/productRouter');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Middleware
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something broke!',
    error: err.message,
  });
});

app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);

const apiCallCounts = {};
const apiLastCalled = {};

// Middleware để theo dõi lượt gọi API
app.use((req, res, next) => {
  const path = req.path;
  const method = req.method;
  const key = `${method}:${path}`;

  // Tăng số lượt gọi API
  apiCallCounts[key] = (apiCallCounts[key] || 0) + 1;

  // Cập nhật thời gian gọi API gần nhất
  apiLastCalled[key] = new Date().toISOString();

  next();
});

// API endpoint để lấy thông tin về lượt gọi API
app.get('/api-stats', (req, res) => {
  res.json({
    callCounts: apiCallCounts,
    lastCalled: apiLastCalled,
  });
});

app.get('/api-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-dashboard.html'));
});

app.get('/list-api', (req, res) => {
  res.json(listEndpoints(app));
});

// Đăng ký API Gateway như một service
serviceRegistry.register({
  name: 'api-gateway',
  host: process.env.HOST || 'localhost',
  port: process.env.PORT || 5555,
  endpoints: ['/api/user/*', '/api/product/*'],
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Service Registry endpoint
app.post('/register', (req, res) => {
  try {
    const serviceId = serviceRegistry.register(req.body);
    res.json({ success: true, serviceId });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Thêm route này vào server.js của API Gateway
app.get('/debug/services', (req, res) => {
  const servicesDebug = {};
  for (const [name, instances] of serviceRegistry.services) {
    servicesDebug[name] = Array.from(instances.values());
  }
  res.json({
    services: servicesDebug,
    timestamp: new Date().toISOString(),
  });
});

app.post('/unregister/:serviceId', (req, res) => {
  const success = serviceRegistry.unregister(req.params.serviceId);
  res.json({ success });
});

app.post('/heartbeat/:serviceId', (req, res) => {
  const success = serviceRegistry.heartbeat(req.params.serviceId);
  res.json({ success });
});

// Thêm route này vào server.js của API Gateway
app.get('/services', (req, res) => {
  const services = {};
  for (const [name, instances] of serviceRegistry.services) {
    services[name] = Array.from(instances.values());
  }
  res.json(services);
});

const PORT = process.env.PORT || 5555;
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});
