const merge = require('lodash/merge');
const Client = require('spreadable/src/client')();
const utils = require('./utils');

module.exports = (Parent) => {
  /**
   * Class to manage client requests to the network
   */
  return class ClientMetastocle extends (Parent || Client) {
    constructor(options = {}) {
      options = merge({
        request: {
          documentAdditionTimeout: '10s',
          documentGettingTimeout: '10s',
          documentUpdationTimeout: '10s',
          documentDeletionTimeout: '6s'
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
          document
        },
        timeout: options.timeout || this.options.request.documentAdditionTimeout,
        useInitialAddress: options.useInitialAddress
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
      const actions = utils.prepareDocumentUpdationActions(options);
      
      return await this.request('update-documents', {
        body: {
          collection,
          document,
          actions
        },
        timeout: options.timeout || this.options.request.documentUpdationTimeout,
        useInitialAddress: options.useInitialAddress
      });
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

      return await this.request('delete-documents', {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentDeletionTimeout,
        useInitialAddress: options.useInitialAddress
      });
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

      return await this.request('get-documents', {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout,
        useInitialAddress: options.useInitialAddress
      });
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

      const result = await this.request('get-documents-count', {
        body: {
          collection,
          actions
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout,
        useInitialAddress: options.useInitialAddress
      });

      return result.count;
    }

    /**
     * Get the document by pk
     * 
     * @async
     * @param {string} collection
     * @param {object} [options]
     * @returns {object}
     */
    async getDocumentByPk(collection, pkValue, options = {}) {
      const result = await this.request('get-document-by-pk', {
        body: {
          collection,
          pkValue
        },
        timeout: options.timeout || this.options.request.documentGettingTimeout,
        useInitialAddress: options.useInitialAddress
      });

      return result.document;
    }
    
    /**
     * Prepare the options
     */
    prepareOptions() {
      super.prepareOptions();
      this.options.request.documentAdditionTimeout = utils.getMs(this.options.request.documentAdditionTimeout); 
      this.options.request.documentGettingTimeout = utils.getMs(this.options.request.documentGettingTimeout); 
      this.options.request.documentUpdationTimeout = utils.getMs(this.options.request.documentUpdationTimeout); 
      this.options.request.documentDeletionTimeout = utils.getMs(this.options.request.documentDeletionTimeout); 
    }
  }
};