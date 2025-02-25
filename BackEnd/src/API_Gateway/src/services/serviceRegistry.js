const EventEmitter = require('events');
class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // lưu trữ service
    this.healthCheckInterval = 60000; //  interval kiểm tra 60 giây
    this._startHealthCheck();
  }

  // Đăng ký một service instance mới
  register(serviceInfo) {
    const { name, host, port, endpoints } = serviceInfo;
    const id = `${name}-${host}-${port}`;
    // Thêm log để debug
    console.log('Registering service with info:', serviceInfo);
    if (!this.services.has(name)) {
      this.services.set(name, new Map());
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

    // Log trạng thái sau khi đăng ký
    console.log(
      'Services after registration:',
      Array.from(this.services.entries()).map(([name, instances]) => ({
        name,
        instances: Array.from(instances.values()),
      })),
    );

    return id;
  }

  // Hủy đăng ký một service instance
  unregister(serviceId) {
    for (const [serviceName, instances] of this.services) {
      if (instances.delete(serviceId)) {
        console.log(`Service unregistered: ${serviceId}`);
        this.emit('service-unregistered', serviceId);
        if (instances.size === 0) {
          this.services.delete(serviceName);
        }
        return true;
      }
    }
    return false;
  }

  // Cập nhật heartbeat cho service và check hoạt động
  heartbeat(serviceId) {
    for (const instances of this.services.values()) {
      const instance = instances.get(serviceId);
      if (instance) {
        instance.lastHeartbeat = Date.now();
        return true;
      }
    }
    return false;
  }

  // Lấy một instance khả dụng của service check service tồn tại và có instances
  getInstance(serviceName) {
    // Thêm log để debug
    console.log('Getting instance for service:', serviceName);
    console.log(
      'Available services:',
      Array.from(this.services.entries()).map(([name, instances]) => ({
        name,
        instances: Array.from(instances.values()),
      })),
    );

    const instances = this.services.get(serviceName);
    if (!instances || instances.size === 0) {
      throw new Error(`No instances available for service: ${serviceName}`);
    }

    const instancesArray = Array.from(instances.values());
    return instancesArray[Math.floor(Math.random() * instancesArray.length)];
  }

  // Health check định kỳ
  _startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      for (const [serviceName, instances] of this.services) {
        for (const [instanceId, instance] of instances) {
          // Tăng thời gian timeout lên
          if (now - instance.lastHeartbeat > this.healthCheckInterval * 3) {
            console.log(`Removing inactive service: ${instanceId}`);
            this.unregister(instanceId);
          }
        }
      }
    }, this.healthCheckInterval);
  }
}

module.exports = new ServiceRegistry();
