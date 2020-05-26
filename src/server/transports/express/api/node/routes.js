const controllers = require('./controllers');

module.exports = [
  /**
   * Add the document
   * 
   * @api {post} /api/node/add-document/
   * @apiParam {object} document
   * @apiParam {object} collection
   */
  { 
    name: 'addDocument',
    method: 'post', 
    url: '/add-document/',
    fn: controllers.addDocument
  }
];
