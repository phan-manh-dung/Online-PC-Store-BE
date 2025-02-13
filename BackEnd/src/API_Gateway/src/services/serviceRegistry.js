const axios = require('axios');

const serviceRegistry = {
    user: {
        baseURL: process.env.USER_SERVICE || 'http://localhost:5001',
        timeout: 5000
    },
    product: {
        baseURL: process.env.PRODUCT_SERVICE || 'http://localhost:5002',
        timeout: 5000
    }
};

// Tạo axios instance cho mỗi service
const createServiceClient = (config) => {
    return axios.create({
        ...config,
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// Khởi tạo clients
const clients = {
    user: createServiceClient(serviceRegistry.user),
    product: createServiceClient(serviceRegistry.product)
};

module.exports = clients;
