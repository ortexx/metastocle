const _ = require('lodash');
const DatabaseLokiMetastocle = require('./db/transports/loki')();
const ServerExpressMetastocle = require('./server/transports/express')();
const utils = require('./utils');
const errors = require('./errors');
const schema = require('./schema');
const Node = require('spreadable/src/node')();

module.exports = (Parent) => {
  /**
   * Class to manage the node
   */
  return class NodeMetastocle extends (Parent || Node) {
    static get codename () { return 'metastocle' }
    static get DatabaseTransport () { return DatabaseLokiMetastocle }
    static get ServerTransport () { return ServerExpressMetastocle }

    /**
     * @see Node
     */
    constructor(options = {}) {
      options = _.merge({
        request: {
          documentAdditionNodeTimeout: '2s'
        },        
        meta: {
          pk: '',
          queue: false,
          limit: 0,
          preferredDuplicates: "auto"
        },
        collections: {},
      }, options);

      super(options); 
      this.__collections = {};
    }

    /**
     * @see Node.prototype.init
     */
    async init() {
      await super.init.apply(this, arguments);

      for(let key in this.options.collections) {
        await this.addCollection(key, this.options.collections[key]);
      }
    }

    /**
     * @see Node.prototype.sync
     */
    async sync() {
      await super.sync.apply(this, arguments);
      await this.db.normalizeCollections();
    } 
    
    /**
     * @see Node.prototype.getStatusInfo
     */
    async getStatusInfo(pretty = false) {      
      const documents = [];
      const collections = Object.keys(this.__collections);

      for(let i = 0; i < collections.length; i++) {
        documents.push(await this.db.getCollectionSize(collections[i]));
      }

      return _.merge(await super.getStatusInfo(pretty), {
        collections,
        documents
      });
    }

    /**
     * Add the collection
     * 
     * @async
     * @param {string} name 
     * @param {object} [options] 
     */
    async addCollection(name, options = {}) {
      options = _.merge({
        name,
        schema: this.createDocumentFullSchema(options.schema),
        pk: this.options.meta.pk,
        queue: this.options.meta.queue,
        limit: this.options.meta.limit,
        preferredDuplicates: this.options.meta.preferredDuplicates
      }, options);
      await this.db.addCollection(name, options);
      this.__collections[name] = options;
    }

    /**
     * Get the collection
     * 
     * @async
     * @param {string} name 
     * @returns {object|null}
     */
    async getCollection(name) {
      return this.__collections[name] || null;
    }

    /**
     * Remove the collection
     * 
     * @async
     * @param {string} name
     */
    async removeCollection(name) {
      await this.db.removeCollection(name);
      delete this.__collections[name];
    }

    /**
     * Test the collection by name
     * 
     * @param {string} name 
     */
    async collectionTest(name) {
      if(!await this.getCollection(name))    {
        throw new errors.WorkError(`Collection ${name} doesn't exist`, 'ERR_METASTOCLE_NOT_FOUND_COLLECTION');
      }
    }

    /**
     * Check the collection by name
     * 
     * @see NodeMetastocle.prototype.collectionTest
     * @returns {boolean}
     */
    async checkCollection(name) {
      return !!(await this.getCollection(name));
    }

    /**
     * Add the document to the network
     * 
     * @async
     * @param {string} collectionName
     * @param {object} document
     * @param {object} [options]
     * @returns {object}
     */
    async addDocument(collectionName, document, options = {}) {    
      const existenceErrFn = () => {
        const data = JSON.stringify(document, null, 1);
        throw new errors.WorkError(`Document ${ data } already exists`, 'ERR_METASTOCLE_DOCUMENT_EXISTS');
      }

      if(!utils.isDocument(document)) {
        throw new errors.WorkError(`Wrong document: ${JSON.stringify(document, null, 1)}`, 'ERR_METASTOCLE_WRONG_DOCUMENT');
      }
      
      await this.collectionTest(collectionName); 
      const timer = this.createRequestTimer(options.timeout);
      const collection = await this.getCollection(collectionName);
      const info = { collection: collectionName };
      collection.pk && (info.pkValue = _.get(document, collection.pk));
      collection.schema && utils.validateSchema(collection.schema, document);
      const masterRequestTimeout = this.getRequestMastersTimeout(options);
      const results = await this.requestMasters('get-document-addition-candidates', {
        body: { info },
        timeout: timer(
          [masterRequestTimeout, this.options.request.documentAdditionNodeTimeout],
          { min: masterRequestTimeout, grabFree: true }
        ),
        masterTimeout: options.masterTimeout,
        slaveTimeout: options.slaveTimeout,
        responseSchema: schema.getDocumentAdditionCandidatesMasterResponse({ 
          networkOptimum: await this.getNetworkOptimum(),
          schema: collection.schema
        })
      });
      const existing = _.flatten(results).reduce((p, c) => p.concat(c.existing), []);
      const duplicatesCount = await this.getDocumentDuplicatesCount(info);      
      const limit = duplicatesCount - existing.length;      
      
      if(limit <= 0) {
        return existenceErrFn();
      }

      const filterOptions = Object.assign(await this.getDocumentAdditionCandidatesFilterOptions(info), { limit });
      const candidates = await this.filterCandidatesMatrix(results.map(r => r.candidates), filterOptions);
     
      if(!candidates.length && !existing.length) {
        throw new errors.WorkError('Not found a suitable server to add the document', 'ERR_METASTOCLE_NOT_FOUND_SERVER');
      }

      if(!candidates.length) {
        return existenceErrFn();
      }

      document = this.extractDocumentExistenceInfo(existing) || document;
      document = _.merge(this.prepareDocumentToAdd(document), { $duplicate: document.$duplicate });
      await this.db.addBehaviorCandidate('addDocument', candidates[0].address);      
      const servers = candidates.map(c => c.address).sort(await this.createAddressComparisonFunction());
      const result = await this.duplicateDocument(servers, document, info, { timeout: timer() });
      
      if(!result && !existing.length) {
        throw new errors.WorkError('Not found an available server to add the document', 'ERR_METASTOCLE_NOT_FOUND_SERVER');
      }

      if(existing.length) {
        return existenceErrFn();
      }

      return this.prepareDocumentToGet(result.document);
    }

    /**
     * Update the documents
     * 
     * @async
     * @param {string} collectionName
     * @param {object} document
     * @param {object} [options]
     * @returns {object}
     */
    async updateDocuments(collectionName, document, options = {}) {
      if(!utils.isDocument(document)) {
        throw new errors.WorkError(`Wrong document: ${JSON.stringify(document, null, 1)}`, 'ERR_METASTOCLE_WRONG_DOCUMENT');
      }

      await this.collectionTest(collectionName);
      document = this.prepareDocumentToUpdate(document);
      const actions = utils.prepareDocumentUpdationActions(options);
      const results =  await this.requestMasters('update-documents', {
        body: { actions, collection: collectionName, document },
        timeout: options.timeout,
        responseSchema: schema.updateDocumentsMasterResponse(),
        masterTimeout: options.masterTimeout,
        slaveTimeout: options.slaveTimeout
      });
      const updated = results.reduce((p, c) => p + c.updated, 0);
      return { updated };
    }

    /**
     * Delete the documents
     * 
     * @async
     * @param {string} collectionName
     * @param {object} [options]
     * @returns {object}
     */
    async deleteDocuments(collectionName, options = {}) {
      await this.collectionTest(collectionName);
      const actions = utils.prepareDocumentUpdationActions(options);
      const results = await this.requestMasters('delete-documents', {
        body: { actions, collection: collectionName },
        timeout: options.timeout,
        responseSchema: schema.deleteDocumentsMasterResponse(),
        masterTimeout: options.masterTimeout,
        slaveTimeout: options.slaveTimeout
      });
      const deleted = results.reduce((p, c) => p + c.deleted, 0);
      return { deleted };
    }
    
    /**
     * Get documents
     * 
     * @async
     * @param {string} collectionName
     * @param {object} [options]
     * @returns {object}
     */
    async getDocuments(collectionName, options = {}) {     
      await this.collectionTest(collectionName);
      const collection = await this.getCollection(collectionName);
      const actions = utils.prepareDocumentGettingActions(options);
      const results = await this.requestMasters('get-documents', {
        body: { actions, collection: collectionName },
        timeout: options.timeout,
        masterTimeout: options.masterTimeout,
        slaveTimeout: options.slaveTimeout,
        responseSchema: schema.getDocumentsMasterResponse({ schema: collection.schema })
      });
      return await this.handleDocumentsGettingForClient(results, actions);
    }

    /**
     * Get document by the primary key value
     * 
     * @async
     * @param {string} collectionName
     * @param {*} pkValue
     * @param {object} [options]
     * @returns {object|null}
     */
    async getDocumentByPk(collectionName, pkValue, options = {}) {      
      await this.collectionTest(collectionName);
      const collection = await this.getCollection(collectionName);      
      options = Object.assign({}, options, {
        filter: { [collection.pk]: pkValue },
        limit: 1,
        offset: 0
      });
      const res = await this.getDocuments(collectionName, options);    
      return res.documents.length? res.documents[0]: null;
    }

    /**
     * Get documents count
     * 
     * @async
     * @param {string} collectionName
     * @param {object} [options]
     * @returns {number}
     */
    async getDocumentsCount(collectionName, options = {}) {      
      await this.collectionTest(collectionName);
      options = Object.assign({}, options, {
        limit: 0,
        offset: 0,
        sort: null,
        isCounting: true
      });
      const res = await this.getDocuments(collectionName, options);
      return res.totalCount;
    }

    /**
     * Handle the documents getting on the masters side
     * 
     * @async
     * @param {array} arr
     * @param {object} [actions]
     * @returns {object}
     */
    async handleDocumentsGettingForMaster(arr, actions = {}) {
      let documents = arr.reduce((p, c) => p.concat(c.documents), []);
      actions.removeDuplicates && (documents = this.uniqDocuments(documents));
      return { documents };
    }
    
    /**
     * Handle the documents getting on the client side
     * 
     * @async
     * @param {array} arr
     * @param {object} [actions]
     * @returns {object}
     */
    async handleDocumentsGettingForClient(arr, actions = {}) { 
      let documents = arr.reduce((p, c) => p.concat(c.documents), []);
      actions.removeDuplicates && (documents = this.uniqDocuments(documents));
      const handler = new utils.DocumentsHandler(documents);
      actions.sort && handler.sortDocuments(actions.sort);
      const totalCount = handler.getDocuments().length;
      (actions.limit || actions.offset) && handler.limitDocuments(actions.offset, actions.limit);
      documents = handler.getDocuments().map(d => this.prepareDocumentToGet(d));
      return { documents, totalCount };
    }

    /**
     * Handle the documents getting on the slave side
     * 
     * @async
     * @param {object[]} documents
     * @param {object} [actions]
     * @returns {object}
     */
    async handleDocumentsGettingForSlave(documents, actions = {}) { 
      const handler = new utils.DocumentsHandler(documents);
      actions.filter && handler.filterDocuments(actions.filter); 
      const accessDocuments = handler.getDocuments(); 
      actions.fields && handler.fieldDocuments(actions.fields); 
      documents = handler.getDocuments();    
      return { documents, accessDocuments };
    }

    /**
     * Handle the documents updation on the slave side
     * 
     * @async
     * @param {object[]} documents
     * @param {object} document
     * @param {object} [actions]
     * @returns {object}
     */
    async handleDocumentsUpdation(documents, document, actions = {}) {      
      const handler = new utils.DocumentsHandler(documents);      
      actions.filter && handler.filterDocuments(actions.filter);
      documents = handler.getDocuments().map(d => {
        if(actions.replace) {
          return _.merge({}, _.omitBy(d, (v, k) => !k.startsWith('$')), document);
        }

        return _.merge({}, d, _.omitBy(document, (v, k) => k.startsWith('$')));
      });
      return { documents };
    }

    /**
     * Handle the documents deletion on the slave side
     * 
     * @async
     * @param {object[]} documents
     * @param {object} [actions]
     * @returns {object}
     */
    async handleDocumentsDeletion(documents, actions = {}) {
      const handler = new utils.DocumentsHandler(documents);
      actions.filter && handler.filterDocuments(actions.filter);     
      documents = handler.getDocuments();
      return { documents };
    }

    /**
     * Duplicate the document
     * 
     * @async
     * @param {string[]} servers 
     * @param {object[]} existing 
     * @param {object} document 
     * @param {object} info 
     * @param {object} [options]
     * @returns {object}
     */
    async duplicateDocument(servers, document, info, options = {}) {
      const collection = await this.getCollection(info.collection);
      options = _.assign({
        responseSchema: schema.getDocumentAdditionResponse({ schema: collection.schema })
      }, options);
      options.body = { info, document };
      options.serverOptions = { timeout: this.options.request.documentAdditionNodeTimeout };
      return await this.duplicateData('add-document', servers, options);
    }    

    /**
     * get the document existence info
     * 
     * @see NodeMetastocle.prototype.documentAvailabilityTest
     * @returns {object|null}
     */
    async getDocumentExistenceInfo(info) {
      if(info.pkValue === undefined) {
        return null;
      }

      const collection = await this.getCollection(info.collection);
      return await this.db.getDocumentByPk(collection.name, info.pkValue);
    }

    /**
     * Check the document fullness
     * 
     * @see NodeMetastocle.prototype.documentAvailabilityTest
     * @returns {boolean}
     */
    async checkDocumentFullness(info) {
      const collection = await this.getCollection(info.collection);
      const count = info.count || await this.db.getCollectionSize(collection.name);
      return count >= collection.limit;
    }

    /**
     * Check the document availability
     * 
     * @see NodeMetastocle.prototype.documentAvailabilityTest
     * @returns {boolean}
     */
    async checkDocumentAvailability() {
      try {
        await this.documentAvailabilityTest(...arguments);
        return true;
      }
      catch(err) {
        if(err instanceof errors.WorkError) {
          return false;
        }
        
        throw err;
      }
    }

    /**
     * Test the document availability
     * 
     * @async
     * @param {object} info
     * @param {string} info.collection
     * @param {number} [info.count]
     * @param {*} [info.pkValue]
     */
    async documentAvailabilityTest(info = {}) {
      const collection = await this.getCollection(info.collection);
      const count = info.count || await this.db.getCollectionSize(collection.name);
            
      if(!collection.queue && collection.limit && count >= collection.limit) {
        const msg = `Too much documents are in the collection "${ collection.name }"`;
        throw new errors.WorkError(msg, 'ERR_METASCTOCLE_DOCUMENTS_LIMITED');
      }
    }

    /**
     * Get the document duplicates count
     * 
     * @async
     * @param {object} info 
     * @param {string} info.collection
     * @returns {number}
     */
    async getDocumentDuplicatesCount(info) {
      const collection = await this.getCollection(info.collection);
      return this.getValueGivenNetworkSize(collection.preferredDuplicates);
    }

    /**
     * Get the document addition filter options
     * 
     * @async
     * @param {object} info
     * @returns {object}
     */
    async getDocumentAdditionCandidatesFilterOptions(info) {
      return {
        fnCompare: await this.createSuspicionComparisonFunction('addDocument', await this.createDocumentAdditionComparisonFunction()),
        fnFilter: c => !c.existenceInfo || c.isAvailable,
        schema: schema.getDocumentAdditionInfoSlaveResponse(),
        limit: await this.getDocumentDuplicatesCount(info)
      }
    }

    /**
     * Create a document addition comparison function
     * 
     * @async
     * @returns {function}
     */
    async createDocumentAdditionComparisonFunction() {
      return (a, b) => {
        if(a.isFull && !b.isFull) {
          return 1;
        }

        if(b.isFull && !a.isFull) {
          return -1;
        }

        return a.count - b.count;
      }
    }

    /**
     * Extract the existence document info
     * 
     * @see NodeMetastocle.prototype.chooseDocumentsDuplicate
     */
    extractDocumentExistenceInfo(arr) {
      return this.chooseDocumentsDuplicate(arr.map(item => item.existenceInfo));
    }

    /**
     * Choose the documents dublicate
     * 
     * @param {array} arr
     * @returns {object|null}
     */
    chooseDocumentsDuplicate(arr) {
      arr = _.orderBy(arr, ['$createdAt'], ['asc']);
      return arr[0] || null;
    }

    /**
     * Remove the document dublicates
     * 
     * @param {object[]} documents
     * @returns {object[]}
     */
    uniqDocuments(documents) {
      const group = Object.values(_.groupBy(documents, '$duplicate'));      
      return group.map(d => this.chooseDocumentsDuplicate(d)).filter(d => d);
    }

    /**
     * Create the document schema
     * 
     * @param {object} scheme
     * @returns {object}
     */
    createDocumentFullSchema(scheme) {
      if(scheme && typeof scheme != 'object' || Array.isArray(scheme)) {
        throw new Error('Document schema must be an object');
      }

      if(!scheme) {
        return;
      }

      scheme = _.merge({ expected: true }, scheme, schema.getDocumentSystemFields());
      return scheme;
    }

    /**
     * Prepare the document to add
     * 
     * @param {object} doc
     * @returns {object}
     */
    prepareDocumentToAdd(doc) {
      return utils.prepareDocumentFields(this.db.removeDocumentSystemFields(doc));
    }

    /**
     * Prepare the document to update
     * 
     * @param {object} doc
     * @returns {object}
     */
    prepareDocumentToUpdate(doc) {
      return this.prepareDocumentToAdd(doc);
    }

    /**
     * Prepare the document to get
     * 
     * @param {object} doc
     * @returns {object}
     */
    prepareDocumentToGet(doc) {
      return this.db.removeDocumentSystemFields(doc);
    }

    /**
     * Prepare the options
     */
    prepareOptions() {
      super.prepareOptions();
      this.options.request.documentAdditionNodeTimeout = utils.getMs(this.options.request.documentAdditionNodeTimeout);
    }
  }
};