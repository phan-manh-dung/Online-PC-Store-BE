const axios = require('axios');
const CircuitBreaker = require('opossum');
const serviceRegistry = require('./serviceRegistry');

class ServiceClient {
  constructor(serviceName) {
    this.serviceName = serviceName;

    this.breaker = new CircuitBreaker(this._sendRequest.bind(this), {
      timeout: 4000, // Maximum waiting time for client
      errorThresholdPercentage: 50, // Allowed error rate (50%)
      resetTimeout: 2000, // Time to wait before circuit check
      maxFailures: 3, // Maximum failures before opening circuit
    });

    this.breaker.on('open', () => {
      console.warn(`Circuit Breaker OPEN for ${this.serviceName}: Too many failures`);
    });

    this.breaker.on('halfOpen', () => {
      console.info(`Circuit Breaker HALF-OPEN for ${this.serviceName}: Attempting to recover`);
    });

    this.breaker.on('close', () => {
      console.info(`Circuit Breaker CLOSED for ${this.serviceName}: Service recovered`);
    });
  }

  async _getServiceInstance() {
    try {
      return serviceRegistry.getInstance(this.serviceName);
    } catch (error) {
      console.error(`Failed to get instance for ${this.serviceName}: ${error.message}`);
      console.log('Available services:', serviceRegistry.listServices());
      throw error;
    }
  }

