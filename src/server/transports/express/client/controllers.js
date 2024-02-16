export const addDocument = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      let document = req.body.document;
      const options = { ignoreExistenceError: !!req.body.ignoreExistenceError };
      document = await node.addDocument(collection, document, node.prepareClientMessageOptions(req.body, options));
      res.send({ document });
    }
    catch (err) {
      next(err);
    }
  };
};

export const updateDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const document = req.body.document;
      const actions = req.body.actions || {};
      const result = await node.updateDocuments(collection, document, node.prepareClientMessageOptions(req.body, actions));
      res.send(result);
    }
    catch (err) {
      next(err);
    }
  };
};

export const deleteDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};
      const result = await node.deleteDocuments(collection, node.prepareClientMessageOptions(req.body, actions));
      res.send(result);
    }
    catch (err) {
      next(err);
    }
  };
};

export const getDocuments = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};
      const result = await node.getDocuments(collection, node.prepareClientMessageOptions(req.body, actions));
      res.send(result);
    }
    catch (err) {
      next(err);
    }
  };
};

export const getDocumentsCount = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const actions = req.body.actions || {};
      const count = await node.getDocumentsCount(collection, node.prepareClientMessageOptions(req.body, actions));
      res.send({ count });
    }
    catch (err) {
      next(err);
    }
  };
};

export const getDocumentByPk = node => {
  return async (req, res, next) => {
    try {
      const collection = req.body.collection;
      const pkValue = req.body.pkValue;
      const document = await node.getDocumentByPk(collection, pkValue, node.prepareClientMessageOptions(req.body));
      res.send({ document });
    }
    catch (err) {
      next(err);
    }
  };
};
