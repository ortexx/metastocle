const Service = require('spreadable/src/service')();

module.exports = (Parent) => {
  /**
   * Behavior transport
   */
  return class Collecion extends (Parent || Service) {
    /**
     * @param {Node} node 
     * @param {object} [options]
     */
    constructor(node, options = {}) {
      super(...arguments);
      this.node = node; 
      this.options = Object.assign(this, {        
        pk: '',
        limit: 0,
        queue: false,          
        preferredDuplicates: "auto",
        limitationOrder: '$accessedAt'        
      }, options);

      this.schema = node.createDocumentFullSchema(this.schema);
    }

    /**
     * @see Service.prototype.init
     */
    async init() {    
      await this.node.db.addCollection(this.name, this);  
      await super.init.apply(this, arguments);
    }

    /**
     * @see Service.prototype.destroy
     */
    async destroy() {
      await this.node.db.removeCollection(this.name);
      await super.destroy.apply(this, arguments);
    }
  }
};