  _delay(retryCount) {
    const baseDelay = 1000; // Base time between retries
    const maxDelay = 2000; // Maximum time between retries
    const delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount)); // Exponential calculation
    console.debug(`Waiting ${delay / 1000}s before retry #${retryCount}`);
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  async _sendRequest({ method, url, data, headers }) {
    console.log(`Sending ${method} request to ${url}`);
    const start = Date.now();

    try {
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        timeout: 5000, // Maximum waiting time for request
      });

      const duration = Date.now() - start;
      console.info(`Request to ${url} succeeded in ${duration}ms`);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Request to ${url} failed after ${duration}ms: ${error.message}`);

      if (error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(`Response data:`, error.response.data);
      }

      throw error;
    }
  }

  async _makeRequest(method, endpoint, data = null, headers = {}) {
    console.info(`Making ${method} request to ${this.serviceName}${endpoint}`);

    const instance = await this._getServiceInstance();
    if (!instance) {
      const msg = `No available instances for ${this.serviceName}`;
      console.error(msg);
      throw new Error(msg);
    }

    const url = `${instance.baseUrl}${endpoint}`;
    console.log(`Resolved service URL: ${url}`);

    const maxRetries = 2; // Maximum retry attempts if request fails
    let retryCount = 0; // Retry counter

    while (retryCount < maxRetries) {
      try {
        console.debug(`Sending request to ${url} (Attempt ${retryCount + 1})`);
        const response = await this.breaker.fire({ method, url, data, headers });
        console.debug(`Request to ${url} succeeded on attempt ${retryCount + 1}`);
        return response;
      } catch (error) {
        console.error(`Request to ${url} failed on attempt ${retryCount + 1}: ${error.message}`);

        if (error.response) {
          console.error(`Status: ${error.response.status}`);
          throw error;
        }

        retryCount++;

        if (retryCount === maxRetries) {
          const msg = this.breaker.opened
            ? `Circuit breaker OPEN – ${this.serviceName} temporarily unavailable after ${retryCount} retries`
            : `${this.serviceName} unavailable after ${maxRetries} retries`;
          console.error(msg);
          throw new Error(msg);
        }

        await this._delay(retryCount);
        console.info(`Retrying request to ${url} (Attempt ${retryCount + 1}/${maxRetries})`);
      }
    }
  }

  async get(endpoint, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      console.error(`[ERROR] No available instances for ${this.serviceName}`);
      throw new Error(`No available instances for ${this.serviceName}`);
    }
    const url = `${instance.baseUrl}${endpoint}`;
    console.log(`[DEBUG] [GET] Resolved service URL: ${url}`);
    console.log(`[DEBUG] [GET] Instance info:`, instance);

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
        console.log(`[DEBUG] [GET] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(`[ERROR] [GET] Request to ${url} failed on attempt ${retryCount + 1}:`, error.message);
        if (error.response) {
          console.error(`[ERROR] [GET] Status: ${error.response.status}, Data:`, error.response.data);
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
        console.log(
          `[DEBUG] [GET] Retrying GET request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`,
        );
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
      console.error(`[ERROR] No available instances for ${this.serviceName}`);
      throw new Error(`No available instances for ${this.serviceName}`);
    }
    const url = `${instance.baseUrl}${endpoint}`;
    console.log(`[DEBUG] [_sendGetRequest] Resolved service URL: ${url}`);
    console.log(`[DEBUG] [_sendGetRequest] Instance info:`, instance);

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
        // console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
        return response;
      } catch (error) {
        console.error(
          `[ERROR] [_sendGetRequest] Request to ${url} failed on attempt ${retryCount + 1}:`,
          error.message,
        );
        if (error.response) {
          console.error(`[ERROR] [_sendGetRequest] Status: ${error.response.status}, Data:`, error.response.data);
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
        console.log(
          `[DEBUG] [_sendGetRequest] Retrying GET request to ${url} in 3 seconds... (Attempt ${
            retryCount + 1
          }/${maxRetries})`,
        );
        await this._delay(3000);
      }
    }
  }

  // getAuth for Order Stats
  async getAuthForOrderStats(endpoint, token, queryParams = {}, headers = {}) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }
    return this._sendGetRequestForOrderStats(
      endpoint,
      {
        ...headers,
        Authorization: `Bearer ${token.trim()}`,
      },
      queryParams,
    );
  }

  async _sendGetRequestForOrderStats(endpoint, headers = {}, queryParams = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      console.error(`[ERROR] No available instances for ${this.serviceName}`);
      throw new Error(`No available instances for ${this.serviceName}`);
    }
    const url = `${instance.baseUrl}${endpoint}`;
    console.log(`[DEBUG] [_sendGetRequestForOrderStats] Resolved service URL: ${url}`, queryParams);
    console.log(`[DEBUG] [_sendGetRequestForOrderStats] Instance info:`, instance);

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          params: queryParams,
        });
        return response;
      } catch (error) {
        console.error(
          `[ERROR] [_sendGetRequestForOrderStats] Request to ${url} failed on attempt ${retryCount + 1}:`,
          error.message,
        );
        if (error.response) {
          console.error(
            `[ERROR] [_sendGetRequestForOrderStats] Status: ${error.response.status}, Data:`,
            error.response.data,
          );
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
        console.log(
          `[DEBUG] [_sendGetRequestForOrderStats] Retrying GET request to ${url} in 3 seconds... (Attempt ${
            retryCount + 1
          }/${maxRetries})`,
        );
        await this._delay(3000);
      }
    }
  }

  // delete
  async delete(endpoint, headers = {}) {
    console.log(`ServiceClient - Sending DELETE to ${endpoint} with headers:`, headers);
    const response = await this._makeRequest('delete', endpoint, null, headers); // Không gửi data
    console.log(`ServiceClient - DELETE response:`, response.data);
    return response;
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

  // gửi token về cho service con để xác thực
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
  async _sendPutRequest(endpoint, data = {}, token, headers = {}) {
    const instance = await this._getServiceInstance();
    if (!instance) {
      throw new Error(`No available instances for ${this.serviceName}`);
    }

    const url = `http://${instance.host}:${instance.port}${endpoint}`;
    console.log(`[DEBUG] PUT request to: ${url}`);

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        const response = await this.breaker.fire({
          method: 'put', // Chỉ cần thay đổi phương thức từ 'post' thành 'put'
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
        console.error(`[ERROR] PUT request failed on attempt ${retryCount + 1}:`, error.message);

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
        console.log(`Retrying PUT request to ${url} in 3 seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
        await this._delay(3000);
      }
    }
  }

  async putAuth(endpoint, data = {}, headers = {}) {
    // Kiểm tra token hợp lệ trước khi gửi yêu cầu
    const token = headers.Authorization && headers.Authorization.split(' ')[1];
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }
    return this._sendPutRequest(endpoint, data, token.trim(), headers);
  }

  // put
  async put(endpoint, data, headers = {}) {
    return this._makeRequest('put', endpoint, data, headers);
  }

  //patch
  async patch(endpoint, headers = {}) {
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
          method: 'patch',
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
  async patchAuth(endpoint, token, headers = {}) {
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Invalid authentication token');
    }
    return this._sendPatchRequest(endpoint, {
      ...headers,
      Authorization: `Bearer ${token.trim()}`,
    });
  }

  async _sendPatchRequest(endpoint, headers = {}) {
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
          method: 'patch',
          url,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
        // console.log(`[DEBUG] Response received on attempt ${retryCount + 1}:`, response.data);
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
}

module.exports = ServiceClient;
