const assert = require('chai').assert;
const fse = require('fs-extra');
const sizeof = require('object-sizeof');
const tools = require('../tools');
const DatabaseLokiMetastocle = require('../../src/db/transports/loki')();

describe('DatabaseLokiMetastocle', () => {
  let loki;
  let lastNodeDb;
  
  describe('instance creation', function () {
    it('should create an instance', function () { 
      assert.doesNotThrow(() => loki = new DatabaseLokiMetastocle(this.node, {
        filename: tools.getDbFilePath(this.node)
      }));    
      lastNodeDb = this.node.db;
      this.node.db = loki;
    });
  });

  describe('.init()', function () { 
    it('should not throw an exception', async function () {
      await loki.init();
    });  
    
    it('should create the db file', async function () {    
      assert.isTrue(await fse.pathExists(tools.getDbFilePath(this.node)));
    });
  });  

  describe('.createCollectionName()', function () { 
    it('should create the right name', function () {
      const name = loki.createCollectionName('test');
      assert.equal(name, 'metaTest');
    });
  });  

  describe('.createDocumentPrimaryKey()', function () { 
    it('should create pk', function () {
      assert.isString(loki.createDocumentPrimaryKey({}));
    });
  });

  describe('.createDocumentDuplicationKey()', function () { 
    it('should create duplicate key', function () {
      assert.isString(loki.createDocumentDuplicationKey({}));
    });
  });

  describe('.removeDocumentSystemFields()', function () { 
    it('should remove all system fields', function () {
      const doc = loki.removeDocumentSystemFields({ $createdAt: 1, $acceptedAt: 1 });
      assert.doesNotHaveAllKeys(doc, ['$createdAt', '$acceptedAt']);
    });

    it('should remove not all system fields', function () {
      const doc = loki.removeDocumentSystemFields({ $createdAt: 1, $acceptedAt: 1 }, ['$acceptedAt']);
      assert.hasAllKeys(doc, ['$acceptedAt']);
    });
  });

  describe('.addCollection()', function () { 
    it('should add the collection', async function () {
      const name = 'test';
      const collection = await loki.addCollection(name, {});
      const fullName = loki.createCollectionName(name);
      assert.isObject(collection, 'check the type');
      assert.isObject(loki.loki.getCollection(fullName), 'check the loki db collection');     
      assert.strictEqual(loki.col[fullName], collection, 'check the equivalence');
    });
  });

  describe('.getCollection()', function () { 
    it('should get the collection', async function () {
      const name = 'test';
      const collection = await loki.getCollection(name);
      const fullName = loki.createCollectionName(name);
      assert.strictEqual(loki.col[fullName], collection, loki.loki.getCollection(fullName));
    });
  });

  describe('.emptyCollection()', function () { 
    it('should empty the collection', async function () {
      const name = 'test';
      const collection = await loki.getCollection(name);

      for(let i = 0; i < 5; i++) {
        await collection.insert({ x: i + 1 });
      }
      
      await loki.emptyCollection(name);
      assert.equal(collection.count(), 0);
    });
  });

  describe('.removeCollection()', function () { 
    it('should remove the collection', async function () {
      const name = 'test';
      await loki.removeCollection(name);
      const fullName = loki.createCollectionName(name);
      assert.isNotOk(loki.loki.getCollection(fullName), 'check the interface');
      assert.isNotOk(loki.col[fullName], 'check the loki db collection');
    });
  });  

  describe('.normalizeCollections()', function () { 
    let col;

    before(async function () {      
      await this.node.addCollection('test', { pk: 'id', limit: 2 });
      col = loki.col[loki.createCollectionName('test')];
    });

    it('should normalize pk', async function () {
      col.insert({ id: 1, x: 1 });
      col.insert({ x: 2 });
      assert.equal(col.chain().count(), 2, 'check before');
      await loki.normalizeCollections();
      assert.equal(col.chain().count(), 1, 'check after');
    });

    it('should normalize the limitation', async function () {
      const count = col.chain().count();
      const limit = (await this.node.getCollection('test')).limit; 
      const length = limit - count;

      for(let i = 0; i < length + 1; i++) {
        col.insert({ id: i + 2 });
      }

      assert.equal(col.chain().count(), limit + 1, 'check before');
      await loki.normalizeCollections();
      assert.equal(col.chain().count(), limit, 'check after');
    });

    it('should normalize the collection absence', async function () {
      delete this.node.__collections.test;
      await loki.normalizeCollections();
      assert.isNull(await loki.getCollection('test'));
    });
  });

  describe('.removeCollectionExcessDocumentsByLimit()', function () { 
    let col;

    before(async function () {      
      await this.node.addCollection('test', { limit: 2 });
      col = loki.col[loki.createCollectionName('test')];
    });

    after(async function () {
      await this.node.removeCollection('test');
    });

    it('should not change the count', async function () {
      const count = col.chain().count();
      await loki.removeCollectionExcessDocuments('test');
      assert.equal(count, col.chain().count());
    });

    it('should remove the excess documents', async function () {
      const limit = (await this.node.getCollection('test')).limit; 
      let last;

      for(let i = 0; i < 4; i++) {
        last = i + 2;
        col.insert({ id: last, $accessedAt: Date.now() + i });
      }

      await loki.removeCollectionExcessDocuments('test');
      assert.equal(col.chain().count(), limit, 'check the count');
      assert.isNotNull(col.findOne({ id: last }), 'check the order');
    });
  });

  describe('.removeCollectionExcessDocumentsBySize()', function () { 
    let col;

    before(async function () {      
      await this.node.addCollection('test', {});
      col = loki.col[loki.createCollectionName('test')];
    });

    after(async function () {
      await this.node.removeCollection('test');
    });

    it('should not change the count', async function () {
      const count = col.chain().count();
      await loki.removeCollectionExcessDocuments('test');
      assert.equal(count, col.chain().count());
    });

    it('should remove the excess documents', async function () {      
      const collection = await this.node.getCollection('test');      
      let lastId;
      let lastSize;

      for(let i = 0; i < 4; i++) {        
        lastId = i + 1;
        const doc = { id: lastId, $accessedAt: Date.now() + i };
        lastSize = sizeof(col.insert(doc));
      }

      const size = sizeof(col.data);
      const count = col.chain().count();      
      collection.maxSize = size - lastSize - 1;
      await loki.removeCollectionExcessDocuments('test');
      assert.equal(col.chain().count(), count / 2, 'check the count');
      assert.isNotNull(col.findOne({ id: lastId }), 'check the order');
    });
  });

  describe('.getCollectionSize()', function () { 
    let col;

    before(async function () {
      await this.node.addCollection('test', {});
      col = loki.col[loki.createCollectionName('test')];
    });

    after(async function () {
      await this.node.removeCollection('test');
    });

    it('should get zero', async function () {
      assert.equal(await loki.getCollectionSize('test'), 0);
    });

    it('should get one', async function () {
      col.insert({ x: 1 });
      assert.equal(await loki.getCollectionSize('test'), 1);
    });
  });

  describe('.addDocument()', function () { 
    let col;

    before(async function () {
      await this.node.addCollection('test', {
        schema: {
          type: 'object',
          props: {
            id: 'number',
            x: 'number',
            required: ['id', 'x']
          }
        },
        pk: 'id',
        limit: 1
      });
      col = loki.col[loki.createCollectionName('test')];
    });

    after(async function () {
      await this.node.removeCollection('test');
    });

    it('should not create document with wrong schema', async function () {
      try {
        await loki.addDocument('test', { id: 1, y: 2 });
        await loki.addDocument('test', { id: 2 });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('Wrong'));
      }
    });

    it('should create document with all fields', async function () {
      const collection = 'test';
      const document = await loki.addDocument(collection, { id: 1, x: 1 });
      assert.equal(document.$collection, collection, 'check the collection');
      assert.containsAllKeys(document, ['$createdAt', '$accessedAt', '$updatedAt', '$duplicate'], 'check the keys');
    });

    it('should not create document because of the limitation', async function () {
      try {
        await loki.addDocument('test', { id: 2, x: 2 });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('Too much'));
      }
    });    

    it('should remove the queue first item', async function () {
      (await this.node.getCollection('test')).queue = true;
      await loki.addDocument('test', { id: 2, x: 2 });
      const docs = col.find();
      assert.lengthOf(docs, 1, 'check the length');
      assert.equal(docs[0].x, 2, 'check the content');
    });
  });

  describe('.handleDocument()', function () { 
    let $collection;
    let col;

    before(async function () {
      $collection = 'test',

      await this.node.addCollection($collection, { 
        pk: 'id',
        defaults: {
          z: () => 1,
          x: 1
        },
        setters: {
          d: () => 1,
          t: 1
        }
      });
      col = loki.col[loki.createCollectionName($collection)];
      await loki.addDocument($collection, { id: 1, x: 1 });
    });

    after(async function () {
      await this.node.removeCollection($collection);
    });

    it('should not handle the document because of $collection', async function () {
      try {
        await loki.handleDocument({ id: 2 });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('\\$collection'));
      }
    });

    it('should not handle document because of pk existence', async function () {
      try {
        await loki.handleDocument({ id: 1, $collection });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('already exists'));
      }
    });

    it('should not handle document because of pk existence using options.pks', async function () {
      try {
        await loki.handleDocument({ id: 2, $collection }, { pks: { 2: {} } });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('already exists'));
      }
    });

    it('should not handle document because of a dublication', async function () {
      try {
        const doc = col.findOne();
        await loki.handleDocument({ $duplicate: doc.$duplicate, $collection });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('already exists'));
      }
    });

    it('should not handle document because of pk type', async function () {
      try {
        await loki.handleDocument({ id: [], x: 1, $collection });
        throw new Error('Fail');
      }
      catch(err) {
        assert.isOk(err.message.match('a string or a number'));
      }
    });

    it('should handle the right document', async function () {
      const doc = await loki.handleDocument({ id: 2, $collection });
      assert.equal(doc.id, 2);
    });

    it('should handle the existent document', async function () {
      const doc = await loki.handleDocument(col.findOne());
      assert.isObject(doc);
    });

    it('should handle the default pk', async function () {
      const doc = await loki.handleDocument({ x: 1, $collection });
      assert.isString(doc.id);
    });

    it('should handle the default fields', async function () {
      const doc = await loki.handleDocument({ $collection });
      assert.equal(doc.z, 1, 'check with a function');
      assert.equal(doc.x, 1, 'check without a function');
    });

    it('should handle the setter fields', async function () {
      const doc = await loki.handleDocument({ $collection, t: 2, d: 2 });
      assert.equal(doc.d, 1, 'check with a function');
      assert.equal(doc.t, 1, 'check without a function');
    });
  });

  describe('document preparing', function () { 
    let $collection;

    before(async function () {
      $collection = 'test';

      await this.node.addCollection($collection, {
        pk: 'id',
        setters: {
          a: v => v + 1,
        },
        getters: {
          a: v => v - 1
        }
      });
    });

    describe('.prepareDocumentToSet()', function () { 
      it('should create the right document', async function () {
        const document = { $collection: 'test', y: 1, a: 1 };
        const result = await loki.prepareDocumentToSet(Object.assign({}, document));
        document.a += 1;
        assert.equal(JSON.stringify(document), JSON.stringify(result));
      });
    });

    describe('.prepareDocumentToGet()', function () { 
      it('should create the right document', async function () {
        const document = { $collection: 'test', x: 1, y: 1, a: 2 };
        const result = await loki.prepareDocumentToGet(Object.assign({}, document));
        document.a -= 1;
        assert.equal(JSON.stringify(document), JSON.stringify(result));
      });
    });
  });
  
  describe('documents playing', function () { 
    let col;

    before(async function () {
      await this.node.addCollection('test', { pk: 'id' });
      col = loki.col[loki.createCollectionName('test')];
    });

    after(async function () {
      await this.node.removeCollection('test');
    });

    describe('.getDocumentByPk()', function () {
      it('should return the document', async function () {
        await loki.addDocument('test', { id: 1 });
        const doc = await loki.getDocumentByPk('test', 1);
        assert.equal(doc.id, 1);
      });

      it('should return null', async function () {
        assert.isNull(await loki.getDocumentByPk('test', 2));
      });
    });

    describe('.getDocuments()', function () { 
      it('should return an empty array', async function () {
        col.chain().find().remove();
        assert.isEmpty(await loki.getDocuments('test'));
      });

      it('should return all documents', async function () {
        await loki.addDocument('test', { id: 1 });
        await loki.addDocument('test', { id: 2 });
        const docs = await loki.getDocuments('test');
        assert.lengthOf(docs, 2);
      });
    });
    
    describe('.accessDocument()', function () {  
      it('should change $accessedAt property', async function () {
        const doc = col.findOne();
        const date = doc.$accessedAt;
        await tools.wait(5);
        await loki.accessDocument(Object.assign({}, doc));
        assert.isTrue(col.findOne().$accessedAt > date);
      });
    });

    describe('.accessDocuments()', function () {  
      it('should change $accessedAt property', async function () {
        const docs = col.find();
        const dates = docs.map(d => d.$accessedAt);
        await tools.wait(5);
        await loki.accessDocuments('test', docs.map(d => Object.assign({}, d)));
        const newDocs = col.find();

        for(let i = 0; i < newDocs.length; i++) {
          assert.isTrue(newDocs[i].$accessedAt > dates[i]);
        }       
      });
    });

    describe('.updateDocument()', function () {  
      it('should update the document', async function () {
        const doc = col.findOne();
        const date = doc.$updatedAt;
        await tools.wait(5);
        await loki.updateDocument(Object.assign({}, doc, { newField: 1 }));
        const newDoc = col.findOne();
        assert.isTrue(newDoc.$updatedAt > date, 'check the date');
        assert.equal(newDoc.newField, 1, 'check the content');
      });
    });

    describe('.updateDocuments()', function () {  
      it('should update the documents', async function () {
        const docs = col.find();
        const dates = docs.map(d => d.$updatedAt);
        await tools.wait(5);
        await loki.updateDocuments('test', docs.map(d => Object.assign({}, d, { newField: 2 })));
        const newDocs = col.find();

        for(let i = 0; i < newDocs.length; i++) {
          assert.isTrue(newDocs[i].$accessedAt > dates[i], 'check the dates');
          assert.equal(newDocs[i].newField, 2, 'check the content');
        }       
      });
    });

    describe('.deleteDocument()', function () {  
      it('should delete the document', async function () {
        const doc = col.findOne();
        const count = col.chain().count();        
        await loki.deleteDocument(doc);
        assert.equal(col.chain().count(), count - 1);
      });
    });

    describe('.deleteDocuments()', function () {  
      it('should delete the document', async function () {
        const docs = col.find();   
        await loki.deleteDocuments('test', docs);
        assert.equal(col.chain().count(), 0);
      });
    });
  });

  describe('.deinit()', function () { 
    it('should not throw an exception', async function () {
      await loki.deinit();
    });
  }); 

  describe('reinitialization', () => {
    it('should not throw an exception', async function () {
      await loki.init();
    });
  });
  
  describe('.destroy()', function () { 
    it('should not throw an exception', async function () {
      await loki.destroy();
      this.node.db = lastNodeDb;
    });
    
    it('should remove the db file', async function () {
      assert.isFalse(await fse.pathExists(tools.getDbFilePath(this.node)));
    });
  });
});