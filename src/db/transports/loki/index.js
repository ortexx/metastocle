const DatabaseMetastocle = require('../database')();
const DatabaseLoki = require('spreadable/src/db/transports/loki')(DatabaseMetastocle);
const _ = require('lodash');
const utils = require('../../../utils');
const errors = require('../../../errors');
const uuidv1 = require('uuid/v1');

module.exports = (Parent) => {
  /**
   * Lokijs database transport
   */
  return class DatabaseLokiMetastocle extends (Parent || DatabaseLoki) {
    constructor(node, options = {}) {
      options = _.merge({
        metaPrefix: 'meta'
      }, options);
      super(node, options);
    }

    /**
     * @see DatabaseMetastocle.prototype.createCollectionName
     */
    createCollectionName(name) {
      return this.options.metaPrefix + _.capitalize(name);
    }

    /**
     * @see DatabaseMetastocle.prototype.prepareDocumentToAdd
     */
    prepareDocumentToAdd(document) {
      return document;
    }

    /**
     * @see DatabaseMetastocle.prototype.prepareDocumentToGet
     */
    prepareDocumentToGet(document) {
      return document;
    }

    /**
     * @see DatabaseMetastocle.prototype.createDocumentPrimaryKey
     */
    createDocumentPrimaryKey() {
      return uuidv1();
    }

    /**
     * @see DatabaseMetastocle.prototype.createDocumentDuplicationKey
     */
    createDocumentDuplicationKey() {
      return uuidv1();
    }

    /**
     * @see DatabaseMetastocle.prototype.removeDocumentSystemFields
     */
    removeDocumentSystemFields(document, exclude = []) {
      return _.pickBy(document, (v, k) => !k.startsWith('$') || (exclude.length && exclude.includes(k)));
    }

    /**
     * @see DatabaseMetastocle.prototype.addCollection
     */
    async addCollection(name, options = {}) {
      const lokiOptions = Object.assign({}, options.loki || {});

      if(options.pk) {
        !lokiOptions.unique && (lokiOptions.unique = []);
        !lokiOptions.unique.includes(options.pk) && (lokiOptions.unique.push(options.pk));
      }  
      const fullName = this.createCollectionName(name);
      this.col[fullName] = this.prepareCollection(fullName, lokiOptions);
      return this.col[fullName];
    }

    /**
     * @see DatabaseMetastocle.prototype.getCollection
     */
    async getCollection(name) {
      return this.col[this.createCollectionName(name)] || null;
    }

    /**
     * @see DatabaseMetastocle.prototype.removeCollection
     */
    async removeCollection(name) {
      const fullName = this.createCollectionName(name);
      this.loki.removeCollection(fullName);
      delete this.col[fullName];
    }

    /**
     * @see DatabaseMetastocle.prototype.emptyCollection
     */
    async emptyCollection(name) {
      this.col[this.createCollectionName(name)].clear();
    }

    /**
     * @see DatabaseMetastocle.prototype.normalizeCollections
     */
    async normalizeCollections() {
      const collections = this.loki.listCollections();
     
      for(let i = 0; i < collections.length; i++) {
        const collection = collections[i]; 
        
        if(!collection.name.startsWith(this.options.metaPrefix)) {
          continue;
        }

        const name = _.camelCase(collection.name.substring(this.options.metaPrefix.length));
        const nodeCollection = await this.node.getCollection(name); 
        
        if(!nodeCollection) {
          await this.removeCollection(name);
          continue;
        }

        const pk = nodeCollection.pk;

        if(pk) {
          this.col[collection.name]
          .chain()
          .where(doc => !doc[pk] || (typeof doc[pk] != 'string' && typeof doc[pk] != 'number'))
          .remove()
        }

        await this.removeCollectionExcessDocuments(name);
      }
    }

     /**
     * @see DatabaseMetastocle.prototype.removeCollectionExcessDocuments
     */
    async removeCollectionExcessDocuments(name) {
      const fullName = this.createCollectionName(name);
      const collection = await this.node.getCollection(name);
      const count = await this.getCollectionSize(name);

      if(!collection.limit || count <= collection.limit) {
        return;
      }

      let order = collection.limitationOrder || '$accessedAt';
      !Array.isArray(order) && (order = [order]);
      const newOrder = [];
      
      
      for(let i = 0; i < order.length; i++) {
        let item = order[i];
        item = Array.isArray(item)? [item[0], item[1] == 'asc']: [item, true];
        newOrder.push(item);
      }

      this.col[fullName].chain().find().compoundsort(newOrder).offset(collection.limit).remove();
    } 

    /**
     * @see DatabaseMetastocle.prototype.getCollectionSize
     */
    async getCollectionSize(name) {
      const fullName = this.createCollectionName(name);
      const collection = this.loki.listCollections().find(c => c.name == fullName);
      return collection.count;
    }    

    /**
     * @see DatabaseMetastocle.prototype.addDocument
     */
    async addDocument(name, document) {
      const fullName = this.createCollectionName(name);
      const collection = await this.node.getCollection(name);
      const count = await this.getCollectionSize(name);

      if(collection.limit && !collection.queue && count >= collection.limit) {
        const msg = `Too much documents are in collection "${name}", you can't add new one`;
        throw new errors.WorkError(msg, 'ERR_METASTOCLE_DOCUMENTS_LIMIT');
      }

      delete document.$loki;
      document.$createdAt = document.$updatedAt = document.$accessedAt = Date.now();      
      document.$duplicate = document.$duplicate || this.createDocumentDuplicationKey(document);
      document.$collection = name;
      document = this.prepareDocumentToAdd(document);
      document = await this.handleDocument(document);
      document = this.col[fullName].insert(document);
      await this.removeCollectionExcessDocuments(name);
      return this.prepareDocumentToGet(document);
    }

    /**
     * @see DatabaseMetastocle.prototype.handleDocument
     */
    async handleDocument(document, options = {}) {
      if(!document.$collection) {
        const msg = `Document must have "$collection" field`;
        throw new errors.WorkError(msg, 'ERR_METASTOCLE_INVALID_DOCUMENT_COLLECTION');
      }

      const fullName = this.createCollectionName(document.$collection);
      const collection = await this.node.getCollection(document.$collection);
      const prev = options.prevState || null;  

      if(collection.defaults) {
        for(let key in collection.defaults) {
          const value = collection.defaults[key];

          if(_.get(document, key) !== undefined) {
            continue;
          }

          _.set(document, key, typeof value == 'function'? value(key, document, prev): value);
        }
      }

      if(collection.hooks) {
        for(let key in collection.hooks) {
          const value = collection.hooks[key];
          _.set(document, key, typeof value == 'function'? value(_.get(document, key), key, document, prev): value);
        }
      }

      if(collection.schema) {
        utils.validateSchema(collection.schema, document);
      }

      if(collection.pk) {
        const pkValue = document[collection.pk];
        const pkCheckOptions = { [collection.pk]: pkValue };       
        document.$loki && (pkCheckOptions.$loki = { $ne: document.$loki });

        if(pkValue && typeof pkValue !== 'string' && typeof pkValue !== 'number') {
          const msg = `Primary key for "${collection.pk}" must be a string or a number`;
          throw new errors.WorkError(msg, 'ERR_METASTOCLE_INVALID_DOCUMENT_PK_TYPE');
        }
        else if(
          pkValue && 
          (
            (options.pks && options.pks[pkValue] && 
              (!document.$loki || (options.pks[pkValue].$loki != document.$loki))
            ) ||
            (!options.pks && this.col[fullName].chain().find(pkCheckOptions).count())    
          )
        ) {
          const msg = `Primary key "${pkValue}" for "${collection.pk}" already exists`
          throw new errors.WorkError(msg, 'ERR_METASTOCLE_DOCUMENT_PK_EXISTS');
        }
        else if(!pkValue) {
          document[collection.pk] = this.createDocumentPrimaryKey(document);
        }
      }

      if(!document.$loki && this.col[fullName].chain().find({ $duplicate: document.$duplicate }).count()) {
        const msg = `The duplicate key "${document.$duplicate}" already exists`;
        throw new errors.WorkError(msg, 'ERR_METASTOCLE_DOCUMENT_DUPLICATE_EXISTS');
      }

      return document;
    }

    /**
     * @see DatabaseMetastocle.prototype.getDocumentByPk
     */
    async getDocumentByPk(name, value) {
      const fullName = this.createCollectionName(name);
      const collection = await this.node.getCollection(name);
      const document = this.col[fullName].by(collection.pk, value);
      return document? this.prepareDocumentToGet(document): null;
    }

    /**
     * @see DatabaseMetastocle.prototype.getDocuments
     */
    async getDocuments(name) {
      const fullName = this.createCollectionName(name);
      return this.col[fullName].find().map(d => this.prepareDocumentToGet(d));
    }

    /**
     * @see DatabaseMetastocle.prototype.accessDocument
     */
    async accessDocument(document) {
      const fullName = this.createCollectionName(document.$collection);
      document.$accessedAt = Date.now();    
      this.col[fullName].update(document);
      return this.prepareDocumentToGet(document);
    }

    /**
     * @see DatabaseMetastocle.prototype.documents
     */
    async accessDocuments(name, documents) {
      for(let i = 0; i < documents.length; i++) {
        documents[i] = await this.accessDocument(documents[i]);
      }

      return documents.map(d => this.prepareDocumentToGet(d));
    }

    /**
     * @see DatabaseMetastocle.prototype.updateDocument
     */
    async updateDocument(document, options = {}) {
      options = Object.assign({}, options);
      const fullName = this.createCollectionName(document.$collection);
      document.$updatedAt = document.$accessedAt = Date.now();
      options.prevState = this.col[fullName].get(document.$loki);
      document = await this.handleDocument(document, options);
      this.col[fullName].update(document);
      return this.prepareDocumentToGet(document);
    }

    /**
     * @see DatabaseMetastocle.prototype.updateDocuments
     */
    async updateDocuments(name, documents) {
      const fullName = this.createCollectionName(name);      
      const collection = await this.node.getCollection(name);
      const pks = {};
      
      if(collection.pk) {
        const docs = this.col[fullName].find();
        docs.forEach(d => pks[d[collection.pk]] = d);
      }

      for(let i = 0; i < documents.length; i++) {
        let prevPkValue;

        if(collection.pk) {
          prevPkValue = documents[i][collection.pk];
        }

        documents[i] = await this.updateDocument(documents[i], { pks });

        if(collection.pk) {
          delete pks[prevPkValue];
          pks[documents[i][collection.pk]] = documents[i];
        }
      }

      return documents.map(d => this.prepareDocumentToGet(d));
    }

    /**
     * @see DatabaseMetastocle.prototype.deleteDocument
     */
    async deleteDocument(document) {
      const fullName = this.createCollectionName(document.$collection);
      this.col[fullName].remove(document);
      return document;
    }

    /**
     * @see DatabaseMetastocle.prototype.deleteDocuments
     */
    async deleteDocuments(name, documents) {
      for(let i = 0; i < documents.length; i++) {
        documents[i] = await this.deleteDocument(documents[i]);
      }
    }
  }
};