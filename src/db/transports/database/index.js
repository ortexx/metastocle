import database from "spreadable-ms/src/db/transports/database/index.js";
const Database = database();
export default (Parent) => {
    /**
     * Database transport interface
     */
    return class DatabaseMetastocle extends (Parent || Database) {
        /**
         * Create the collection name
         *
         * @param {string} name
         * @returns {string}
         */
        createCollectionName() {
            throw new Error('Method "createCollectionName" is required for database transport');
        }
        /**
         * Create the document primary key
         *
         * @param {object} document
         * @returns {string|number}
         */
        createDocumentPrimaryKey() {
            throw new Error('Method "createDocumentPrimaryKey" is required for database transport');
        }
        /**
         * Create the document duplication key
         *
         * @param {object} document
         * @returns {string|number}
         */
        createDocumentDuplicationKey() {
            throw new Error('Method "createDocumentDuplicationKey" is required for database transport');
        }
        /**
         * Remove the document system filds
         *
         * @param {object} document
         * @param {string[]} [exclude]
         * @returns {object}
         */
        removeDocumentSystemFields() {
            throw new Error('Method "removeDocumentSystemFields" is required for database transport');
        }
        /**
         * Add the collection
         *
         * @async
         * @param {string} name
         * @param {object} [options]
         * @returns {object}
         */
        async addCollection() {
            throw new Error('Method "addCollection" is required for database transport');
        }
        /**
         * Remove the collection
         *
         * @async
         * @param {string} name
         */
        async removeCollection() {
            throw new Error('Method "removeCollection" is required for database transport');
        }
        /**
         * Empty the collection
         *
         * @async
         * @param {string} name
         */
        async emptyCollection() {
            throw new Error('Method "emptyCollection" is required for database transport');
        }
        /**
         * Get the collection
         *
         * @async
         * @param {string} name
         * @returns {object|null}
         */
        async getCollection() {
            throw new Error('Method "getCollection" is required for database transport');
        }
        /**
         * Normalize the collections
         *
         * @async
         */
        async normalizeCollections() {
            throw new Error('Method "normalizeCollections" is required for database transport');
        }
        /**
         * Remove the collection excess documents
         *
         * @async
         * @param {string} name
         */
        async removeCollectionExcessDocuments() {
            throw new Error('Method "removeCollectionExcessDocuments" is required for database transport');
        }
        /**
         * Remove the collection excess documents by the limit
         *
         * @async
         * @param {string} name
         * @param {array} order
         */
        async removeCollectionExcessDocumentsByLimit() {
            throw new Error('Method "removeCollectionExcessDocumentsByLimit" is required for database transport');
        }
        /**
         * Remove the collection excess documents by the size
         *
         * @async
         * @param {string} name
         * @param {array} order
         */
        async removeCollectionExcessDocumentsBySize() {
            throw new Error('Method "removeCollectionExcessDocumentsBySize" is required for database transport');
        }
        /**
         * Get the collection size
         *
         * @async
         * @param {string} name
         * @returns {number}
         */
        async getCollectionSize() {
            throw new Error('Method "getCollectionSize" is required for database transport');
        }
        /**
         * Prepare the document for setting
         *
         * @async
         * @param {object} document
         * @param {object} [prevDocument=null]
         * @returns {object}
         */
        async prepareDocumentToSet() {
            throw new Error('Method "prepareDocumentToSet" is required for database transport');
        }
        /**
         * Prepare the document for getting
         *
         * @async
         * @param {object} document
         * @returns {object}
         */
        async repareDocumentToGet() {
            throw new Error('Method "prepareDocumentToGet" is required for database transport');
        }
        /**
         * Handle the document
         *
         * @async
         * @param {object} document
         * @param {object} [options]
         * @param {object} [options.pks]
         * @returns {object}
         */
        async handleDocument() {
            throw new Error('Method "handleDocument" is required for database transport');
        }
        /**
         * Get the document by the primary key
         *
         * @async
         * @param {object} document
         * @param {*} value
         * @returns {object}
         */
        async getDocumentByPk() {
            throw new Error('Method "getDocumentByPk" is required for database transport');
        }
        /**
         * Get the documents
         *
         * @async
         * @param {string} name
         * @returns {object[]}
         */
        async getDocuments() {
            throw new Error('Method "getDocuments" is required for database transport');
        }
        /**
         * Add the document
         *
         * @async
         * @param {string} name
         * @param {object} document
         * @returns {object}
         */
        async addDocument() {
            throw new Error('Method "addDocument" is required for database transport');
        }
        /**
         * Access the document
         *
         * @async
         * @param {object} document
         * @returns {object}
         */
        async accessDocument() {
            throw new Error('Method "accessDocument" is required for database transport');
        }
        /**
         * Access the documents
         *
         * @async
         * @param {string} name
         * @param {object[]} documents
         * @returns {object[]}
         */
        async accessDocuments() {
            throw new Error('Method "accessDocuments" is required for database transport');
        }
        /**
         * Update the document
         *
         * @async
         * @param {object} document
         * @param {object} [options]
         * @param {object} [options.pks]
         * @returns {object}
         */
        async updateDocument() {
            throw new Error('Method "updateDocument" is required for database transport');
        }
        /**
         * Update the documents
         *
         * @async
         * @param {string} name
         * @param {object[]} documents
         * @param {object} [options]
         * @param {object} [options.pks]
         * @returns {object[]}
         */
        async updateDocuments() {
            throw new Error('Method "updateDocuments" is required for database transport');
        }
        /**
         * Delete the document
         *
         * @async
         * @param {object} document
         */
        async deleteDocument() {
            throw new Error('Method "deleteDocument" is required for database transport');
        }
        /**
         * Delete the documents
         *
         * @async
         * @param {string} name
         * @param {object[]} documents
         */
        async deleteDocuments() {
            throw new Error('Method "deleteDocuments" is required for database transport');
        }
    };
};
