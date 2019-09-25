const errors = require('../../../../errors');

/**
 * Add the document
 */
module.exports.addDocument = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      let document = req.body.document;

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      document = await node.addDocument(collection, document, { 
        timeout: node.createRequestTimeout(req.body),        
      });
      res.send({ document });
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Update the document
 */
module.exports.updateDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const document = req.body.document;
      const actions = req.body.actions || {};

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }
      
      const result = await node.updateDocuments(collection, document, Object.assign({ 
        timeout: node.createRequestTimeout(req.body),        
      }, actions));
      res.send(result);
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Delete the documents
 */
module.exports.deleteDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      const result = await node.deleteDocuments(collection, Object.assign({ 
        timeout: node.createRequestTimeout(req.body),        
      }, actions));
      res.send(result);
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Get the documents
 */
module.exports.getDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      const result = await node.getDocuments(collection, Object.assign({ 
        timeout: node.createRequestTimeout(req.body),        
      }, actions));
      res.send(result);
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Get the documents count
 */
module.exports.getDocumentsCount = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      const count = await node.getDocumentsCount(collection, Object.assign({ 
        timeout: node.createRequestTimeout(req.body),        
      }, actions));
      res.send({ count });
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Get the document by pk
 */
module.exports.getDocumentByPk = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const pkValue = req.body.pkValue;

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      const document = await node.getDocumentByPk(collection, pkValue, { 
        timeout: node.createRequestTimeout(req.body),   
      });
      res.send({ document });
    }
    catch(err) {
      next(err);
    }
  }
};
