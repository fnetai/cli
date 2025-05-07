# Research: @fnet/service Package Analysis

## Overview

This research document examines the @fnet/service npm package and its relevance to Flownet CLI. The package provides cross-platform service management capabilities for Flownet projects, enabling structured and controlled management of system services across Windows, macOS, and Linux operating systems. It serves as a unified interface for registering, unregistering, starting, stopping, and monitoring services, abstracting away the platform-specific implementation details.

## Details

### Package Purpose and Functionality

The @fnet/service package serves as a cross-platform service management utility for Flownet CLI projects. Its primary purpose is to provide a consistent, platform-agnostic API for managing system services across Windows, macOS, and Linux, abstracting away the complexities of each platform's service management systems.

The package builds upon Node.js's child process capabilities to interact with the native service management tools of each operating system:

- **Windows**: Uses Windows Service Control Manager (`sc` commands)
- **macOS**: Uses `launchctl` and `.plist` files
- **Linux**: Uses `systemd` service management

At its core, @fnet/service transforms a unified configuration object into platform-specific service definitions and commands, handling all the low-level details of service registration, control, and monitoring while providing a high-level API for developers.

### Key Features

1. **Cross-Platform Service Management**
   - Unified API across Windows, macOS, and Linux
   - Automatic platform detection and implementation selection
   - Example:
     ```javascript
     import manageService from '@fnet/service';

     // Works on any supported platform
     await manageService({
       action: 'register',
       name: 'MyService',
       description: 'My service description',
       command: ['node', '/path/to/app.js']
     });
     ```

2. **Service Registration and Unregistration**
   - Create and remove services from system service managers
   - Support for service descriptions and metadata
   - Example:
     ```javascript
     // Register a service
     await manageService({
       action: 'register',
       name: 'MyService',
       description: 'A demo service',
       command: ['node', '/path/to/app.js']
     });

     // Unregister a service
     await manageService({
       action: 'unregister',
       name: 'MyService'
     });
     ```

3. **Service Control**
   - Start, stop, and enable services
   - Configurable auto-start behavior
   - Example:
     ```javascript
     // Start a service
     await manageService({
       action: 'start',
       name: 'MyService'
     });

     // Stop a service
     await manageService({
       action: 'stop',
       name: 'MyService'
     });
     ```

4. **Service Monitoring**
   - Check service status (running, stopped, failed, unknown)
   - Health monitoring with detailed diagnostics
   - Service configuration inspection
   - Example:
     ```javascript
     // Check service status
     const status = await manageService({
       action: 'status',
       name: 'MyService'
     });

     // Check service health
     const health = await manageService({
       action: 'health',
       name: 'MyService'
     });
     ```

5. **Environment Variable Management**
   - Set environment variables for services
   - Platform-specific environment variable handling
   - Example:
     ```javascript
     await manageService({
       action: 'register',
       name: 'MyService',
       description: 'Service with environment variables',
       command: ['node', '/path/to/app.js'],
       env: {
         NODE_ENV: 'production',
         LOG_LEVEL: 'info'
       }
     });
     ```

6. **Working Directory Configuration**
   - Set working directory for service execution
   - Example:
     ```javascript
     await manageService({
       action: 'register',
       name: 'MyService',
       description: 'Service with working directory',
       command: ['node', '/path/to/app.js'],
       wdir: '/path/to/working/directory'
     });
     ```

7. **User-Level vs. System-Wide Services**
   - Support for both system-wide and user-level services
   - Example:
     ```javascript
     // Register a user-level service
     await manageService({
       action: 'register',
       name: 'MyUserService',
       description: 'User-level service',
       command: ['node', '/path/to/app.js'],
       system: false
     });
     ```

8. **Restart Behavior Configuration**
   - Configure automatic restart on failure
   - Example:
     ```javascript
     await manageService({
       action: 'register',
       name: 'MyService',
       description: 'Service with restart on failure',
       command: ['node', '/path/to/app.js'],
       restartOnFailure: true
     });
     ```

### Integration with Flownet CLI

The @fnet/service package can be integrated into the Flownet CLI ecosystem in several ways:

1. **Service Management Commands**
   - Extend Flownet CLI with service management commands
   - Allow users to register, start, stop, and monitor services
   - Example command structure:
     ```
     fnet service register --name MyService --command "node app.js" --description "My service"
     fnet service start --name MyService
     fnet service status --name MyService
     ```

2. **Project Service Definitions**
   - Allow service definitions in project configuration files
   - Automatically register and manage services based on project configuration
   - Example project configuration:
     ```yaml
     services:
       api:
         description: "API Service"
         command: ["node", "api.js"]
         env:
           NODE_ENV: production
         autoStart: true
     ```

