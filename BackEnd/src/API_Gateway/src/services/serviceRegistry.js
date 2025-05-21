const EventEmitter = require('events');
//const logger = require('../../utils/logger');
class ServiceRegistry extends EventEmitter {
  constructor() {
    super();
    this.services = new Map(); // Store services
    this.roundRobinCounters = new Map(); // Store Round-Robin counters for each service
    this.healthCheckInterval = 60000; // 120 seconds check interval
    this._startHealthCheck(); // Regularly check for dead services
  }

  // Register a new service instance
  register(serviceInfo) {
    const { name, baseUrl, endpoints } = serviceInfo;
    // Generate a unique ID for this service instance
    const timestamp = Date.now();
    const id = `${name}_${timestamp}`;
    console.log('Registering service with info:', serviceInfo);
    console.log('Generated service ID:', id);

    if (!this.services.has(name)) {
      this.services.set(name, new Map());
      this.roundRobinCounters.set(name, 0); // Initialize counter for new service
    }

    const serviceInstances = this.services.get(name);
    serviceInstances.set(id, {
      id: id,
      name,
      baseUrl,
      endpoints,
      lastHeartbeat: Date.now(),
    });

    // Log registered services for debugging
    console.log(`Registered service instance: ${id}`);
    console.log(
      'Current services:',
      Array.from(this.services.entries()).map(([name, instances]) => {
        return {
          name,
          instances: Array.from(instances.values()).map((i) => i.id),
        };
      }),
    );

    return id;
  }

  // Unregister a service instance
  unregister(serviceId) {
    console.log(`Attempting to unregister service: ${serviceId}`);
    for (const [serviceName, instances] of this.services) {
      if (instances.delete(serviceId)) {
        console.log(`Service instance unregistered: ${serviceId}`);
        this.emit('service-unregistered', serviceId);
        if (instances.size === 0) {
          this.services.delete(serviceName);
          this.roundRobinCounters.delete(serviceName); // Remove counter when no instances remain
          console.log(`No remaining instances for service: ${serviceName}`);
        }
        return true;
      }
    }
    console.log(`Failed to unregister unknown service: ${serviceId}`);
    return false;
  }

  // Update heartbeat for service
  heartbeat(serviceId) {
    console.log(`Received heartbeat from: ${serviceId}`);
    let found = false;

    for (const [serviceName, instances] of this.services) {
      const instance = instances.get(serviceId);
      if (instance) {
        instance.lastHeartbeat = Date.now();
        console.log(`Updated heartbeat for: ${serviceId}`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`Heartbeat received from unknown serviceId: ${serviceId}`);
    }

    return found;
  }

  // Get an available service instance using Round-Robin
  getInstance(serviceName) {
    console.log(`Getting instance for service: ${serviceName}`);
    console.log('Available services:', Array.from(this.services.keys()));

    const instances = this.services.get(serviceName);
    if (!instances || instances.size === 0) {
      console.error(`No instances available for service: ${serviceName}`);
      throw new Error(`No instances available for service: ${serviceName}`);
    }

    const instancesArray = Array.from(instances.values());
    console.log(`Found ${instancesArray.length} instances for ${serviceName}`);

    let counter = this.roundRobinCounters.get(serviceName) || 0;
    const selectedInstance = instancesArray[counter % instancesArray.length];
    this.roundRobinCounters.set(serviceName, (counter + 1) % instancesArray.length);

    console.log(`Selected instance for service [${serviceName}]: ${selectedInstance.id}`);
    return selectedInstance;
  }

  // Regular health check to remove instances that aren't sending heartbeats
  _startHealthCheck() {
    setInterval(() => {
      const now = Date.now();
      for (const [serviceName, instances] of this.services) {
        for (const [instanceId, instance] of instances) {
          const inactiveDuration = now - instance.lastHeartbeat;
          if (inactiveDuration > this.healthCheckInterval * 3) {
            console.log(
              `Removing inactive service: ${instanceId} (inactive for ${Math.round(inactiveDuration / 1000)}s)`,
            );
            this.unregister(instanceId);
          }
        }
      }
    }, this.healthCheckInterval);
  }

  // Debug method to list all registered services
  listServices() {
    const services = {};
    for (const [serviceName, instances] of this.services) {
      services[serviceName] = Array.from(instances.values()).map((inst) => ({
        id: inst.id,
        baseUrl: inst.baseUrl,
        lastHeartbeat: new Date(inst.lastHeartbeat).toISOString(),
      }));
    }
    return services;
  }
}

module.exports = new ServiceRegistry();
