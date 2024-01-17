import _ from "lodash";
export const getDocumentAdditionInfo = node => {
    return async (req, res, next) => {
        try {
            const info = req.body.info || {};
            await node.collectionTest(info.collection);
            const testInfo = Object.assign({}, info);
            testInfo.count = await node.db.getCollectionSize(info.collection);
            res.send({
                count: testInfo.count,
                existenceInfo: await node.getDocumentExistenceInfo(testInfo),
                isFull: await node.checkDocumentFullness(testInfo),
                isAvailable: await node.checkDocumentAvailability(testInfo)
            });
        }
        catch (err) {
            next(err);
        }
    };
};
export const getDocuments = node => {
    return async (req, res, next) => {
        try {
            const isCounting = req.body.isCounting;
            const pkValue = req.body.pkValue;
            let documents = [];
            if (pkValue) {
                const document = await node.db.getDocumentByPk(req.collection.name, pkValue);
                document && documents.push(document);
            }
            else {
                documents = await node.db.getDocuments(req.collection.name);
            }
            const result = await node.handleDocumentsGettingForSlave(req.collection, documents, req.actions);
            if (isCounting) {
                documents = result.documents.map(d => _.pick(d, req.collection.duplicationKey));
            }
            else {
                documents = await node.db.accessDocuments(req.collection.name, result.accessDocuments);
                documents = result.documents.map(d => node.db.removeDocumentSystemFields(d, [req.collection.duplicationKey]));
            }
            for (let i = 0; i < documents.length; i++) {
                documents[i] = await req.collection.prepareDocumentFromSlave(documents[i]);
                if (!documents[i]) {
                    documents.splice(i, 1);
                    i--;
                }
            }
            res.send({ documents });
        }
        catch (err) {
            next(err);
        }
    };
};
export const updateDocuments = node => {
    return async (req, res, next) => {
        try {
            let documents = await node.db.getDocuments(req.collection.name);
            const result = await node.handleDocumentsUpdate(req.collection, documents, req.document, req.actions);
            documents = await node.db.updateDocuments(req.collection.name, result.documents);
            res.send({ updated: result.documents.length });
        }
        catch (err) {
            next(err);
        }
    };
};
export const deleteDocuments = node => {
    return async (req, res, next) => {
        try {
            await node.collectionTest(req.collection.name);
            const documents = await node.db.getDocuments(req.collection.name);
            const result = await node.handleDocumentsDeletion(req.collection, documents, req.actions);
            await node.db.deleteDocuments(req.collection.name, result.documents);
            res.send({ deleted: result.documents.length });
        }
        catch (err) {
            next(err);
        }
    };
};
