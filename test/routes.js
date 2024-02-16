import { assert } from "chai";
import fetch from "node-fetch";
import node from "../src/node.js";
import client from "../src/client.js";
import utils from "../src/utils.js";
import schema from "../src/schema.js";
import tools from "./tools.js";

const Node = node();
const Client = client();

export default function () {
  describe('routes', () => {
    let node;
    let client;
    before(async function () {
      node = new Node(await tools.createNodeOptions({
        network: {
          auth: { username: 'username', password: 'password' }
        },
        collections: {
          test: { pk: 'id' }
        }
      }));
      await node.init();
      client = new Client(await tools.createClientOptions({
        address: node.address,
        auth: { username: 'username', password: 'password' }
      }));
      await client.init();
    });
    after(async function () {
      await node.deinit();
      await client.deinit();
    });
    describe('/status', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/status`);
        assert.equal(await res.status, 401);
      });
      it('should return the status', async function () {
        const options = client.createDefaultRequestOptions({ method: 'get' });
        const res = await fetch(`http://${node.address}/status`, options);
        const json = await res.json();
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getStatusResponse(), json);
        });
      });
      it('should return the pretty status', async function () {
        const options = client.createDefaultRequestOptions({ method: 'get' });
        const res = await fetch(`http://${node.address}/status?pretty`, options);
        const json = await res.json();
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getStatusPrettyResponse(), json);
        });
      });
    });
    describe('/client/add-document', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/add-document`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return an error', async function () {
        const options = client.createDefaultRequestOptions();
        const res = await fetch(`http://${node.address}/client/add-document`, options);
        assert.equal(res.status, 422);
      });
      it('should add the document', async function () {
        const body = {
          collection: 'test',
          document: { id: 1 }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/add-document`, options);
        const json = await res.json();
        assert.equal(json.document.id, 1, 'check the response');
        assert.equal(await node.getDocumentsCount('test', { filter: { id: 1 } }), 1, 'check the existence');
      });
    });
    describe('/client/update-documents', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/update-documents`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return an error', async function () {
        const options = client.createDefaultRequestOptions();
        const res = await fetch(`http://${node.address}/client/update-documents`, options);
        assert.equal(res.status, 422);
      });
      it('should update the document', async function () {
        const body = {
          collection: 'test',
          document: { x: 1 }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/update-documents`, options);
        const json = await res.json();
        assert.equal(json.updated, 1, 'check the response');
        assert.equal(await node.getDocumentsCount('test', { filter: { x: 1 } }), 1, 'check the update');
      });
      it('should not update the filtered document', async function () {
        const body = {
          collection: 'test',
          document: { x: 1 },
          actions: {
            filter: { id: 2 }
          }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/update-documents`, options);
        const json = await res.json();
        assert.equal(json.updated, 0);
      });
    });
    describe('/client/get-documents', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/get-documents`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should get the documents', async function () {
        const body = { collection: 'test' };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-documents`, options);
        const json = await res.json();
        assert.lengthOf(json.documents, 1);
      });
      it('should get an empty documents array because of the filter', async function () {
        const body = {
          collection: 'test',
          actions: {
            filter: { id: 2 }
          }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-documents`, options);
        const json = await res.json();
        assert.equal(json.documents, 0);
      });
    });
    describe('/client/get-documents-count', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/get-documents-count`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should get the documents count', async function () {
        const body = { collection: 'test' };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-documents-count`, options);
        const json = await res.json();
        assert.equal(json.count, 1);
      });
      it('should get zero because of the filter', async function () {
        const body = {
          collection: 'test',
          actions: {
            filter: { id: 2 }
          }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-documents-count`, options);
        const json = await res.json();
        assert.equal(json.count, 0);
      });
    });
    describe('/client/get-document-by-pk', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/get-document-by-pk`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should get the document', async function () {
        const body = {
          collection: 'test',
          pkValue: 1
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-document-by-pk`, options);
        const json = await res.json();
        assert.equal(json.document.id, 1);
      });
      it('should get null because of the filter', async function () {
        const body = {
          collection: 'test',
          pkValue: 2
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/get-document-by-pk`, options);
        const json = await res.json();
        assert.isNull(json.document);
      });
    });
    describe('/client/delete-document/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/client/delete-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should not delete the filtered document', async function () {
        const body = {
          collection: 'test',
          actions: {
            filter: { id: 2 }
          }
        };
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/delete-documents`, options);
        const json = await res.json();
        assert.equal(json.deleted, 0);
      });
      it('should delete all documents', async function () {
        const body = { collection: 'test' };
        const count = await node.getDocumentsCount('test');
        const options = client.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/client/delete-documents`, options);
        const json = await res.json();
        assert.equal(json.deleted, count, 'check the response');
        assert.equal(await node.getDocumentsCount('test'), 0, 'check the existence');
      });
    });
    describe('/api/master/get-document-addition-info/', function () {
      before(async function () {
        await node.addDocument('test', { id: 1 });
      });
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/master/get-document-addition-info/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/master/get-document-addition-info/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 2,
          info: {
            collection: 'test'
          }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/master/get-document-addition-info/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentAdditionInfoMasterResponse(), json);
        });
      });
    });
    describe('/api/master/get-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/master/get-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/master/get-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 2,
          collection: 'test'
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/master/get-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentsMasterResponse(), json);
        });
      });
    });
    describe('/api/master/update-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/master/update-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/master/update-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 2,
          collection: 'test',
          document: { x: 1 }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/master/update-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.updateDocumentsMasterResponse(), json);
        });
      });
    });
    describe('/api/master/delete-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/master/delete-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/master/delete-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 2,
          collection: 'test'
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/master/delete-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.deleteDocumentsMasterResponse(), json);
        });
      });
    });
    describe('/api/butler/get-document-addition-info/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/butler/get-document-addition-info/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/butler/get-document-addition-info/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 1,
          info: {
            collection: 'test'
          }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/butler/get-document-addition-info/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentAdditionInfoButlerResponse(), json);
        });
      });
    });
    describe('/api/butler/get-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/butler/get-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/butler/get-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 1,
          collection: 'test'
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/butler/get-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentsButlerResponse(), json);
        });
      });
    });
    describe('/api/butler/update-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/butler/update-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/butler/update-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 1,
          collection: 'test',
          document: { x: 2 }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/butler/update-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.updateDocumentsButlerResponse(), json);
        });
      });
    });
    describe('/api/butler/delete-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/butler/delete-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/butler/delete-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 1,
          collection: 'test'
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/butler/delete-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.deleteDocumentsButlerResponse(), json);
        });
      });
    });
    describe('/api/slave/get-document-addition-info/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/slave/get-document-addition-info/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/slave/get-document-addition-info/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 0,
          info: {
            collection: 'test'
          }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/slave/get-document-addition-info/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentAdditionInfoSlaveResponse(), json);
        });
      });
    });
    describe('/api/slave/get-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/slave/get-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/slave/get-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = { collection: 'test' };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/slave/get-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentsSlaveResponse(), json);
        });
      });
    });
    describe('/api/slave/update-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/slave/update-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/slave/update-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 0,
          collection: 'test',
          document: { x: 1 }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/slave/update-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.updateDocumentsSlaveResponse(), json);
        });
      });
    });
    describe('/api/slave/delete-documents/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/slave/delete-documents/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return a data error', async function () {
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions());
        const res = await fetch(`http://${node.address}/api/slave/delete-documents/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = { collection: 'test' };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/slave/delete-documents/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.deleteDocumentsSlaveResponse(), json);
        });
      });
    });
    describe('/api/node/add-document/', function () {
      it('should return an auth error', async function () {
        const res = await fetch(`http://${node.address}/api/node/add-document/`, { method: 'post' });
        assert.equal(await res.status, 401);
      });
      it('should return an error', async function () {
        const options = node.createDefaultRequestOptions();
        const res = await fetch(`http://${node.address}/api/node/add-document/`, options);
        assert.equal(res.status, 422);
      });
      it('should return the right schema', async function () {
        const body = {
          level: 0,
          document: { id: 1 },
          info: {
            collection: 'test'
          }
        };
        const options = node.createDefaultRequestOptions(tools.createJsonRequestOptions({ body }));
        const res = await fetch(`http://${node.address}/api/node/add-document/`, options);
        const json = tools.createServerResponse(node.address, await res.json());
        assert.doesNotThrow(() => {
          utils.validateSchema(schema.getDocumentAdditionResponse(), json);
        });
      });
    });
  });
}