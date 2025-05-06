const Redis = require('ioredis');
require('dotenv').config();
const redis = new Redis('redis://:HxYilmEbMtWoNFit7zEe7MDhsBBW7Nkd@redis-11521.c292.ap-southeast-1-1.ec2.redns.redis-cloud.com:11521/0');

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = redis;
