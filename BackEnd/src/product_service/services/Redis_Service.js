const redis = require('../config/redis');

const setCache = (key, value, expiry = 3600) => {
  try {
    return redis.setex(key, expiry, JSON.stringify(value));  // Chuyển đổi đối tượng thành chuỗi JSON
  } catch (error) {
    console.error('Error setting cache:', error);
    throw new Error('Failed to set cache');
  }
};

const getCache = (key) => {
  return redis.get(key).then(data => {
    if (data) {
      try {
        return JSON.parse(data); 
      } catch (err) {
        console.error('Error parsing JSON from Redis:', err);
        return null;
      }
    }
    return null; 
  }).catch((error) => {
    console.error('Error retrieving cache:', error);
    return null;  
  });
};

const deleteCache = (key) => {
  return redis.del(key).catch((error) => {
    console.error('Error deleting cache:', error);
    throw new Error('Failed to delete cache');
  });
};

module.exports = {
  setCache,
  getCache,
  deleteCache
};
