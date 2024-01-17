export const addDocument = node => {
    return async (req, res, next) => {
        try {
            let document = req.body.document;
            const duplicates = req.body.duplicates || [];
            const info = req.body.info || {};
            await node.documentTest(document);
            await node.collectionTest(info.collection);
            await node.documentAvailabilityTest(info);
            document = await node.db.addDocument(info.collection, document);
            const collection = await node.getCollection(info.collection);
            if (duplicates.length) {
                const doc = node.db.removeDocumentSystemFields(document, [collection.duplicationKey]);
                node.duplicateDocument(duplicates, doc, info).catch(err => node.logger.error(err.stack));
            }
            document = node.db.removeDocumentSystemFields(document);
            document = await collection.prepareDocumentFromNode(document);
            res.send({ document });
        }
        catch (err) {
            next(err);
        }
    };
};
