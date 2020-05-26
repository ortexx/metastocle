const utils = require('../../../utils');
const midds = Object.assign({}, require("spreadable/src/server/transports/express/midds"));

/**
 * Prepare collection info
 */
midds.prepareCollection = node => {
  return async (req, res, next) => {
    try {
      const name = req.body.collection;
      await node.collectionTest(name);      
      req.collection = await node.getCollection(name);
      next();
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Prepare getting actions
 */
midds.prepareGettingActions = () => {
  return async (req, res, next) => {
    try {
      req.actions = utils.prepareDocumentGettingActions(req.body.actions || {});
      await req.collection.actionsGettingTest(req.actions);   
      next();
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Prepare update actions
 */
midds.prepareUpdateActions = node => {
  return async (req, res, next) => {
    try {
      req.document = req.body.document;
      await node.documentTest(req.document); 
      req.actions = utils.prepareDocumentUpdateActions(req.body.actions || {});
      await req.collection.actionsUpdateTest(req.actions);   
      next();
    }
    catch(err) {
      next(err);
    }
  }
};

/**
 * Prepare deletion actions
 */
midds.prepareDeletionActions = () => {
  return async (req, res, next) => {
    try {
      req.actions = utils.prepareDocumentDeletionActions(req.body.actions || {});
      await req.collection.actionsDeletionTest(req.actions);   
      next();
    }
    catch(err) {
      next(err);
    }
  }
};

module.exports = midds;