const axios = require('axios');

const testRateLimit = async () => {
  const url = 'http://localhost:5555/api/search/product/get-all'; // Thay bằng route bạn muốn test

  for (let i = 1; i <= 200; i++) {
    try {
      const res = await axios.get(url);
      console.log(`Request ${i}: Status ${res.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`Request ${i}: Blocked - Status ${error.response.status}`);
        console.log('Message:', error.response.data);
      } else {
        console.log(`Request ${i}: Error`, error.message);
      }
    }
  }
};

testRateLimit();
