import chalk from "chalk";
import yargs from "yargs";
import utils from "./utils.js";
import _actions from "spreadable/bin/actions.js";

const argv = yargs(process.argv).argv;
const actions = Object.assign({}, _actions);

/**
 * Add the document
 */
actions.addDocument = async (node) => {
    const collection = argv.collection || argv.o;
    let document = argv.document || argv.d;

    try {
        document = require(utils.getAbsolutePath(document));
    }
    catch (err) {
        document = JSON.parse(document);
    }

    const result = await node.addDocument(collection, document);
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`Document ${JSON.stringify(result, null, 1)} has been added`));
};

/**
 * Get the documents
 */
actions.getDocuments = async (node) => {
    const collection = argv.collection || argv.o;
    const options = utils.prepareDocumentGettingActions(argv);
    const result = await node.getDocuments(collection, options);
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`${result.totalCount} document(s) found: ${JSON.stringify(result.documents, null, 1)}`));
};

/**
 * Get the documents count
 */
actions.getDocumentsCount = async (node) => {
    const collection = argv.collection || argv.o;
    const options = utils.prepareDocumentGettingActions(argv);
    const count = await node.getDocumentsCount(collection, options);
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`${count} document(s) found`));
};

/**
 * Get the document by the primary key
 */
actions.getDocumentByPk = async (node) => {
    const collection = argv.collection || argv.o;
    const pkValue = argv.pkValue || argv.p;
    const document = await node.getDocumentByPk(collection, pkValue);
    if (!document) {
        throw new Error(`There is no document with "${pkValue}" primary key value`);
    }
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`Document ${JSON.stringify(document, null, 1)} has been found`));
};

/**
 * Update the documents
 */
actions.updateDocuments = async (node) => {
    const collection = argv.collection || argv.o;
    const document = JSON.parse(argv.document || argv.d);
    const options = utils.prepareDocumentUpdateActions(argv);
    const result = await node.updateDocuments(collection, document, options);
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`Document ${JSON.stringify(document, null, 1)} has been updated ${result.updated} times`));
};

/**
 * Delete the documents
 */
actions.deleteDocuments = async (node) => {
    const collection = argv.collection || argv.o;
    const options = utils.prepareDocumentDeletionActions(argv);
    const result = await node.deleteDocuments(collection, options);
    //eslint-disable-next-line no-console
    console.log(chalk.cyan(`${result.deleted} document(s) have been deleted`));
};

export default actions;
