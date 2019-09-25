const _ = require('lodash');
const _schema = require('spreadable/src/schema');
const schema = Object.assign({}, _schema);

schema.getStatusResponse = function () {
  return _.merge(_schema.getStatusResponse(), {
    props: {
      collections: {
        type: 'array',
        items: 'string'
      },
      documents: {
        type: 'array',
        items: 'number'
      }
    }
  })
};

schema.getStatusPrettyResponse = function () {
  return _.merge(this.getStatusResponse(), _schema.getStatusPrettyResponse());
};

schema.getDocumentSystemFields = function () {
  return {
    type: 'object',
    props: {
      $duplicate: 'string',
      $collection: 'string',
      $createdAt: 'number',
      $updatedAt: 'number', 
      $accessedAt: 'number',      
      $loki: 'number'
    }
  }
};

schema.getDocumentExistenceInfo = function (options = {}) {
  return Object.assign({}, options.schema, { 
    type: 'object',
    canBeNull: true
  });
};

schema.getDocumentAdditionInfoSlaveResponse = function (options = {}) {
  return {
    type: 'object',
    props: {
      address: this.getAddress(),
      count: 'number',
      isFull: 'boolean',
      isAvailable: 'boolean',
      existenceInfo: this.getDocumentExistenceInfo(options)
    },
    strict: true
  }
};

schema.getDocumentAdditionResponse = function (options = {}) {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      document:  options.schema || { type: 'object' }
    },
    strict: true
  }
};

schema.getDocumentAdditionCandidatesMasterResponse = function (options = {}) {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      candidates: {
        type: 'array',
        items: this.getDocumentAdditionInfoSlaveResponse(options),
        maxLength: options.networkOptimum
      },
      existing: {
        type: 'array',
        items: {
          type: 'object',
          props: {
            address,
            existenceInfo: this.getDocumentExistenceInfo(options) 
          },
          strict: true
        }
      }
    },
    strict: true
  }
};

schema.getDocumentsSlaveResponse = function (options = {}) {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      documents: {
        type: 'array',
        items: options.schema || { type: 'object' }
      }
    },
    strict: true
  }
};

schema.getDocumentsMasterResponse = function (options) {
  return this.getDocumentsSlaveResponse(options);
}

schema.updateDocumentsSlaveResponse = function () {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      updated: 'number'
    },
    strict: true
  }
};

schema.updateDocumentsMasterResponse = function () {
  return this.updateDocumentsSlaveResponse();
};

schema.deleteDocumentsSlaveResponse = function () {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      deleted: 'number'
    },
    strict: true
  }
};

schema.deleteDocumentsMasterResponse = function () {
  return this.deleteDocumentsSlaveResponse();
};

module.exports = schema;