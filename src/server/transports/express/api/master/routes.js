import * as controllers from "./controllers.js";
import midds from "../../midds.js";

export default [
  /**
   * Get candidates to add the document
   *
   * @api {post} /api/master/get-document-addition-info
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
   * @api {post} /api/master/get-documents
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
   * @api {post} /api/master/update-documents
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
   * @api {post} /api/master/delete-documents
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
