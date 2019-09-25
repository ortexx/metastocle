

const controllers = require('./controllers');

module.exports = [
  /**
   * Get the document addition info
   * 
   * @api {post} /api/slave/get-document-addition-info
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
   * @api {post} /api/slave/get-documents
   * @apiParam {string} collection
   */
  { 
    name: 'getDocuments',
    method: 'post', 
    url: '/get-documents', 
    fn: controllers.getDocuments
  },

  /**
   * Update the documents
   * 
   * @api {post} /api/slave/update-documents
   * @apiParam {string} collection
   */
  { 
    name: 'updateDocuments',
    method: 'post', 
    url: '/update-documents', 
    fn: controllers.updateDocuments
  },

  /**
   * Delete the documents 
   * 
   * @api {post} /api/slave/delete-documents
   * @apiParam {string} collection
   */
  { 
    name: 'deleteDocuments',
    method: 'post', 
    url: '/delete-documents', 
    fn: controllers.deleteDocuments
  }
];
