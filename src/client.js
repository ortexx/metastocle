const merge = require('lodash/merge');
const Client = require('spreadable-ms/src/client')();
const utils = require('./utils');
const errors = require('./errors');
const pack = require('../package.json');

module.exports = (Parent) => {
  /**
   * Class to manage client requests to the network
   */
  return class ClientMetastocle extends (Parent || Client) {
    static get version () { return pack.version }
    static get codename () { return pack.name }
    static get utils () { return utils }
    static get errors () { return errors }

    constructor(options = {}) {
      options = merge({
        request: {
          documentAdditionTimeout: '10s',
          documentGettingTimeout: '10s',
          documentUpdateTimeout: '10s',
          documentDeletionTimeout: '10s'
        },
      }, options);      
      super(options);
    }

    /**
     * Add the document
     * 
     * @async
     * @param {string} collection
     * @param {object} document
     * @param {object} [options]
     * @returns {object}
     */
    async addDocument(collection, document, options = {}) {
      document = utils.prepareDocumentFields(document);      
      const result = await this.request('add-document', {
        body: {
          collection,
          document,
          ignoreExistenceError: options.ignoreExistenceError
        },
        timeout: options.timeout || this.options.request.documentAdditionTimeout
      });
      return result.document;
    }

    /**
     * Update the documents
     * 
     * @async
     * @param {string} collection
     * @param {object} document
     * @param {object} [options]
     * @returns {object}
     */
    async updateDocuments(collection, document, options = {}) {
      document = utils.prepareDocumentFields(document);
      const actions = utils.prepareDocumentUpdateActions(options);      
      return await this.request('update-documents', Object.assign({}, options, {
        body: {
          collection,
          document,
          actions
        },
        timeout: options.timeout || this.options.request.documentUpdateTimeout
      }));
    }

    /**
     * Delete the documents
     * 
     * @async
     * @param {string} collection
     * @param {object} [options]
     * @returns {object}
     */
    async deleteDocuments(collection, options = {}) {
      const actions = utils.prepareDocumentDeletionActions(options);
      return await this.request('delete-documents', Object.assign({}, options, {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentDeletionTimeout
      }));
    }

    /**
     * Get the documents
     * 
     * @async
     * @param {string} collection
     * @param {object} [options]
     * @returns {object}
     */
    async getDocuments(collection, options = {}) {
      const actions = utils.prepareDocumentGettingActions(options);
      return await this.request('get-documents', Object.assign({}, options, {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout
      }));
    }

    /**
     * Get the documents count
     * 
     * @async
     * @param {string} collection
     * @param {object} [options]
     * @returns {number}
     */
    async getDocumentsCount(collection, options = {}) {
      const actions = utils.prepareDocumentGettingActions(options);
      const result = await this.request('get-documents-count', Object.assign({}, options, {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout
      }));
      return result.count;
    }

    /**
     * Get the document by pk
     * 
     * @async
     * @param {string} collection
     * @param {*} pkValue
     * @param {object} [options]
     * @returns {object}
     */
    async getDocumentByPk(collection, pkValue, options = {}) {
      const result = await this.request('get-document-by-pk', Object.assign({}, options, {
        body: {
          collection,
          pkValue
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout
      }));
      return result.document;
    }
    
    /**
     * Prepare the options
     */
    prepareOptions() {
      super.prepareOptions();
      this.options.request.documentAdditionTimeout = utils.getMs(this.options.request.documentAdditionTimeout); 
      this.options.request.documentGettingTimeout = utils.getMs(this.options.request.documentGettingTimeout); 
      this.options.request.documentUpdateTimeout = utils.getMs(this.options.request.documentUpdateTimeout); 
      this.options.request.documentDeletionTimeout = utils.getMs(this.options.request.documentDeletionTimeout); 
    }
  }
};