// là một HTTP client giúp API Gateway giao tiếp với các microservices đã đăng ký trong serviceRegistry.
const axios = require('axios');
const serviceRegistry = require('./serviceRegistry');

class ServiceClient {
  constructor(serviceName) {
    this.serviceName = serviceName;
  }

  async _getServiceInstance() {
    return serviceRegistry.getInstance(this.serviceName);
  }

  async _makeRequest(method, endpoint, data = null, headers = {}) {
    const instance = await this._getServiceInstance();
    const url = `http://${instance.host}:${instance.port}${endpoint}`;

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 5000,
      });
      return response;
    } catch (error) {
      if (error.response) {
        throw error;
      }
      // Nếu service không phản hồi, có thể thử lại với instance khác
      serviceRegistry.unregister(instance.id);
      throw new Error(`Service ${this.serviceName} unavailable`);
    }
  }

  async get(endpoint, headers = {}) {
    return this._makeRequest('get', endpoint, null, headers);
  }

  async post(endpoint, data, headers = {}) {
    return this._makeRequest('post', endpoint, data, headers);
  }

  async put(endpoint, data, headers = {}) {
    return this._makeRequest('put', endpoint, data, headers);
  }

  async delete(endpoint, headers = {}) {
    return this._makeRequest('delete', endpoint, null, headers);
  }
}

module.exports = ServiceClient;
