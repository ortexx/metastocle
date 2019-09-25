const assert = require('chai').assert;
const Node = require('../src/node')();
const utils = require('../src/utils');
const tools = require('./tools');

describe('Node', () => {
  let node;

  describe('instance creation', () => {
    it('should create an instance', async () => { 
      const options = await tools.createNodeOptions({ 
        collections: {
          start: {  preferredDuplicates: 9 },
          test1: { limit: 10 },
          test2: { pk: 'id' }
        }
      });
      assert.doesNotThrow(() => node = new Node(options));
    });
  });

  describe('.init()', () => {
    it('should not throw an exception', async () => {
      await node.init();
    });

    it('should create the start collection', async () => {
      assert.isObject(node.__collections.start);
    });
  });

  describe('.addCollection()', () => {
    it('should add the collection', async () => {
      const name = 'test';
      await node.addCollection(name, {});
      assert.equal(node.__collections.test.name, name);
    });
  });

  describe('.getCollection()', () => {
    it('should get the collection', async () => {
      const name = 'test';
      const collection = await node.getCollection(name);
      assert.equal(collection.name, name);
    });
  });

  describe('.removeCollection()', () => {
    it('should remove the collection', async () => {
      const name = 'test';
      await node.removeCollection(name);
      const collection = await node.getCollection(name);
      assert.isNull(collection);
    });
  });

  describe('.collectionTest()', () => {
    it('should throw an exception', async () => {
      try {
        await node.collectionTest('wrong');
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match(`doesn't exist`));        
      }
    });

    it('should nor throw an exception', async () => {
      await node.collectionTest('start');
    });
  });

  describe('.checkCollection()', () => {
    it('should return false', async () => {
      assert.isFalse(await node.checkCollection('wrong'));
    });

    it('should return true', async () => {
      assert.isTrue(await node.checkCollection('start'));
    });
  });

  describe('.addDocument()', () => {
    it('should not add the document to the wrong collection', async () => {
      try {
        await node.addDocument('wrong', { x: 1 });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match(`doesn't exist`));   
      }
    });

    it('should add the document', async () => {
      const document = { x: 1, y: 1 };
      const result = await node.addDocument('test1', document);
      assert.equal(JSON.stringify(document), JSON.stringify(result));
    });

    it('should add the document with specified pk', async () => {
      const document = { id: 1, x: 1 };
      const result = await node.addDocument('test2', document);
      assert.equal(result.id, document.id);
    });

    it('should add the document with unspecified pk', async () => {
      const document = { x: 1 };
      const result = await node.addDocument('test2', document);
      assert.isString(result.id);
    });

    it('should not add the existent document', async () => {
      try {
        await node.addDocument('test2', { id: 1, x: 2 });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('already exists'));   
      }
    });
  });

  describe('.getDocuments()', () => {
    it('should get the start document', async () => {
      const result = await node.getDocuments('test1');
      assert.lengthOf(result.documents, 1, 'check the array length');
      assert.equal(result.totalCount, 1, 'check the total count');
    });

    it('should get all documents', async () => {
      const collection = 'test1';
      await node.addDocument(collection, { x: 2, y: 2 });
      await node.addDocument(collection, { x: 1, y: 1 });
      const result = await node.getDocuments(collection);
      assert.lengthOf(result.documents, 3, 'check the array length');        
      assert.equal(result.totalCount, 3, 'check the total count');
      assert.equal(result.documents[result.documents.length - 1].x, 1, 'check the order');
    });

    it('should get all documents sorted by x', async () => {
      const result = await node.getDocuments('test1', { sort: ['x'] });
      assert.equal(result.documents[result.documents.length - 1].x, 2);
    });

    it('should get all documents with the necessary keys', async () => {
      const result = await node.getDocuments('test1', { fields: ['y'] });
      const documents = result.documents;

      for(let i = 0; i < documents.length; i++) {
        assert.isFalse(documents[i].hasOwnProperty('x'));
      }
    });

    it('should get filtered documents', async () => {
      const result = await node.getDocuments('test1', { filter: { x: 1 } });
      assert.lengthOf(result.documents, 2, 'check the array length');        
      assert.equal(result.totalCount, 2, 'check the total count');
    });

    it('should get limited documents', async () => {
      const result = await node.getDocuments('test1', { limit: 1, offset: 1 });
      assert.lengthOf(result.documents, 1, 'check the array length');   
      assert.equal(result.documents[0].x, 2, 'check the order');
      assert.equal(result.totalCount, 3, 'check the total count');
    });
  });

  describe('.updateDocuments()', () => {
    it('should update all documents', async () => {
      const collection = 'test1';
      const count = await node.db.getCollectionSize(collection);
      const result = await node.updateDocuments(collection, { z: 1 });
      const documents = await node.db.getDocuments(collection);
      assert.equal(result.updated, count, 'check the count'); 

      for(let i = 0; i < documents.length; i++) {
        assert.equal(documents[i].z, 1, 'check the key');
        assert.containsAllKeys(documents[i], ['x', 'y'], 'check the rest keys'); 
      }
    });

    it('should update filtered documents', async () => {
      const collection = 'test1';
      let result = await node.updateDocuments(collection, { z: 2 }, { filter: { x: 2 } });
      assert.equal(result.updated, 1, 'check the count');    
      result = await node.getDocuments(collection, { filter: { z: 2 } });
      assert.lengthOf(result.documents, 1, 'check the length');
    });

    it('should update all documents with replacement', async () => {
      const collection = 'test1';
      await node.updateDocuments(collection, { z: 0 }, { replace: true });
      const documents = await node.db.getDocuments(collection);

      for(let i = 0; i < documents.length; i++) {
        assert.equal(documents[i].z, 0, 'check the key');
        assert.doesNotHaveAllKeys(documents[i], ['x', 'y'], 'check the rest keys'); 
      }
    });
  });

  describe('.deleteDocuments()', () => {
    it('should delete all documents', async () => {
      const collection = 'test1';
      const count = await node.db.getCollectionSize(collection);
      const result = await node.deleteDocuments(collection);
      const documents = await node.db.getDocuments(collection);
      assert.equal(result.deleted, count, 'check the count');
      assert.lengthOf(documents, 0, 'check the length');
    });

    it('should delete filtered documents', async () => {
      const collection = 'test1';
      await node.addDocument(collection, { x: 2, y: 2 });
      await node.addDocument(collection, { x: 1, y: 1 });
      const result = await node.deleteDocuments(collection, { filter: { x: 1 } });
      const documents = await node.db.getDocuments(collection);
      assert.equal(result.deleted, 1, 'check the count');
      assert.lengthOf(documents, 1, 'check the length');
      assert.equal(documents[0].x, 2, 'check the content');
    });
  });

  describe('.getDocumentsCount()', () => {
    it('should get the right count', async () => {
      const collection = 'test1';
      await node.addDocument(collection, { x: 1, y: 1 });
      const count = await node.db.getCollectionSize(collection);
      const result = await node.getDocumentsCount(collection);
      assert.equal(count, result);
    });

    it('should get the right filtered count', async () => {
      const result = await node.getDocumentsCount('test1', { filter: { x: 'wrong' } });
      assert.equal(result, 0);
    });
  });

  describe('.getDocumentByPk()', () => {
    it('should get the document', async () => {
      const document = await node.getDocumentByPk('test2', 1);
      assert.equal(document.id, 1);
    });

    it('should not get the document', async () => {
      const document = await node.getDocumentByPk('test2', 'wrong');
      assert.isNull(document);
    });
  });

  describe('.getDocumentExistenceInfo()', () => {
    it('should return null because of pkValue is not passed', async () => {
      assert.isNull(await node.getDocumentExistenceInfo({}));
    });

    it('should return null because of wrong pkValue', async () => {
      const info = { 
        pkValue: 'wrong',
        collection: 'test2'
      };

      assert.isNull(await node.getDocumentExistenceInfo(info));
    });

    it('should return true', async () => {
      const info = { 
        pkValue: 1,
        collection: 'test2'
      };

      assert.isObject(await node.getDocumentExistenceInfo(info));
    });
  });

  describe('.checkDocumentFullness()', () => {
    it('should return false', async () => {
      const info = {
        collection: 'test1'
      };

      assert.isFalse(await node.checkDocumentFullness(info));
    });

    it('should return true', async () => {
      const info = {
        count: 10,
        collection: 'test1'
      };

      assert.isTrue(await node.checkDocumentFullness(info));
    });
  });

  describe('.documentAvailabilityTest()', () => {
    it('should not throw an exception because of the count', async () => {
      const info = {
        collection: 'test1'
      };

      await node.documentAvailabilityTest(info);
    });

    it('should not throw an exception because of the queue', async () => {
      const info = {
        count: 10,
        collection: 'test1'
      };

      const collection = await node.getCollection('test1');
      collection.queue = true;
      await node.documentAvailabilityTest(info);
      collection.queue = false;
    });

    it('should throw an exception because of the limitation', async () => {
      const info = {
        count: 10,
        collection: 'test1'
      };

      try {
        await node.documentAvailabilityTest(info);
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('Too much')); 
      }        
    });
  });

  describe('.checkDocumentAvailability()', () => {
    it('should return false', async () => {
      const info = {
        count: 10,
        collection: 'test1'
      };        

      assert.isFalse(await node.checkDocumentAvailability(info));
    });

    it('should return true', async () => {
      const info = {
        collection: 'test1'
      };

      assert.isTrue(await node.checkDocumentAvailability(info));
    });
  });

  describe('.chooseDocumentsDuplicate()', () => {
    it('should return null', async () => {
      assert.isNull(await node.chooseDocumentsDuplicate([]));
    });

    it('should return the right element', async () => {
      const now = Date.now();
      const obj = { $createdAt: now };
      const arr = [ { $createdAt: now + 1 },  obj, { $createdAt: now + 2 } ];
      assert.strictEqual(obj, await node.chooseDocumentsDuplicate(arr));
    });
  });

  describe('.uniqDocuments()', () => {
    it('should remove the duplicates', async () => {
      const arr = [ 
        { $duplicate: 1 },
        { $duplicate: 1 },
        { $duplicate: 2 },
        { $duplicate: 2 },
        { $duplicate: 3 }
      ];

      assert.lengthOf(await node.uniqDocuments(arr), 3);
    });
  });

  describe('.createDocumentFullSchema()', () => {
    it('should create the schema', () => {
      const schema = node.createDocumentFullSchema({
        type: 'object',
        props: {
          id: 'number',
          x: 'number'
        }
      });

      assert.doesNotThrow(() => utils.validateSchema(schema, { id: 1, x: 1, $createdAt: Date.now() }), 'check the right full data');
      assert.doesNotThrow(() => utils.validateSchema(schema, { id: 1 }), 'check the right partial data');
      assert.throws(() => utils.validateSchema(schema, { id: 1, y: 2 }), '', 'check the wrong data');
    });
  });

  describe('.prepareDocumentToAdd()', () => {
    it('should create the right document', () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number',
          d: 'number'
        }
      };
      let document = { x: 1, d: new Date(), $createdAt: 1 };
      document = node.prepareDocumentToAdd(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });

  describe('.prepareDocumentToUpdate()', () => {
    it('should create the right document', () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number',
          d: 'number'
        }
      };
      let document = { x: 1, d: new Date(), $createdAt: 1 };
      document = node.prepareDocumentToUpdate(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });

  describe('.prepareDocumentToGet()', () => {
    it('should create the right document', () => {
      const schema = {
        type: 'object',
        props: {
          x: 'number'
        }
      };
      let document = { x: 1, $createdAt: 1 };
      document = node.prepareDocumentToGet(document);
      assert.doesNotThrow(() => utils.validateSchema(schema, document));
    });
  });
  
  describe('.deinit()', () => {
    it('should not throw an exception', async () => {
      await node.deinit();
    });
  }); 

  describe('reinitialization', () => {
    it('should not throw an exception', async () => {
      await node.init();
    });
  });

  describe('.destroy()', () => {
    it('should not throw an exception', async () => {
      await node.destroy();
    });
  });
});