const Service = require('spreadable/src/service')();
const utils = require('../../../utils');

module.exports = (Parent) => {
  /**
   * Collection transport
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
        maxSize: 0,
        queue: false,
        preferredDuplicates: "auto",
        limitationOrder: '$accessedAt'
      }, options);      
    }

    /**
     * @see Service.prototype.init
     */
    async init() {    
      this.schema = this.node.createDocumentFullSchema(this.schema);
      this.maxSize = utils.getBytes(this.maxSize);
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
     * Prepare the document to add
     * 
     * @async
     * @param {object} doc
     * @returns {object}
     */
    async prepareDocumentToAdd(doc) {
      return utils.prepareDocumentFields(this.node.db.removeDocumentSystemFields(doc));
    }

    /**
     * Prepare the document to update
     * 
     * @async
     * @param {object} doc
     * @returns {object}
     */
    async prepareDocumentToUpdate(doc) {
      return this.prepareDocumentToAdd(doc);
    }

    /**
     * Prepare the document to get
     * 
     * @async
     * @param {object} doc
     * @returns {object}
     */
    async prepareDocumentToGet(doc) {
      return this.node.db.removeDocumentSystemFields(doc);
    }

    /**
     * The actions update test
     * 
     * @async
     */
    async actionsUpdateTest(actions) {
      this.actionsTypeTest(actions);
    }

    /**
     * The actions getting test
     * 
     * @async
     */
    async actionsGettingTest(actions) {
      this.actionsTypeTest(actions);
    }

    /**
     * The actions deletion test
     * 
     * @async
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