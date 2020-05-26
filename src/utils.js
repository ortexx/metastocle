const utils = Object.assign({}, require('spreadable/src/utils'));
const merge = require('lodash/merge');
const orderBy = require('lodash/orderBy');
const pickBy = require('lodash/pickBy');
const pick = require('lodash/pick');
const get = require('lodash/get');
const escapeRegExp = require('lodash/escapeRegExp');
const errors = require('./errors');

/**
 * Class to handle documents: to filter, order, limit and etc.
 */
utils.DocumentsHandler = class {
  /**
   * @param {object[]} documents
   */
  constructor(documents) {
    this.__documents = documents;
  }

  /**
   * Get the documents
   * 
   * @returns {object[]}
   */
  getDocuments() {
    return this.__documents;
  }

  /**
   * Filter the documents
   * 
   * @param {object} filter
   */
  filterDocuments(filter) {
    this.__documents = this.__documents.filter(d => this.checkDocumentValue(d, filter));
  }

  /**
   * Sort the documents
   * 
   * @param {array[]|string[]} sort 
   */
  sortDocuments(sort = []) {
    const fields = [];
    const directions = [];

    if(!Array.isArray(sort)) {
      throw new errors.WorkError(`Sort rule must be an array`, 'ERR_METASTOCLE_DOCUMENTS_HANDLER_SORT_TYPE');
    }
    
    for(let i = 0; i < sort.length; i++) {
      const order = sort[i];
      let field = order;
      let direction = 'asc';

      if(Array.isArray(order)) {
        field = order[0];
        direction = order[1];
      }

      fields.push(field);
      directions.push(direction);
    }
    
    this.__documents = orderBy(this.__documents, fields, directions);
  }

  /**
   * Limit the documents
   * 
   * @param {integer} offset
   * @param {integer} limit
   */
  limitDocuments(offset = 0, limit = 0) {
    const start = offset * limit;
    this.__documents = this.__documents.slice(start, start + limit);
  }

  /**
   * Pick the documents fields
   * 
   * @param {string[]} fields
   */
  fieldDocuments(fields = []) {
    if(!Array.isArray(fields)) {
      throw new errors.WorkError(`Fields must be an array`, 'ERR_METASTOCLE_DOCUMENTS_HANDLER_FIELD_TYPE');
    }

    this.__documents = this.__documents.map(d => pickBy(d, (v, k) => fields.includes(k) || k.startsWith('$')));
  }

  /**
   * Check the document value
   * 
   * @param {*} value
   * @param {*} filter
   * @returns {boolean}
   */
  checkDocumentValue(value, filter) {
    if(!filter || typeof filter != 'object' || Array.isArray(filter)) {      
      return this.$eq(value, filter);
    }

    for(let key in filter) {
      if(key == '$and') {
        for(let i = 0; i < filter[key].length; i++) {
          if(!this.checkDocumentValue(value, filter[key][i])) {
            return false;
          }
        }
        continue;
      }

      if(key == '$or') {
        const res = [];

        for(let i = 0; i < filter[key].length; i++) {
          res.push(this.checkDocumentValue(value, filter[key][i]));
        }

        if(res.indexOf(true) == -1) {
          return false;
        }

        continue;
      }

      if(key.startsWith('$')) {
        if(typeof this[key] != 'function') {
          throw new errors.WorkError(`There is no filter for key "${key}"`, 'ERR_METASTOCLE_DOCUMENTS_HANDLER_WRONG_FILTER');
        }

        if(!this[key](value, filter[key])) {
          return false;
        }

        continue;
      }
      
      if(!this.checkDocumentValue(get(value, key), filter[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compare equality
   * 
   * @example
   * // returns false 
   * $eq(1, 2)
   * 
   * @example
   * // returns true
   * $eq(1, '1')
   * 
   * @example
   * // returns true
   * $eq(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $eq(value, filter) {
    return value == filter;
  }

  /**
   * Compare inequality
   * 
   * @example
   * // returns true 
   * $ne(1, 2)
   * 
   * @example
   * // returns false
   * $ne(1, '1')
   * 
   * @example
   * // returns false
   * $ne(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $ne(value, filter) {
    return value != filter;
  }

  /**
   * Compare equality strictly
   * 
   * @example
   * // returns false 
   * $eqs(1, 2)
   * 
   * @example
   * // returns false
   * $eqs(1, '1')
   * 
   * @example
   * // returns true
   * $eqs(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $eqs(value, filter) {
    return value === filter;
  }

  /**
   * Compare inequality strictly
   * 
   * @example
   * // returns true 
   * $nes(1, 2)
   * 
   * @example
   * // returns true
   * $nes(1, '1')
   * 
   * @example
   * // returns false
   * $nes(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $nes(value, filter) {
    return value !== filter;
  }

  /**
   * Check the value is greater than the filter
   * 
   * @example
   * // returns false 
   * $gt(1, 2)
   * 
   * @example
   * // returns true
   * $gt(2, '1')
   * 
   * @example
   * // returns false
   * $gt(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $gt(value, filter) {
    return value > filter;
  }

  /**
   * Check the value is greater or equal than the filter
   * 
   * @example
   * // returns false 
   * $gte(1, 2)
   * 
   * @example
   * // returns true
   * $gte(2, '1')
   * 
   * @example
   * // returns true
   * $gte(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $gte(value, filter) {
    return value >= filter;
  }

  /**
   * Check the value is less than the filter
   * 
   * @example
   * // returns true 
   * $lt(1, 2)
   * 
   * @example
   * // returns false
   * $lt('2', 1)
   * 
   * @example
   * // returns false
   * $lt(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $lt(value, filter) {
    return value < filter;
  }

  /**
   * Check the value is less or equal than the filter
   * 
   * @example
   * // returns true 
   * $lte(1, 2)
   * 
   * @example
   * // returns false
   * $lte('2', 1)
   * 
   * @example
   * // returns true
   * $lte(1, 1)
   * 
   * @param {*} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $lte(value, filter) {
    return value <= filter;
  }

  /**
   * Check the value is in the array
   * 
   * @example
   * // returns true 
   * $in(1, [1, 2])
   * 
   * @example
   * // returns false 
   * $in(3, [1, 2])
   * 
   * @param {*} value 
   * @param {array} filter 
   */
  $in(value, filter) {
    utils.validateSchema({ type: 'array' }, filter);
    return filter.includes(value);
  }

  /**
   * Check the value is not in the array
   * 
   * @example
   * // returns true 
   * $nin(1, [1, 2])
   * 
   * @example
   * // returns true 
   * $nin(3, [1, 2])
   * 
   * @param {*} value 
   * @param {array} filter 
   */
  $nin(value, filter) {
    utils.validateSchema({ type: 'array' }, filter);
    return !filter.includes(value);
  }

  /**
   * Check the value starts with the filter
   * 
   * @example
   * // returns true 
   * $sw('text', 'te')
   * 
   * @example
   * // returns false 
   * $sw('text', 'xt')
   * 
   * @param {string} value 
   * @param {string} filter 
   */
  $sw(value, filter) {
    utils.validateSchema({ type: 'string' }, value);
    utils.validateSchema({ type: 'string' }, filter);
    return value.startsWith(filter);
  }

  /**
   * Check the value ends with the filter
   * 
   * @example
   * // returns true 
   * $ew('text', 'xt')
   * 
   * @example
   * // returns false 
   * $ew('text', 'te')
   * 
   * @param {string} value 
   * @param {string} filter 
   */
  $ew(value, filter) {
    utils.validateSchema({ type: 'string' }, value);
    utils.validateSchema({ type: 'string' }, filter);
    return value.endsWith(filter);
  }

  /**
   * Check the value matchs the filter
   * 
   * @example
   * // returns true 
   * $lk('text', 'ex')
   * 
   * @example
   * // returns false 
   * $lk('text', 'go')
   * 
   * @param {string} value 
   * @param {string} filter
   */
  $lk(value, filter) {
    utils.validateSchema({ type: 'string' }, value);
    utils.validateSchema({ type: 'string' }, filter);
    return !!value.match(filter);
  }

  /**
   * Check the value matchs the regex filter
   * 
   * @example
   * // returns false 
   * $rx('texT', { source: 'text' })
   * 
   * @example
   * // returns true 
   * $rx('text', { source: 'text', flags: 'i' })
   * 
   * @param {string} value 
   * @param {object} filter 
   */
  $rx(value, filter) {
    utils.validateSchema({ type: 'string' }, value);
    utils.validateSchema({ 
      type: 'object',
      props: {
        source: 'string',
        flags: 'string'
      },
      required: ['source']
    }, filter);
    return !!value.match(new RegExp(escapeRegExp(filter.source), filter.flags));
  }

  /**
   * Check the array length is greater than the filter
   * 
   * @example
   * // returns false 
   * $lgt([1], 2)
   * 
   * @example
   * // returns false 
   * $lgt([1], 1)
   * 
   * @example
   * // returns true
   * $lgt([1, 2], '1')
   * 
   * @param {array} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $lgt(value, filter) {
    utils.validateSchema({ type: 'array' }, value);
    return value.length > filter;
  }

  /**
   * Check the array length is greater or equal than the filter
   * 
   * @example
   * // returns false 
   * $lgte([1], 2)
   * 
   * @example
   * // returns true 
   * $lgte([1], 1)
   * 
   * @example
   * // returns true
   * $lgte([1, 2], '1')
   * 
   * @param {array} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $lgte(value, filter) {
    utils.validateSchema({ type: 'array' }, value);
    return value.length >= filter;
  }

  /**
   * Check the array length is greater than the filter
   * 
   * @example
   * // returns true 
   * $llt([1], 2)
   * 
   * @example
   * // returns false 
   * $llt([1], 1)
   * 
   * @example
   * // returns false
   * $llt([1, 2], '1')
   * 
   * @param {array} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $llt(value, filter) {
    utils.validateSchema({ type: 'array' }, value);
    return value.length < filter;
  }

  /**
   * Check the array length is less or equal than the filter
   * 
   * @example
   * // returns true 
   * $llte([1], 2)
   * 
   * @example
   * // returns true 
   * $llte([1], 1)
   * 
   * @example
   * // returns false
   * $llte([1, 2], '1')
   * 
   * @param {array} value 
   * @param {*} filter
   * @returns {boolean}
   */
  $llte(value, filter) {
    utils.validateSchema({ type: 'array' }, value);
    return value.length <= filter;
  }
}

/**
 * Check the variable is document
 * 
 * @param {*} document
 * @returns {boolean}
 */
utils.isDocument = function (document) {
  return !!(document && typeof document == 'object' && !Array.isArray(document) && Object.keys(document).length);
};

/**
 * Check the variable is actions
 * 
 * @param {*} actions
 * @returns {boolean}
 */
utils.isActions = function (actions) {
  return !!(actions && typeof actions == 'object' && !Array.isArray(actions));
}

/**
 * Test the actions are right
 * 
 * @param {*} actions
 */
utils.actionsTest = function (actions) {
  if(!this.isActions(actions)) {
    const msg =`Wrong actions: ${ JSON.stringify(actions, null, 1) }`;
    throw new errors.WorkError(msg, 'ERR_METASTOCLE_WRONG_DOCUMENT_ACTIONS');
  }
}

/**
 * Prepare the document filter
 * 
 * @param {object} filter
 * @returns {object}
 */
utils.prepareDocumentFilter = function (filter) {
  if(!filter || typeof filter != 'object') {
    const msg = `Document filter must must be an object`;
    throw new errors.WorkError(msg, 'ERR_METASTOCLE_WRONG_DOCUMENT_FILTER');
  }

  for(let key in filter) {
    const val = filter[key];

    if(key == '$and' || key == '$or') {
      filter[key] = this.prepareDocumentFilter(val);
      continue;
    }

    if(val instanceof RegExp) {
      filter[key] = { source: val.source, flags: val.flags };
      continue;
    }

    if(val instanceof Date) {
      filter[key] = val.getTime();
      continue;
    }

    if(typeof val == 'object') {
      filter[key] = this.prepareDocumentFilter(val);
      continue;
    }
  }

  return filter;
};

/**
 * Prepare the document fields
 * 
 * @param {object} fields
 * @returns {object}
 */
utils.prepareDocumentFields = function (fields) {
  if(!fields || typeof fields != 'object') {
    const msg = `Document fields must must be an object`;
    throw new errors.WorkError(msg, 'ERR_METASTOCLE_WRONG_DOCUMENT_FIELDS');
  }

  for(let key in fields) {
    const val = fields[key];

    if(val instanceof Date) {
      fields[key] = val.getTime();
      continue;
    }

    if(typeof val == 'object') {
      fields[key] = this.prepareDocumentFields(val);
      continue;
    }
  }

  return fields;
};

/**
 * Prepare the document getting actions
 * 
 * @param {object} actions
 * @returns {object}
 */
utils.prepareDocumentGettingActions = function (actions) {
  this.actionsTest(actions);
  return merge({
    sort: null,
    fields: null,
    offset: 0,
    limit: 0,
    removeDuplicates: true
  }, pick(actions, ['filter', 'sort', 'fields', 'offset', 'limit', 'removeDuplicates']), {
    filter: actions.filter? this.prepareDocumentFilter(actions.filter): null
  });
};

/**
 * Prepare the document update actions
 * 
 * @param {object} actions
 * @returns {object}
 */
utils.prepareDocumentUpdateActions = function (actions) {
  this.actionsTest(actions);
  return merge({
    replace: false,
  }, pick(actions, ['replace', 'filter']), {
    filter: actions.filter? utils.prepareDocumentFilter(actions.filter): null
  });
};

/**
 * Prepare the document deletion actions
 * 
 * @param {object} actions
 * @returns {object}
 */
utils.prepareDocumentDeletionActions = function (actions) {
  this.actionsTest(actions);
  return merge({}, pick(actions, ['filter']), {
    filter: actions.filter? utils.prepareDocumentFilter(actions.filter): null
  });
};

module.exports = utils;