3. **Deployment Workflows**
   - Integrate service management into deployment workflows
   - Automatically register and start services during deployment
   - Example deployment workflow:
     ```yaml
     deploy:
       steps:
         - build
         - test
         - "fnet service register --name MyService --command 'node dist/app.js'"
         - "fnet service start --name MyService"
     ```

4. **Development Environment Setup**
   - Use for managing development services
   - Provide consistent service management across development environments
   - Example development workflow:
     ```yaml
     dev:
       services:
         - name: "api"
           command: ["node", "api.js"]
         - name: "worker"
           command: ["node", "worker.js"]
     ```

### Relationship with Other Flownet Packages

The @fnet/service package can complement several other Flownet packages:

1. **@fnet/shell-flow**
   - @fnet/service could be used within shell-flow command groups for service management
   - Example integration:
     ```yaml
     commands:
       deploy:
         - "npm run build"
         - service:
             action: register
             name: MyService
             description: "My deployed service"
             command: ["node", "dist/app.js"]
         - service:
             action: start
             name: MyService
     ```

2. **@fnet/config**
   - Service definitions could be part of project configuration
   - @fnet/config could load and validate service configurations
   - Example:
     ```javascript
     import { loadConfig } from '@fnet/config';
     import manageService from '@fnet/service';

     const config = loadConfig();
     if (config.services) {
       for (const [name, service] of Object.entries(config.services)) {
         await manageService({
           action: 'register',
           name,
           ...service
         });
       }
     }
     ```

3. **@fnet/yaml**
   - Service definitions could be specified in YAML format
   - @fnet/yaml could parse and enhance service configurations
   - Example:
     ```yaml
     # Enhanced YAML with @fnet/yaml features
     services:
       api:
         description: "API Service"
         command: ["node", "api.js"]
         env:
           NODE_ENV: production
         autoStart: true
         # YAML enhancements like references, includes, etc.
     ```

### Usage Patterns

Common usage patterns for the @fnet/service package include:

1. **Basic Service Registration and Control**

   ```javascript
   import manageService from '@fnet/service';

   // Register a service
   await manageService({
     action: 'register',
     name: 'MyService',
     description: 'A demo service',
     command: ['node', '/path/to/app.js']
   });

   // Start the service
   await manageService({
     action: 'start',
     name: 'MyService'
   });

   // Check service status
   const status = await manageService({
     action: 'status',
     name: 'MyService'
   });

   // Stop the service
   await manageService({
     action: 'stop',
     name: 'MyService'
   });

   // Unregister the service
   await manageService({
     action: 'unregister',
     name: 'MyService'
   });
   ```

2. **Advanced Service Configuration**

   ```javascript
   await manageService({
     action: 'register',
     name: 'AdvancedService',
     description: 'Service with advanced configuration',
     command: ['node', '/path/to/app.js'],
     env: {
       NODE_ENV: 'production',
       LOG_LEVEL: 'info',
       DB_HOST: 'localhost'
     },
     wdir: '/path/to/working/directory',
     user: 'serviceUser',
     autoStart: true,
     restartOnFailure: true,
     system: true
   });
   ```

3. **Service Monitoring and Diagnostics**

   ```javascript
   // Check service status
   const status = await manageService({
     action: 'status',
     name: 'MyService'
   });
   console.log(`Service status: ${status.status}`);

   // Check service health
   const health = await manageService({
     action: 'health',
     name: 'MyService'
   });
   console.log(`Service healthy: ${health.healthy}`);
   if (!health.healthy) {
     console.error(`Error: ${health.error}`);
     console.log(`Logs: ${health.logs}`);
   }

   // Inspect service configuration
   const config = await manageService({
     action: 'inspect',
     name: 'MyService'
   });
   console.log(`Service configuration: ${config.configContent}`);
   ```

4. **User-Level Services**

   ```javascript
   // Register a user-level service
   await manageService({
     action: 'register',
     name: 'UserService',
     description: 'User-level service',
     command: ['node', '/path/to/app.js'],
     system: false
   });

   // Start the user-level service
   await manageService({
     action: 'start',
     name: 'UserService',
     system: false
   });
   ```

### Limitations and Considerations

1. **Platform-Specific Behavior**
   - Despite the unified API, some behaviors may differ across platforms
   - Service registration details and capabilities vary by OS
   - Error messages and diagnostics may be platform-specific

2. **Permission Requirements**
   - System-wide services typically require administrative privileges
   - Permission errors may occur if not run with sufficient privileges
   - User-level services have different capabilities and limitations

3. **Service Naming Constraints**
   - Service names may have platform-specific constraints
   - Some characters may be invalid in certain platforms
   - Name collisions with existing services can cause issues

4. **Command Execution Differences**
   - Command execution environments differ across platforms
   - Environment variable handling varies by OS
   - Working directory behavior may have platform-specific nuances

5. **Restart Behavior Variations**
   - Restart policies are implemented differently across platforms
   - Some platforms offer more sophisticated restart options
   - Restart timing and behavior may vary

