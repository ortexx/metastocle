const assert = require('chai').assert;
const utils = require('../src/utils');

describe('utils', () => {
  describe('DocumentsHandler()', () => {
    let documents;
    let handler;

    before(() => {
      documents = [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 10, y: 2 }
      ]
    });

    describe('instance creation', () => {
      it('should create an instance', () => { 
        handler = new utils.DocumentsHandler(documents);
        assert.equal(JSON.stringify(documents), JSON.stringify(handler.__documents));
      });
    });

    describe('.getDocuments()', () => {
      it('should get the documents', () => { 
        assert.equal(JSON.stringify(documents), JSON.stringify(handler.getDocuments()));
      });
    });

    describe('.filterDocuments()', () => {
      it('should filter the documents', () => { 
        const obj = [
          { x: 1, y: 1 },
          { x: 2, y: 1 }
        ];
        handler.filterDocuments({ x: { $lt: 10 }, y: 1 });      
        assert.equal(JSON.stringify(handler.getDocuments()), JSON.stringify(obj));
      });
    });

    describe('.sortDocuments()', () => {
      it('should sort the documents', () => { 
        const obj = [
          { x: 2, y: 1 },
          { x: 1, y: 1 }
        ];
        handler.sortDocuments([['x', 'desc']]);      
        assert.equal(JSON.stringify(handler.getDocuments()), JSON.stringify(obj));
      });
    });

    describe('.fieldDocuments()', () => {
      it('should remove unnecassary fields', () => { 
        const obj = [ { x: 2 }, { x: 1 } ];
        handler.fieldDocuments(['x']);      
        assert.equal(JSON.stringify(handler.getDocuments()), JSON.stringify(obj));
      });
    });

    describe('.limitDocuments()', () => {
      it('should limit the documents', () => { 
        const obj = [ { x: 1 } ];
        handler.limitDocuments(1, 1);
        assert.equal(JSON.stringify(handler.getDocuments()), JSON.stringify(obj));
      });
    });

    describe('.$eq()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$eq(1, 1));
        assert.isTrue(handler.$eq(1, '1'));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$eq(1, 2));
      });
    });

    describe('.$ne()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$ne(1, 2));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$ne(1, 1));
        assert.isFalse(handler.$ne(1, '1'));        
      });
    });

    describe('.$eqs()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$eqs(1, 1));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$eqs(1, 2));
        assert.isFalse(handler.$eqs(1, '1'));        
      });
    });

    describe('.$nes()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$nes(1, 2));
        assert.isTrue(handler.$nes(1, '1'));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$nes(1, 1));       
      });
    });

    describe('.$gt()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$gt(2, '1'));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$gt(1, 2));         
        assert.isFalse(handler.$gt(1, 1));      
      });
    });

    describe('.$gte()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$gte(2, '1'));         
        assert.isTrue(handler.$gte(1, 1)); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$gte(1, 2));    
      });
    });

    describe('.$lt()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$lt(1, 2));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$lt('2', 1));         
        assert.isFalse(handler.$lt(1, 1));      
      });
    });

    describe('.$lte()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$lte(1, 2));         
        assert.isTrue(handler.$lte(1, 1)); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$lte('2', 1));    
      });
    });

    describe('.$in()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$in(1, [1, 2])); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$in(3, [1, 2]));
      });
    });

    describe('.$nin()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$nin(3, [1, 2])); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$nin(1, [1, 2]));
      });
    });

    describe('.$sw()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$sw('text', 'te')); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$sw('text', 'xt'));
      });
    });

    describe('.$ew()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$ew('text', 'xt')); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$ew('text', 'te'));
      });
    });

    describe('.$lk()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$lk('text', 'ex')); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$lk('text', 'go'));
      });
    });

    describe('.$rx()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$rx('text', { source: 'text', flags: 'i' }));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$rx('texT', { source: 'text' }));    
      });
    });

    describe('.$lgt()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$lgt([1, 2], '1'));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$lgt([1], 2));
        assert.isFalse(handler.$lgt([1], 1));     
      });
    });

    describe('.$lgte()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$lgte([1], 1));        
        assert.isTrue(handler.$lgte([1, 2], '1')); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$lgte([1], 2));    
      });
    });

    describe('.$llt()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$llt([1], 2));
      });

      it('should return false', () => { 
        assert.isFalse(handler.$llt([1], 1));
        assert.isFalse(handler.$llt([1, 2], '1'));     
      });
    });

    describe('.$llte()', () => {
      it('should return true', () => { 
        assert.isTrue(handler.$llte([1], 2));        
        assert.isTrue(handler.$llte([1], 1)); 
      });

      it('should return false', () => { 
        assert.isFalse(handler.$llte([1, 2], '1'));    
      });
    });
  });

  describe('.prepareDocumentFilter()', () => {
    it('should transform correctly', () => {
      const now = new Date();

      const from = {
        a: 1,
        $or: [
          { c: /test/i }
        ],
        $and: [
          { d: 1, 
            $or: [
              { e: new Date() }
            ] 
          }
        ]
      };

      const to = {
        a: 1,
        $or: [
          { c: { source: 'test', flags: 'i' } }
        ],
        $and: [
          { d: 1, 
            $or: [
              { e: now.getTime() }
            ] 
          }
        ]
      };

      assert.equal(JSON.stringify(utils.prepareDocumentFilter(from)), JSON.stringify(to));
    });    
  });

  describe('.prepareDocumentFilter()', () => {
    it('should transform correctly', () => {
      const now = new Date();
      const time = now.getTime();

      const from = {
        a: 1,
        b: {
          e: now
        }
      };

      const to = {
        a: 1,
        b: {
          e: time
        }
      };

      assert.equal(JSON.stringify(utils.prepareDocumentFields(from)), JSON.stringify(to));
    });    
  });

  describe('.isDocument()', () => {
    it('should validate the right document', () => {
      assert.isTrue(utils.isDocument({ x: 1, y: { z: [ { a: 1 } ] } }));
    }); 

    it('should not validate the wrong documents', () => {
      assert.isFalse(utils.isDocument(), 'check undefined');
      assert.isFalse(utils.isDocument({}), 'check an empty object');
      assert.isFalse(utils.isDocument([1]), 'check an array');
      assert.isFalse(utils.isDocument(null), 'check null');
      assert.isFalse(utils.isDocument('1'), 'check a string');
      assert.isFalse(utils.isDocument(1), 'check a number');
      assert.isFalse(utils.isDocument(true), 'check a boolean');
    }); 
  });

  describe('.isActions()', () => {
    it('should validate the right document', () => {
      assert.isTrue(utils.isActions({ filter: {} }), 'check the object with keys');
      assert.isTrue(utils.isActions({}), 'check the object without keys');
    }); 

    it('should not validate the wrong documents', () => {
      assert.isFalse(utils.isActions(), 'check undefined');
      assert.isFalse(utils.isActions([1]), 'check an array');
      assert.isFalse(utils.isActions(null), 'check null');
      assert.isFalse(utils.isActions('1'), 'check a string');
      assert.isFalse(utils.isActions(1), 'check a number');
      assert.isFalse(utils.isActions(true), 'check a boolean');
    }); 
  });

  describe('.prepareDocumentGettingActions()', () => {
    it('should create the defaults', () => {
      const keys = ['sort', 'fields', 'offset', 'limit', 'removeDuplicates', 'filter'];
      assert.hasAllKeys(utils.prepareDocumentGettingActions({}), keys);
    });  

    it('should create the right actions', () => {
      const obj = {
        sort: ['x'],
        fields: ['x'],
        offset: 1,
        limit: 1,
        removeDuplicates: true,
        filter: { x: 1 }
      };
      const res = utils.prepareDocumentGettingActions(obj);
      assert.equal(JSON.stringify(res), JSON.stringify(obj));
    });  
  });

  describe('.prepareDocumentUpdategActions()', () => {
    it('should create the defaults', () => {
      const keys = ['replace', 'filter'];
      assert.hasAllKeys(utils.prepareDocumentUpdateActions({}), keys);
    });  

    it('should create the right actions', () => {
      const obj = {
        replace: true,
        filter: { x: 1 }
      };
      const res = utils.prepareDocumentUpdateActions(obj);
      assert.equal(JSON.stringify(res), JSON.stringify(obj));
    });  
  });

  describe('.prepareDocumentDeletionActions()', () => {
    it('should create the defaults', () => {
      const keys = ['filter'];
      assert.hasAllKeys(utils.prepareDocumentDeletionActions({}), keys);
    });  

    it('should create the right actions', () => {
      const obj = {
        filter: { x: 1 }
      };
      const res = utils.prepareDocumentDeletionActions(obj);
      assert.equal(JSON.stringify(res), JSON.stringify(obj));
    });  
  });
});