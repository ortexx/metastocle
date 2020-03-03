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

schema.getDocumentAdditionInfoMasterResponse = function (options = {}) {
  return this.getDocumentAdditionInfoButlerResponse(options);
}

schema.getDocumentAdditionInfoButlerResponse = function (options = {}) {
  const address = this.getAddress();

  return {
    type: 'object',
    props: {
      address,
      candidates: {
        type: 'array',
        uniq: 'address',
        items: this.getDocumentAdditionInfoSlaveResponse(options),        
        maxLength: options.networkOptimum
      },
      existing: {
        type: 'array',
        uniq: 'address',
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

schema.getDocumentsMasterResponse = function (options) {
  return this.getDocumentsButlerResponse(options);
}

schema.getDocumentsButlerResponse = function (options) {
  return this.getDocumentsSlaveResponse(options);
}

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

schema.updateDocumentsMasterResponse = function () {
  return this.updateDocumentsButlerResponse();
};

schema.updateDocumentsButlerResponse = function () {
  return this.updateDocumentsSlaveResponse();
};

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

schema.deleteDocumentsMasterResponse = function () {
  return this.deleteDocumentsButlerResponse();
};

schema.deleteDocumentsButlerResponse = function () {
  return this.deleteDocumentsSlaveResponse();
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

module.exports = schema;