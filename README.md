# [Metastocle](https://github.com/ortexx/metastocle/) [alpha] [![npm version](https://badge.fury.io/js/metastocle.svg)](https://badge.fury.io/js/metastocle)

Metastocle is a decentralized data storage based on
the [spreadable](https://github.com/ortexx/spreadable/) protocol.

```javascript
const Node = require('metastocle').Node;

(async () => {  
  try {
    const node = new Node({
      port: 4000,
      hostname: 'localhost',
      initialNetworkAddress: 'localhost:4000',
    });
    await node.init();

    // Add the test collection
    await node.addCollection('test', { limit: 10000, pk: 'id' });
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

```javascript
const Client = require('metastocle').Client;

(async () => {  
  try {
    const client = new Client({
      address: 'localhost:4000'
    });
    await client.init();

    // Add the document
    const doc = await client.addDocument('test', { text: 'hi' });

    // Update the document
    await client.updateDocuments('test', { text: 'bye' }, {
      filter: { id: doc.id }
    });

    // Add the new one
    await client.addDocument('test', { id: 2, text: 'new' });

    // Get the specific documents
    const results = await client.getDocuments('test', {
      filter: { id: 2 }
    });
    
    // Get the specific document by the primary key
    const doc2 = await client.getDocumentById('test', 2)); 

    // Get the documents with the different actions
    for(let i = 10; i <= 20; i++) {
      await client.addDocument('test', { id: i, x: i });
    }

    const results2 = await client.getDocuments('test', {
      filter: { id: { $gt: 15 } },
      sort: ['x', 'desc'],
      limit: 2,
      offset: 1,
      fields: ['id']
    });
        
    // Delete the documents
    await client.deleteDocuments('test', {
      filter: { id: { $gt: 15 } }
    });
  }
  catch(err) {
    console.error(err.stack);
    process.exit(1);
  }
})();
```

This is only part of the ability to work with collections and documents.

## Browser client
You can also use the client in a browser. Look at the description of the [spreadable](https://github.com/ortexx/spreadable/) library. In window you  have __window.ClientMetastocle__ instead of __window.ClientSpreadable__. The prepared file name is __metastocle.client.js__.

## How it works

Nodes interact via the [spreadable](https://github.com/ortexx/spreadable/) mechanism. The data can be added to the network through any node. You can create collection and put documents into them. There are various __CRUD__ document management methods. For better reliability documents can be duplicated. How exactly you can customize yourself. By default, each one tends to have its copies in amount of __Math.ceil(Math.sqrt(networkSize))__.

## What are the limitations

It is necessary to understand that the library is not a full-fledged database, but a distributed information storage with an interface similar to non-relational databases. It is not optimized for processing large amounts of data on a node. By default, each node uses an in-memory database for storing. The point is to distribute data among a large number of nodes. Therefore, if your project is of this nature, then this solution may work. So you can limit the size of your collections on one node in accordance with the available RAM. But keep in mind, the larger the database, the longer it will be stored in the file. This can lead to delays when working with your application.

## Where to use it

### 1. Wherever your information need to be stored decentralized
For example, you can link this library to the [storacle](https://github.com/ortexx/storacle/) and save links to files as well as additional metadata.

### 2. For own needs
Storing information of your own projects, websites, etc. The network can be made private.

### 3. Serverless solutions
Since the library is written in javascript, you can work with documents in the browser and do not use server code at all. In some cases, it can be very convenient.