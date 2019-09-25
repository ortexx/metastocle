const utils = Object.assign({}, require('spreadable/bin/utils'));
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
  const removeDublicates = argv.removeDublicates || argv.w;

  return scrUtils.prepareDocumentGettingActions({
    filter: filter? JSON.parse(filter): null,
    sort: sort? JSON.parse(sort): null,
    fields: fields? JSON.parse(fields): null,
    limit,
    offset,
    removeDublicates
  });
};

/**
 * Create the document updation actions
 * 
 * @param {object} argv
 * @returns {object}
 */
utils.prepareDocumentUpdationActions = function (argv) {
  const filter = argv.filter || argv.f;
  const replace = argv.replace || argv.r;

  return scrUtils.prepareDocumentUpdationActions({
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

  return scrUtils.prepareDocumentUpdationActions({
    filter: filter? JSON.parse(filter): null
  });
};

module.exports = utils;