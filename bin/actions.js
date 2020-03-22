const chalk = require('chalk');
const argv = require('yargs').argv;
const utils = require('./utils');

/**
 * Add the document
 */
module.exports.addDocument = async node => {
  const collection = argv.collection || argv.o;
  const document = JSON.parse(argv.document || argv.d);  
  const result = await node.addDocument(collection, document);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`Document ${JSON.stringify(result, null, 1)} has been added`));
};

/**
 * Get the documents
 */
module.exports.getDocuments = async node => {
  const collection = argv.collection || argv.o;
  const options = utils.prepareDocumentGettingActions(argv);
  const result = await node.getDocuments(collection, options);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`${result.totalCount} document(s) found: ${JSON.stringify(result.documents, null, 1)}`));
};

/**
 * Get the documents count
 */
module.exports.getDocumentsCount = async node => {
  const collection = argv.collection || argv.o;
  const options = utils.prepareDocumentGettingActions(argv);
  const count = await node.getDocumentsCount(collection, options);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`${count} document(s) found`));
};

/**
 * Get the document by the primary key
 */
module.exports.getDocumentByPk = async node => {
  const collection = argv.collection || argv.o;
  const pkValue = argv.pkValue || argv.p;
  const document = await node.getDocumentByPk(collection, pkValue);

  if(!document) {
    throw new Error(`There is no document with "${pkValue}" primary key value`);
  }

  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`Document ${JSON.stringify(document, null, 1)} has been found`));
};

/**
 * Update the documents
 */
module.exports.updateDocuments = async node => {
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
module.exports.deleteDocuments = async node => {
  const collection = argv.collection || argv.o;
  const options = utils.prepareDocumentDeletionActions(argv);
  const result = await node.deleteDocuments(collection, options);
  //eslint-disable-next-line no-console
  console.log(chalk.cyan(`${result.deleted} document(s) have been deleted`));
};