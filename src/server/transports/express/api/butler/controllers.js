const _ = require('lodash');
const errors = require('../../../../../errors');
const schema = require('../../../../../schema');

/**
 * Get candidates to add the document
 */
module.exports.getDocumentAdditionInfo = node => {
  return async (req, res, next) => {
    try {      
      const info = req.body.info || {};
      await node.collectionTest(info.collection);     
      const collection = await node.getCollection(info.collection);
      const options = node.createRequestNetworkOptions(req.body, {
        responseSchema: schema.getDocumentAdditionInfoSlaveResponse({ schema: collection.schema }),   
      });
      const results = await node.requestNetwork('get-document-addition-info', options);
      const existing = results.filter(c => c.existenceInfo).map(c => _.pick(c, ['address', 'existenceInfo']));
      const candidates = await node.filterCandidates(results, await node.getDocumentAdditionInfoFilterOptions(info));
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
      const isCounting = req.body.isCounting;
      const options = node.createRequestNetworkOptions(req.body, {   
        responseSchema: schema.getDocumentsSlaveResponse({ schema: req.collection.schema, isCounting })
      });
      const results = await node.requestNetwork('get-documents', options);
      
      try {
        res.send(await node.handleDocumentsGettingForButler(results, req.actions));
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
      const options = node.createRequestNetworkOptions(req.body, {
        timeout: node.createRequestTimeout(req.body),
        responseSchema: schema.updateDocumentsSlaveResponse()
      });
      const results = await node.requestNetwork('update-documents', options);      
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
      const options = node.createRequestNetworkOptions(req.body, {
        responseSchema: schema.deleteDocumentsSlaveResponse()
      });
      const results = await node.requestNetwork('delete-documents', options);
      const deleted = results.reduce((p, c) => p + c.deleted, 0);
      res.send({ deleted });
    }
    catch(err) {
      next(err);
    }   
  }
};
