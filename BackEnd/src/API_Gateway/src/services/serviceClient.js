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
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] GET request to: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 5000,
      });

      console.log(`[DEBUG] Response received:`, response.data);
      return response;
    } catch (error) {
      console.error(`[ERROR] GET request failed:`, error.message);
      if (error.response) {
        console.error(`[ERROR] Response status:`, error.response.status);
        console.error(`[ERROR] Response data:`, error.response.data);
      }

      serviceRegistry.unregister(instance.id);
      throw new Error(`Service ${this.serviceName} unavailable`);
    }
  }

  // async getPublic(endpoint, headers = {}) {
  //   return this._sendGetRequest(endpoint, headers);
  // }

  // get auth
  async getAuth(endpoint, token, headers = {}) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }

    return this._sendGetRequest(endpoint, {
      ...headers,
      Authorization: `Bearer ${token.trim()}`,
    });
  }

  async _sendGetRequest(endpoint, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] GET request to: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 5000,
      });

      console.log(`[DEBUG] Response received:`, response.data);
      return response;
    } catch (error) {
      console.error(`[ERROR] GET request failed:`, error.message);
      if (error.response) {
        console.error(`[ERROR] Response status:`, error.response.status);
        console.error(`[ERROR] Response data:`, error.response.data);
      }

      serviceRegistry.unregister(instance.id);
      throw new Error(`Service ${this.serviceName} unavailable`);
    }
  }

  // delete auth
  async deleteAuth(endpoint, token, headers = {}) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }

    return this._sendDeleteRequest(endpoint, {
      ...headers,
      Authorization: `Bearer ${token.trim()}`,
    });
  }

  async _sendDeleteRequest(endpoint, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] DELETE request to: ${url}`);

    try {
      const response = await axios.delete(url, {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 5000,
      });

      console.log(`[DEBUG] Response received:`, response.data);
      return response;
    } catch (error) {
      console.error(`[ERROR] GET request failed:`, error.message);
      if (error.response) {
        console.error(`[ERROR] Response status:`, error.response.status);
        console.error(`[ERROR] Response data:`, error.response.data);
      }

      serviceRegistry.unregister(instance.id);
      throw new Error(`Service ${this.serviceName} unavailable`);
    }
  }

  // post
  async post(endpoint, data, headers = {}) {
    return this._makeRequest('post', endpoint, data, headers);
  }

  // post auth
  async postAuth(endpoint, headers = {}, token) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }

    return this._sendPostRequest(endpoint, headers, token.trim());
  }

  async _sendPostRequest(endpoint, headers = {}, token) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] POST request to: ${url}`);

    try {
      const response = await axios.post(
        url,
        { refreshToken: token },
        {
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          timeout: 5000,
        },
      );

      console.log(`[DEBUG] Response received:`, response.data);
      return response;
    } catch (error) {
      console.error(`[ERROR] GET request failed:`, error.message);
      if (error.response) {
        console.error(`[ERROR] Response status:`, error.response.status);
        console.error(`[ERROR] Response data:`, error.response.data);
      }

      serviceRegistry.unregister(instance.id);
      throw new Error(`Service ${this.serviceName} unavailable`);
    }
  }

  // put
  async put(endpoint, data, headers = {}) {
    return this._makeRequest('put', endpoint, data, headers);
  }
}

module.exports = ServiceClient;
