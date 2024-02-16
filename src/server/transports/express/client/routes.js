import * as controllers from "./controllers.js";
import midds from "../midds.js";

export default [

  /**
   * Add the document
   *
   * @api {post} /client/add-document
   * @apiParam {string} collection
   * @apiParam {object} document
   * @apiSuccess {object} - { document: {...} }
   */
  {
    name: 'addDocument',
    method: 'post',
    url: '/add-document',
    fn: [
      midds.requestQueueClient,
      controllers.addDocument
    ]
  },

  /**
   * Update the document
   *
   * @api {post} /client/update-documents
   * @apiParam {string} collection
   * @apiParam {object} document
   * @apiSuccess {object} - { updated: 0 }
   */
  {
    name: 'updateDocuments',
    method: 'post',
    url: '/update-documents',
    fn: [
      midds.requestQueueClient,
      controllers.updateDocuments
    ]
  },

  /**
   * Delete the document
   *
   * @api {post} /client/delete-documents
   * @apiParam {string} collection
   * @apiSuccess {object} - { deleted: 0 }
   */
  {
    name: 'deleteDocuments',
    method: 'post',
    url: '/delete-documents',
    fn: [
      midds.requestQueueClient,
      controllers.deleteDocuments
    ]
  },

  /**
   * Get the documents
   *
   * @api {post} /client/get-documents
   * @apiParam {string} collection
   * @apiParam {object} actions
   * @apiSuccess {object} - { documents: [...], totalCount: 0 }
   */
  {
    name: 'getDocuments',
    method: 'post',
    url: '/get-documents',
    fn: [
      midds.requestQueueClient,
      controllers.getDocuments
    ]
  },

  /**
   * Get the documents count
   *
   * @api {post} /client/get-documents-count
   * @apiParam {string} collection
   * @apiParam {object} actions
   * @apiSuccess {object} - { count: 0 }
   */
  {
    name: 'getDocumentsCount',
    method: 'post',
    url: '/get-documents-count',
    fn: [
      midds.requestQueueClient,
      controllers.getDocumentsCount
    ]
  },

  /**
   * Get the document by pk
   *
   * @api {post} /client/get-document-by-pk
   * @apiParam {string} collection
   * @apiParam {*} pkValue
   * @apiSuccess {object} - { document: {...} }
   */
  {
    name: 'getDocumentByPk',
    method: 'post',
    url: '/get-document-by-pk',
    fn: [
      midds.requestQueueClient,
      controllers.getDocumentByPk
    ]
  }
];
