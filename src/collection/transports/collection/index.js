const Service = require('spreadable/src/service')();
const utils = require('../../../utils');

module.exports = (Parent) => {
  /**
   * Behavior transport
   */
  return class Collection extends (Parent || Service) {
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

    /**
     * The actions update test
     */
    async actionsUpdateTest(actions) {
      this.actionsTypeTest(actions);
    }

    /**
     * The actions getting test
     */
    async actionsGettingTest(actions) {
      this.actionsTypeTest(actions);
    }

    /**
     * The actions deletion test
     */
    async actionsDeletionTest(actions) {
      this.actionsTypeTest(actions);
    }

    /**
     * The actions type test
     */
    actionsTypeTest(actions) {
      utils.actionsTest(actions);      
    }   
  }
};