6. **Monitoring Capabilities**
   - Health check and monitoring capabilities differ by platform
   - Log access and format varies across operating systems
   - Some diagnostic features may be limited on certain platforms

7. **Security Considerations**
   - Service management often requires elevated privileges
   - Careful validation of user inputs is necessary
   - Service configurations may contain sensitive information

### Implementation Recommendations

1. **Consistent Service Naming**
   - Use simple, alphanumeric service names
   - Avoid special characters that may cause issues on some platforms
   - Consider using prefixes for related services
   - Example:
     ```javascript
     // Good naming pattern
     const serviceName = 'flownet-api-service';

     // Avoid special characters
     // const serviceName = 'flownet:api/service'; // Problematic
     ```

2. **Privilege Management**
   - Clearly document when elevated privileges are required
   - Provide helpful error messages for permission issues
   - Consider using user-level services when possible
   - Example:
     ```javascript
     try {
       await manageService({
         action: 'register',
         name: 'SystemService',
         description: 'System-wide service',
         command: ['node', 'app.js'],
         system: true
       });
     } catch (error) {
       if (error.message.includes('Permission denied')) {
         console.error('This operation requires administrative privileges.');
         // Offer alternatives or instructions
       }
     }
     ```

3. **Error Handling Strategy**
   - Implement comprehensive error handling
   - Provide platform-specific troubleshooting guidance
   - Consider fallback options for failed operations
   - Example:
     ```javascript
     try {
       await manageService({
         action: 'start',
         name: 'MyService'
       });
     } catch (error) {
       console.error(`Failed to start service: ${error.message}`);

       // Check for specific error conditions
       if (error.message.includes('not found')) {
         console.log('Service not registered. Attempting registration...');
         try {
           await manageService({
             action: 'register',
             name: 'MyService',
             description: 'Auto-registered service',
             command: ['node', 'app.js']
           });
           console.log('Service registered successfully.');
         } catch (regError) {
           console.error(`Registration failed: ${regError.message}`);
         }
       }
     }
     ```

4. **Service Configuration Management**
   - Store service configurations for reference and reuse
   - Implement validation for service configurations
   - Consider versioning service definitions
   - Example:
     ```javascript
     // Define service configurations
     const serviceConfigs = {
       api: {
         description: 'API Service',
         command: ['node', 'api.js'],
         env: { NODE_ENV: 'production' }
       },
       worker: {
         description: 'Background Worker',
         command: ['node', 'worker.js'],
         env: { NODE_ENV: 'production' }
       }
     };

     // Register services from configurations
     for (const [name, config] of Object.entries(serviceConfigs)) {
       await manageService({
         action: 'register',
         name,
         ...config
       });
     }
     ```

5. **Platform-Specific Optimizations**
   - Consider platform-specific features when needed
   - Provide platform-specific configuration options
   - Document platform differences clearly
   - Example:
     ```javascript
     const platform = os.platform();
     let serviceConfig = {
       action: 'register',
       name: 'MyService',
       description: 'Cross-platform service',
       command: ['node', 'app.js']
     };

     // Platform-specific optimizations
     if (platform === 'win32') {
       serviceConfig.env = { ...serviceConfig.env, WINDIR: process.env.WINDIR };
     } else if (platform === 'darwin') {
       serviceConfig.system = false; // Prefer user-level on macOS
     } else if (platform === 'linux') {
       serviceConfig.user = 'nobody'; // Use specific user on Linux
     }

     await manageService(serviceConfig);
     ```

6. **Service Monitoring and Maintenance**
   - Implement regular health checks for critical services
   - Set up automated recovery procedures
   - Log service events for troubleshooting
   - Example:
     ```javascript
     // Regular health check function
     async function monitorService(name) {
       try {
         const health = await manageService({
           action: 'health',
           name
         });

         if (!health.healthy) {
           console.error(`Service ${name} is unhealthy: ${health.status}`);

           // Attempt recovery
           if (health.status === 'stopped' || health.status === 'failed') {
             console.log(`Attempting to restart ${name}...`);
             await manageService({
               action: 'start',
               name
             });
           }
         }

         return health;
       } catch (error) {
         console.error(`Monitoring error: ${error.message}`);
         return {
           healthy: false,
           status: 'unknown',
           error: error.message,
           timestamp: new Date().toISOString()
         };
       }
     }

     // Set up periodic monitoring
     setInterval(() => monitorService('MyService'), 5 * 60 * 1000); // Every 5 minutes
     ```

## References

- NPM Package: [@fnet/service](https://www.npmjs.com/package/@fnet/service)
- Dependencies: No external dependencies
- Repository: [GitLab: fnetai/service](https://gitlab.com/fnetai/service.git)
- [Related Phase: Phase 004 @fnet/service Package Analysis](../phases/phase-004.md)
- [Related Documentation: Flownet CLI](../flownet.md)
