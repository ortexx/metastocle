import { assert } from "chai";
import node from "../src/node.js";
import client from "../src/client.js";
import tools from "./tools.js";

const Node = node();
const Client = client();

export default function () {
    describe('group communication', () => {
        let nodes;
        let client;
        let duplicates;
        let collection;
        let documentAdditionNodeTimeout;
        before(async () => {
            collection = 'test',
                documentAdditionNodeTimeout = 200;
            nodes = [];
            for (let i = 0; i < 4; i++) {
                const node = new Node(await tools.createNodeOptions({
                    request: { documentAdditionNodeTimeout },
                    collections: { test: { pk: 'id' } }
                }));
                await node.init();
                nodes.push(node);
                node.initialNetworkAddress = nodes[0].address;
            }
            client = new Client(await tools.createClientOptions({ address: nodes[0].address }));
            await client.init();
            await tools.nodesSync(nodes, nodes.length * 3);
            duplicates = await nodes[0].getDocumentDuplicatesCount({ collection });
        });
        after(async () => {
            for (let i = 0; i < nodes.length; i++) {
                await nodes[i].deinit();
            }
        });
        it('should get the right network size', async () => {
            for (let i = 0; i < nodes.length; i++) {
                assert.equal(await nodes[i].getNetworkSize(), nodes.length);
            }
        });
        it('should add the document', async () => {
            await client.addDocument(collection, { id: 1 });
            await tools.wait(documentAdditionNodeTimeout);
            let count = 0;
            for (let i = 0; i < nodes.length; i++) {
                (await nodes[i].db.getDocumentByPk(collection, 1)) && count++;
            }
            assert.equal(count, duplicates);
        });
        it('should not add the existent documents again', async () => {
            try {
                await client.addDocument(collection, { id: 1, x: 1 });
                throw new Error('Fail');
            }
            catch (err) {
                assert.isOk(err.message.match('already exists'), 'check the error');
            }
            await tools.wait(documentAdditionNodeTimeout);
            let count = 0;
            for (let i = 0; i < nodes.length; i++) {
                const doc = await nodes[i].db.getDocumentByPk(collection, 1);
                if (doc) {
                    assert.isUndefined(doc.x, 'check the cotent');
                    count++;
                }
            }
            assert.equal(count, duplicates, 'check the count');
        });
        it('should add the remaining duplicates', async () => {
            for (let i = 0; i < nodes.length; i++) {
                const doc = await nodes[i].db.getDocumentByPk(collection, 1);
                if (doc) {
                    await nodes[i].db.deleteDocument(doc);
                    break;
                }
            }
            try {
                await client.addDocument(collection, { id: 1, x: 1 });
                throw new Error('Fail');
            }
            catch (err) {
                assert.isOk(err.message.match('already exists'), 'check the error');
            }
            await tools.wait(documentAdditionNodeTimeout);
            let count = 0;
            for (let i = 0; i < nodes.length; i++) {
                const doc = await nodes[i].db.getDocumentByPk(collection, 1);
                if (doc) {
                    assert.isUndefined(doc.x, 'check the content');
                    count++;
                }
            }
            assert.equal(count, duplicates, 'check the count');
        });
        it('should update the documents', async () => {
            let count = 0;
            await client.updateDocuments(collection, { x: 1 }, { filter: { id: 1 } });
            for (let i = 0; i < nodes.length; i++) {
                const doc = await nodes[i].db.getDocumentByPk(collection, 1);
                if (doc) {
                    assert.equal(doc.x, 1, 'check the content');
                    count++;
                }
            }
            assert.equal(count, duplicates, 'check the count');
        });
        it('should get the documents without duplicates', async () => {
            const result = await client.getDocuments(collection, { filter: { id: 1 } });
            assert.equal(result.totalCount, 1);
        });
        it('should get the documents without duplicates', async () => {
            const result = await client.getDocuments(collection, { filter: { id: 1 }, removeDuplicates: false });
            assert.equal(result.totalCount, 2);
        });
        it('should delete the document', async () => {
            await client.deleteDocuments(collection, { filter: { id: 1 } });
            let count = 0;
            for (let i = 0; i < nodes.length; i++) {
                (await nodes[i].db.getDocumentByPk(collection, 1)) && count++;
            }
            assert.equal(count, 0);
        });
        it('should add documents in parallel', async () => {
            const length = 5;
            const p = [];
            let count = 0;
            for (let i = 0; i < length; i++) {
                p.push(client.addDocument(collection, { id: i + 1 }));
            }
            await Promise.all(p);
            await tools.wait(documentAdditionNodeTimeout);
            for (let i = 0; i < nodes.length; i++) {
                count += (await nodes[i].db.getDocuments(collection)).length;
            }
            assert.isOk(count == length * duplicates);
        });
    });
}