const axios = require('axios');
const CircuitBreaker = require('opossum');
const serviceRegistry = require('./serviceRegistry');

class ServiceClient {
  constructor(serviceName) {
    this.serviceName = serviceName;

    this.breaker = new CircuitBreaker(this._sendRequest.bind(this), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 4000,
      maxFailures: 5,
    });

    this.breaker.on('open', () => {
      console.log(`Circuit Breaker OPEN for ${this.serviceName}: Too many failures`);
    });
    this.breaker.on('halfOpen', () => {
      console.log(`Circuit Breaker HALF-OPEN for ${this.serviceName}: Attempting to recover`);
    });
    this.breaker.on('close', () => {
      console.log(`Circuit Breaker CLOSED for ${this.serviceName}: Service recovered`);
    });
  }

  async _getServiceInstance() {
    return serviceRegistry.getInstance(this.serviceName);
  }

  // Hàm delay để chờ giữa các lần retry
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async _sendRequest({ method, url, data, headers }) {
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
  }

  async _makeRequest(method, endpoint, data = null, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }
    const url = `http://${instance.host}:${instance.port}${endpoint}`;

    const maxRetries = 3; // Thử tối đa 3 lần
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({ method, url, data, headers });
        console.log(`[DEBUG] Request to ${url} succeeded on attempt ${retryCount + 1}`);
        return response;
      } catch (error) {
        console.error(`[ERROR] Request to ${url} failed on attempt ${retryCount + 1}:`, error.message);
        if (error.response) {
          // Nếu lỗi từ service (401, 403, 500), không retry mà ném lỗi ngay
          console.error(`[ERROR] Status: ${error.response.status}, Data:`, error.response.data);
          throw error;
        }

        retryCount++;
        if (retryCount === maxRetries) {
          // Hết số lần thử, kiểm tra Circuit Breaker
          if (this.breaker.opened) {
            throw new Error(`Service ${this.serviceName} temporarily unavailable due to repeated failures`);
          }
          //  serviceRegistry.unregister(instance.id);
          throw new Error(`Service ${this.serviceName} unavailable after ${maxRetries} retries`);
        }

        // Đợi 3 giây trước khi thử lại
        console.log(`Retrying request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
    }
  }

  async get(endpoint, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }
    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] GET request to: ${url}`);

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
        console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(`[ERROR] GET request failed on attempt ${retryCount + 1}:`, error.message);
        if (error.response) {
          console.error(`[ERROR] Status: ${error.response.status}, Data:`, error.response.data);
          throw error;
        }

        retryCount++;
        if (retryCount === maxRetries) {
          if (this.breaker.opened) {
            throw new Error(`Service ${this.serviceName} temporarily unavailable due to repeated failures`);
          }
          serviceRegistry.unregister(instance.id);
          throw new Error(`Service ${this.serviceName} unavailable after ${maxRetries} retries`);
        }

        console.log(`Retrying GET request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
    }
  }

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

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
        console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(`[ERROR] GET request failed on attempt ${retryCount + 1}:`, error.message);
        if (error.response) {
          console.error(`[ERROR] Status: ${error.response.status}, Data:`, error.response.data);
          throw error;
        }

        retryCount++;
        if (retryCount === maxRetries) {
          if (this.breaker.opened) {
            throw new Error(`Service ${this.serviceName} temporarily unavailable due to repeated failures`);
          }
          serviceRegistry.unregister(instance.id);
          throw new Error(`Service ${this.serviceName} unavailable after ${maxRetries} retries`);
        }

        console.log(`Retrying GET request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
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

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({
          method: 'delete',
          url,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
        console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(`[ERROR] DELETE request failed on attempt ${retryCount + 1}:`, error.message);
        if (error.response) {
          console.error(`[ERROR] Status: ${error.response.status}, Data:`, error.response.data);
          throw error;
        }

        retryCount++;
        if (retryCount === maxRetries) {
          if (this.breaker.opened) {
            throw new Error(`Service ${this.serviceName} temporarily unavailable due to repeated failures`);
          }
          serviceRegistry.unregister(instance.id);
          throw new Error(`Service ${this.serviceName} unavailable after ${maxRetries} retries`);
        }

        console.log(`Retrying DELETE request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
    }
  }

  // post
  async post(endpoint, data, headers = {}) {
    return this._makeRequest('post', endpoint, data, headers);
  }

  async postAuth(endpoint, data = {}, headers = {}) {
    // Kiểm tra token hợp lệ trước khi gửi yêu cầu
    const token = headers.Authorization && headers.Authorization.split(' ')[1]; 
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }
    return this._sendPostRequest(endpoint, data, token.trim(), headers); 
  }
  
  async _sendPostRequest(endpoint, data = {}, token, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }
  
    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] POST request to: ${url}`);
  
    const maxRetries = 3;
    let retryCount = 0;
  
    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({
          method: 'post',
          url,
          data, 
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`, 
            ...headers, 
          },
        });
        console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(`[ERROR] POST request failed on attempt ${retryCount + 1}:`, error.message);
  
        if (error.response) {
          // Nếu có lỗi từ service, in thông tin lỗi và ném lại lỗi
          console.error(`[ERROR] Status: ${error.response.status}, Data:`, error.response.data);
          throw error;
        }
  
        // Nếu lỗi không phải từ response, retry lại yêu cầu
        retryCount++;
        if (retryCount === maxRetries) {
          if (this.breaker.opened) {
            throw new Error(`Service ${this.serviceName} temporarily unavailable due to repeated failures`);
          }
          serviceRegistry.unregister(instance.id);
          throw new Error(`Service ${this.serviceName} unavailable after ${maxRetries} retries`);
        }
  
        // Đợi 3 giây trước khi thử lại
        console.log(`Retrying POST request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
    }
  }
  

  // put
  async put(endpoint, data, headers = {}) {
    return this._makeRequest('put', endpoint, data, headers);
  }
}

module.exports = ServiceClient;
