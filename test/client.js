const assert = require('chai').assert;
const Node = require('../src/node')();
const Client = require('../src/client')();
const tools = require('./tools');

describe('Client', () => {
  let client;
  let node;

  before(async function() {
    node = new Node(await tools.createNodeOptions({
      collections: {
        test1: { limit: 10 },
        test2: { pk: 'id' }
      }
    }));
    await node.init();
  });

  after(async function() {
    await node.deinit();
  });

  describe('instance creation', function () {
    it('should create an instance', async function () { 
      const options = await tools.createClientOptions({ address: node.address });
      assert.doesNotThrow(() => client = new Client(options));
    });
  });

  describe('.init()', function () {
    it('should not throw an exception', async function () {
      await client.init();
    });
  });

  describe('.addDocument()', () => {
    it('should add the document', async () => {
      const collection = 'test1';
      const document = { x: 1, y: 1 };
      const result = await client.addDocument(collection, document);
      const dbResult = (await node.getDocuments(collection)).documents[0];
      assert.equal(JSON.stringify(document), JSON.stringify(result), JSON.stringify(dbResult));
    });
  });

  describe('.getDocuments()', () => {
    it('should get all documents', async () => {
      const collection = 'test1';
      await client.addDocument(collection, { x: 2, y: 2 });
      const result = await client.getDocuments(collection);
      assert.lengthOf(result.documents, 2, 'check the array length');        
      assert.equal(result.totalCount, 2, 'check the total count');
    });

    it('should get documents with actions', async () => {
      const result = await client.getDocuments('test1', { filter: { x: 1 } });
      assert.lengthOf(result.documents, 1, 'check the array length');        
      assert.equal(result.totalCount, 1, 'check the total count');
    });        
  });

  describe('.updateDocuments()', () => {
    it('should update all documents', async () => {
      const collection = 'test1';
      const count = await node.db.getCollectionSize(collection);
      const result = await client.updateDocuments(collection, { z: 1 });
      const documents = await node.db.getDocuments(collection);
      assert.equal(result.updated, count, 'check the count'); 

      for(let i = 0; i < documents.length; i++) {
        assert.equal(documents[i].z, 1, 'check the key');
        assert.containsAllKeys(documents[i], ['x', 'y'], 'check the rest keys'); 
      }
    });

    it('should update documents with actions', async () => {
      const collection = 'test1';
      let result = await node.updateDocuments(collection, { z: 2 }, { filter: { x: 2 } });
      assert.equal(result.updated, 1, 'check the count');    
      result = await node.getDocuments(collection, { filter: { z: 2 } });
      assert.lengthOf(result.documents, 1, 'check the length');
    });
  });

  describe('.deleteDocuments()', () => {
    it('should delete all documents', async () => {
      const collection = 'test1';
      const count = await node.db.getCollectionSize(collection);
      const result = await client.deleteDocuments(collection);
      const documents = await node.db.getDocuments(collection);
      assert.equal(result.deleted, count, 'check the count');
      assert.lengthOf(documents, 0, 'check the length');
    });

    it('should delete filtered documents', async () => {
      const collection = 'test1';
      await client.addDocument(collection, { x: 1, y: 1 });
      await client.addDocument(collection, { x: 2, y: 2 });      
      const result = await client.deleteDocuments(collection, { filter: { x: 1 } });
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
      const result = await client.getDocumentsCount(collection);
      assert.equal(count, result);
    });

    it('should get the right filtered count', async () => {
      const result = await client.getDocumentsCount('test1', { filter: { x: 'wrong' } });
      assert.equal(result, 0);
    });
  });

  describe('.getDocumentByPk()', () => {
    it('should get the document', async () => {
      const collection = 'test2';
      await client.addDocument(collection, { id: 1, x: 1 });
      const document = await client.getDocumentByPk(collection, 1);
      assert.equal(document.id, 1);
    });

    it('should not get the document', async () => {
      const document = await client.getDocumentByPk('test2', 'wrong');
      assert.isNull(document);
    });
  });
  
  describe('.deinit()', function () {
    it('should not throw an exception', async function () {
      await client.deinit();
    });
  });
});