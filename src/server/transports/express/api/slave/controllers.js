const _ = require('lodash');
const utils = require('../../../../../utils');

/**
 * Get the document addition info
 */
module.exports.getDocumentAdditionInfo = node => {  
  return async (req, res, next) => {
    try {
      const info = req.body.info || {};
      await node.collectionTest(info.collection); 
      const testInfo = Object.assign({}, info);
      testInfo.count = await node.db.getCollectionSize(info.collection);      
      res.send({ 
        count: testInfo.count,
        existenceInfo: await node.getDocumentExistenceInfo(testInfo),
        isFull: await node.checkDocumentFullness(testInfo),
        isAvailable: await node.checkDocumentAvailability(testInfo)
      });
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
      const isCounting = req.body.isCounting;
      const pkValue =  req.body.pkValue;
      let documents = [];

      if(pkValue) {
        const document = await node.db.getDocumentByPk(req.collection.name, pkValue);
        document && documents.push(document);
      }
      else {
        documents = await node.db.getDocuments(req.collection.name);
      }

      const result = await node.handleDocumentsGettingForSlave(documents, req.actions);

      if(isCounting) {
        documents = result.documents.map(d => _.pick(d, '$duplicate'));
      }
      else {
        documents = await node.db.accessDocuments(req.collection.name, result.accessDocuments);
        documents = result.documents.map(d => node.db.removeDocumentSystemFields(d, ['$duplicate']));
      }
      
      res.send({ documents });
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
      let documents = await node.db.getDocuments(req.collection.name);    
      const result = await node.handleDocumentsUpdate(documents, req.document, req.actions);
      documents = await node.db.updateDocuments(req.collection.name, result.documents);      
      res.send({ updated: result.documents.length });
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
      await node.collectionTest(collection); 
      const documents = await node.db.getDocuments(collection);
      const actions = utils.prepareDocumentDeletionActions(req.body.actions || {});
      const result = await node.handleDocumentsDeletion(documents, actions);
      await node.db.deleteDocuments(collection, result.documents);
      res.send({ deleted: result.documents.length });
    }
    catch(err) {
      next(err);
    }   
  } 
};