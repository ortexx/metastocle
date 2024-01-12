const utils = Object.assign({}, require('spreadable-ms/bin/utils'));
const scrUtils = require('../src/utils');

/**
 * Create the document getting actions
 * 
 * @param {object} argv
 * @returns {object}
 */
utils.prepareDocumentGettingActions = function (argv) {
  const filter = argv.filter || argv.f;
  const sort = argv.sort || argv.v;
  const fields = argv.fields || argv.x;
  const limit = argv.limit || argv.y;
  const offset = argv.offset || argv.z;
  const removeDuplicates = argv.removeDuplicates || argv.w;
  return scrUtils.prepareDocumentGettingActions({
    filter: filter? JSON.parse(filter): null,
    sort: sort? JSON.parse(sort): null,
    fields: fields? JSON.parse(fields): null,
    limit,
    offset,
    removeDuplicates
  });
};

/**
 * Create the document update actions
 * 
 * @param {object} argv
 * @returns {object}
 */
utils.prepareDocumentUpdateActions = function (argv) {
  const filter = argv.filter || argv.f;
  const replace = argv.replace || argv.r;
  return scrUtils.prepareDocumentUpdateActions({
    filter: filter? JSON.parse(filter): null,
    replace
  });
};

/**
 * Create the document deletetion actions
 * 
 * @param {object} argv
 * @returns {object}
 */
utils.prepareDocumentDeletionActions = function (argv) {
  const filter = argv.filter || argv.f;
  return scrUtils.prepareDocumentUpdateActions({
    filter: filter? JSON.parse(filter): null
  });
};

module.exports = utils;