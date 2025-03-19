const redis = require('redis');

// Tạo một client để kết nối tới Redis Cloud
const redisClient = redis.createClient({
  url: process.env.REDIS_URI || process.env.REDIS_URL,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis Cloud successfully!');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

// Kết nối tới Redis
(async () => {
  await redisClient.connect();
  const ping = await redisClient.ping();
  console.log('Ping redis:', ping);
})();

module.exports = redisClient;
