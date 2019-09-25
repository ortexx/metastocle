const errors = require('../../../../../errors');
const utils = require('../../../../../utils');

/**
 * Add the document
 */
module.exports.addDocument = node => {  
  return async (req, res, next) => {
    try {
      let document = req.body.document;   
      const duplicates = req.body.duplicates || [];
      const info = req.body.info || {};    
      
      if(!utils.isDocument(document)) {
        throw new errors.WorkError('"document" field is invalid', 'ERR_METASTOCLE_INVALID_DOCUMENT_FIELD');
      }  

      if(!await node.checkCollection(info.collection)) {
        throw new errors.WorkError('"info.collection" field is invalid', 'ERR_METASTOCLE_INVALID_COLLECTION_FIELD');
      }      
      
      await node.documentAvailabilityTest(info);
      document = await node.db.addDocument(info.collection, document); 
      
      if(duplicates.length) {  
        const doc = node.db.removeDocumentSystemFields(document, ['$duplicate']);
        node.duplicateDocument(duplicates, doc, info).catch(err => node.logger.error(err.stack));
      }

      document = node.db.removeDocumentSystemFields(document);
      res.send({ document });
    }
    catch(err) {
      next(err);
    }    
  }
};