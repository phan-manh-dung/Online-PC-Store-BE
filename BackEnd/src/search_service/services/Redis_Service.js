const redis = require('../config/redis');
const setCache = (key, value, expiry = 3600) => {
  return redis.setex(key, expiry, JSON.stringify(value));
};

// Lấy dữ liệu từ Redis
const getCache = (key) => {
  return redis.get(key).then(data => {
    if (data) {
      return JSON.parse(data); 
    }
    return null; 
  });
};

module.exports = {
  setCache,
  getCache
};
