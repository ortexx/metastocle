const ServerExpress = require('spreadable/src/server/transports/express')();
const routes = require('spreadable/src/server/transports/express/routes');
const routesClient = require('spreadable/src/server/transports/express/client/routes');
const routesApi = require('spreadable/src/server/transports/express/api/routes');
const routesApiMaster = require('spreadable/src/server/transports/express/api/master/routes');
const routesApiSlave = require('spreadable/src/server/transports/express/api/slave/routes');
const routesApiNode = require('spreadable/src/server/transports/express/api/node/routes');

module.exports = (Parent) => {
  return class ServerExpressMetastocle extends (Parent || ServerExpress) {
    /**
     * @see ServerExpress.prototype.getMainRouter
     */
    getMainRouter() {
      return this.createRouter(routes.concat(require('./client/routes')));
    }
  
    /**
     * @see ServerExpress.prototype.getClientRouter
     */
    getClientRouter() {
      return this.createRouter(routesClient.concat(require('./client/routes')));
    }
  
    /**
     * @see ServerExpress.prototype.getApiRouter
     */
    getApiRouter() {
      return this.createRouter(routesApi.concat(require('./api/routes')));
    }
  
    /**
     * @see ServerExpress.prototype.getApiMasterRouter
     */
    getApiMasterRouter() {
      return this.createRouter(routesApiMaster.concat(require('./api/master/routes')));
    }
  
    /**
     * @see ServerExpress.prototype.getApiSlaveRouter
     */
    getApiSlaveRouter() {
      return this.createRouter(routesApiSlave.concat(require('./api/slave/routes')));
    }

    /**
     * @see ServerExpress.prototype.getApiNodeRouter
     */
    getApiNodeRouter() {
      return this.createRouter(routesApiNode.concat(require('./api/node/routes')));
    }
  }
};