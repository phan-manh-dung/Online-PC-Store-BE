const EventEmitter = require('events');
const logger = require('../../utils/logger');
class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // Lưu trữ các service
    this.roundRobinCounters = new Map(); // Lưu trữ counter cho Round-Robin của từng service
    this.healthCheckInterval = 120000; // Interval kiểm tra 120 giây
    this._startHealthCheck(); // kiểm tra định kỳ xem service nào die
  }

  // Đăng ký một service instance mới
  register(serviceInfo) {
    // Nhận serviceInfo từ service (gửi từ index.js của các service)
    const { name, host, port, endpoints } = serviceInfo;
    const id = `${name}-${host}-${port}`;
    console.log('Registering service with info:', serviceInfo);

    if (!this.services.has(name)) {
      this.services.set(name, new Map());
      this.roundRobinCounters.set(name, 0); // Khởi tạo counter cho service mới
    }
    const serviceInstances = this.services.get(name);
    serviceInstances.set(id, {
      id,
      name,
      host,
      port,
      endpoints,
      lastHeartbeat: Date.now(),
    });
    logger.info(`Registered service instance: ${id}`);
    return id;
  }

  // Hủy đăng ký một service instance
  unregister(serviceId) {
    for (const [serviceName, instances] of this.services) {
      if (instances.delete(serviceId)) {
        console.log(`Service instance unregistered: ${serviceId}`);
        logger.warn(`Service instance unregistered: ${serviceId}`);
        this.emit('service-unregistered', serviceId);
        if (instances.size === 0) {
          this.services.delete(serviceName);
          this.roundRobinCounters.delete(serviceName); // Xóa counter khi không còn instance
          logger.warn(`No remaining instances for service: ${serviceName}`);
        }
        return true;
      }
    }
    return false;
  }

  // Cập nhật heartbeat cho service
  heartbeat(serviceId) {
    for (const instances of this.services.values()) {
      const instance = instances.get(serviceId);
      if (instance) {
        instance.lastHeartbeat = Date.now();
        logger.info(`💓Heartbeat received from: ${serviceId}`);
        return true;
      }
    }
    logger.warn(`🚫 Heartbeat received from unknown serviceId: ${serviceId}`);
    return false;
  }

  // Lấy một instance khả dụng của service theo Round-Robin
  getInstance(serviceName) {
    console.log('Getting instance for service:', serviceName);
    const instances = this.services.get(serviceName);
    if (!instances || instances.size === 0) {
      logger.error(`🚨 No instances available for service: ${serviceName}`);
      throw new Error(`No instances available for service: ${serviceName}`);
    }

    const instancesArray = Array.from(instances.values());
    // Lấy counter hiện tại, nếu không có thì mặc định là 0
    let counter = this.roundRobinCounters.get(serviceName) || 0;
    // Chọn instance theo index Round-Robin
    const selectedInstance = instancesArray[counter % instancesArray.length];
    // Tăng counter và cập nhật lại
    counter = (counter + 1) % instancesArray.length;
    this.roundRobinCounters.set(serviceName, counter);
    logger.info(`🎯 Selected instance for service [${serviceName}]: ${selectedInstance.id}`);
    return selectedInstance;
  }

  // Health check định kỳ để loại bỏ instance không gửi heartbeat
  _startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      for (const [serviceName, instances] of this.services) {
        for (const [instanceId, instance] of instances) {
          const inactiveDuration = now - instance.lastHeartbeat;
          if (inactiveDuration > this.healthCheckInterval * 3) {
            console.log(`Removing inactive service: ${instanceId}`);
            logger.warn(`💀 Instance ${instanceId} removed (inactive for ${Math.round(inactiveDuration / 1000)}s)`);
            this.unregister(instanceId);
          }
        }
      }
    }, this.healthCheckInterval);
  }
}

module.exports = new ServiceRegistry();
