const Redis = require('ioredis');
require('dotenv').config();
const redis = new Redis({
  host: process.env.REDIS_HOST, 
  port: process.env.REDIS_PORT,       
  //password: process.env.REDIS_PASSWORD, 
  db: process.env.REDIS_DB,            
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redis;
