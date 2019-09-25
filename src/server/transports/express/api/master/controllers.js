const _ = require('lodash');
const errors = require('../../../../../errors');
const schema = require('../../../../../schema');
const utils = require('../../../../../utils');

/**
 * Get candidates to add the document
 */
module.exports.getDocumentAdditionCandidates = node => {
  return async (req, res, next) => {
    try {      
      const info = req.body.info || {};
      
      if(!await node.checkCollection(info.collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }
      
      const collection = await node.getCollection(info.collection);
      const timer = node.createRequestTimer(node.createRequestTimeout(req.body));
      const options = node.createRequestSlavesOptions(req.body, {
        timeout: timer(),
        responseSchema: schema.getDocumentAdditionInfoSlaveResponse({ schema: collection.schema })
      });
      const results = await node.requestSlaves('get-document-addition-info', options);
      const existing = results.filter(c => c.existenceInfo).map(c => _.pick(c, ['address', 'existenceInfo']));
      const candidates = await node.filterCandidates(results, await node.getDocumentAdditionCandidatesFilterOptions(info));
      res.send({ candidates, existing });
    }
    catch(err) {
      next(err);
    }    
  };
};

/**
 * Get the documents
 */
module.exports.getDocuments = node => {
  return async (req, res, next) => {    
    try {      
      const collectionName = req.body.collection;

      if(!await node.checkCollection(collectionName)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }

      const timer = node.createRequestTimer(node.createRequestTimeout(req.body));
      const collection = await node.getCollection(collectionName);
      const actions = utils.prepareDocumentGettingActions(req.body.actions || {});
      const options = node.createRequestSlavesOptions(req.body, {
        timeout: timer(),
        responseSchema: schema.getDocumentsSlaveResponse({ schema: collection.schema })
      });
      const results = await node.requestSlaves('get-documents', options);
      
      try {
        res.send(await node.handleDocumentsGettingForMaster(results, actions));
      }
      catch(err) {
        throw new errors.WorkError(err.message, 'ERR_METASTOCLE_DOCUMENTS_HANDLER');
      }
    }
    catch(err) {
      next(err);
    }   
  } 
};

/**
 * Update the documents
 */
module.exports.updateDocuments = node => {
  return async (req, res, next) => {
    try {      
      const collection = req.body.collection;
      const document = req.body.document;

      if(!utils.isDocument(document)) {
        throw new errors.WorkError('"document" field is invalid', 'ERR_METASTOCLE_INVALID_DOCUMENT_FIELD');
      }  

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      } 

      const timer = node.createRequestTimer(node.createRequestTimeout(req.body));
      const options = node.createRequestSlavesOptions(req.body, {
        timeout: timer(),
        responseSchema: schema.updateDocumentsSlaveResponse()
      });
      const results = await node.requestSlaves('update-documents', options);      
      const updated = results.reduce((p, c) => p + c.updated, 0);
      res.send({ updated });
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

      if(!await node.checkCollection(collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      } 

      const timer = node.createRequestTimer(node.createRequestTimeout(req.body));
      const options = node.createRequestSlavesOptions(req.body, {
        timeout: timer(),
        responseSchema: schema.deleteDocumentsSlaveResponse()
      });
      const results = await node.requestSlaves('delete-documents', options);
      const deleted = results.reduce((p, c) => p + c.deleted, 0);
      res.send({ deleted });
    }
    catch(err) {
      next(err);
    }   
  }
};
