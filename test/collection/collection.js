const assert = require('chai').assert;
const utils = require('../../src/utils');
const Collection = require('../../src/collection/transports/collection')();

describe('Behavior', () => {
  let collection;
  
  describe('instance creation', function () {
    it('should create an instance', function () {
      assert.doesNotThrow(() => collection = new Collection());
      collection.node = this.node;
      collection.name = 'test';
    });

    it('should create the default properties', function () { 
      assert.containsAllKeys(collection, [
        'pk', 'limit', 'queue', 'limitationOrder','preferredDuplicates'
      ]);
    });
  });

  describe('.init()', function () { 
    it('should not throw an exception', async function () {
      await collection.init();      
    }); 
    
    it('should create the scema field', function () { 
      assert.containsAllKeys(collection, ['schema']);
    });
  });

  describe('.prepareDocumentToAdd()', () => {
    it('should create the right document', async () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number',
          d: 'number'
        }
      };
      let document = { x: 1, d: new Date(), $createdAt: 1 };
      document = await collection.prepareDocumentToAdd(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });

  describe('.prepareDocumentToUpdate()', () => {
    it('should create the right document', async () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number',
          d: 'number'
        }
      };
      let document = { x: 1, d: new Date(), $createdAt: 1 };
      document = await collection.prepareDocumentToUpdate(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });

  describe('.prepareDocumentToGet()', () => {
    it('should create the right document', async () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number'
        }
      };
      let document = { x: 1, $createdAt: 1 };
      document = await collection.prepareDocumentToGet(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });

  describe('.deinit()', function () { 
    it('should not throw an exception', async function () {
      await collection.deinit();
    });
  }); 

  describe('reinitialization', () => {
    it('should not throw an exception', async function () {
      await collection.init();
    });
  });
  
  describe('.destroy()', function () { 
    it('should not throw an exception', async function () {
      await collection.destroy();
    });
  });
});