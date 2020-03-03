const assert = require('chai').assert;
const Collection = require('../../src/collection/transports/collection')();

describe('Behavior', () => {
  let collection;
  
  describe('instance creation', function () {
    it('should create an instance', function () {
      assert.doesNotThrow(() => collection = new Collection(this.node));
    });

    it('should create the default properties', function () { 
      assert.containsAllKeys(collection, [
        'pk', 'limit', 'queue',  'limitationOrder','preferredDuplicates', 'schema'
      ]);
    });
  });

  describe('.init()', function () { 
    it('should not throw an exception', async function () {
      await collection.init();
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