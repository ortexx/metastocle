const controllers = require('./controllers');
const midds = require('../../midds');

module.exports = [
  /**
   * Get candidates to add the document
   * 
   * @api {post} /api/butler/get-document-addition-info
   * @apiParam {object} info
   * @apiParam {string} info.collection
   * @apiParam {string} [info.pkValue]
   * @apiSuccess {object} - { candidates: ... }
   */
  { 
    name: 'getDocumentAdditionInfo', 
    method: 'post',
    url: '/get-document-addition-info', 
    fn: controllers.getDocumentAdditionInfo
  },

  /**
   * Get the documents
   * 
   * @api {post} /api/butler/get-documents
   * @apiParam {string} collection
   */
  { 
    name: 'getDocuments',
    method: 'post', 
    url: '/get-documents', 
    fn: [
      midds.prepareCollection,
      midds.prepareGettingActions,
      controllers.getDocuments
    ]
  },

  /**
   * Update the documents
   * 
   * @api {post} /api/butler/update-documents
   * @apiParam {string} collection
   */
  { 
    name: 'updateDocuments',
    method: 'post', 
    url: '/update-documents', 
    fn: [
      midds.prepareCollection,
      midds.prepareUpdateActions,
      controllers.updateDocuments
    ]
  },

  /**
   * Delete the documents 
   * 
   * @api {post} /api/butler/delete-documents
   * @apiParam {string} collection
   */
  { 
    name: 'deleteDocuments',
    method: 'post', 
    url: '/delete-documents', 
    fn: [
      midds.prepareCollection,
      midds.prepareDeletionActions,
      controllers.deleteDocuments
    ]
  }
];
