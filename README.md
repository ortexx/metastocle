# [Metastocle](https://github.com/ortexx/metastocle/) [alpha] [![npm version](https://badge.fury.io/js/metastocle.svg)](https://badge.fury.io/js/metastocle) [![Build status](https://github.com/ortexx/metastocle/workflows/build/badge.svg)](https://github.com/ortexx/metastocle/actions)

Metastocle is a decentralized data storage based on [the spreadable protocol](https://github.com/ortexx/spreadable/).

```javascript
const Node = require('metastocle').Node;

(async () => {  
  try {
    const node = new Node({
      port: 4000,
      hostname: 'localhost'
    });
    await node.addCollection('test', { limit: 10000, pk: 'id' });
    await node.init();
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
      sort: [['x', 'desc']],
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
You can also use the client in a browser. Look at the description of [the spreadable library](https://github.com/ortexx/spreadable/#how-to-use-the-client-in-a-browser). In window you have __window.ClientMetastocle__ instead of __window.ClientSpreadable__. The prepared file name is __metastocle.client.js__.

## How to use it via the command line
Look at the description of [the spreadable library](https://github.com/ortexx/spreadable/#how-to-use-it-via-the-command-line). You only need to change everywhere **spreadable** word to **metastocle**.

## How it works

Nodes interact via [the spreadable mechanism](https://github.com/ortexx/spreadable/). The data can be added to the network through any node. You can create collection and put documents into them. There are various __CRUD__ document management methods. For better reliability documents can be duplicated. How exactly you can customize yourself. By default, each one tends to have its copies in amount of __Math.ceil(Math.sqrt(networkSize))__.

## What are the limitations

It is necessary to understand that the library is not a full-fledged database, but a distributed information storage with an interface similar to non-relational databases. It is not optimized for processing large amounts of data on a node. By default, each node uses an in-memory database for storing. The point is to distribute data among a large number of nodes. Therefore, if your project is of this nature, then this solution may work. So you can limit the size of your collections on one node in accordance with the available RAM. But keep in mind, the larger the database, the longer it will be stored in the file. This can lead to delays when working with your application.

## What are the requirements
Look at [the spreadable requirements](https://github.com/ortexx/spreadable/#what-are-the-requirements).

## Where to use it

### 1. Wherever your information need to be stored decentralized
For example, you can link this library to [the storacle](https://github.com/ortexx/storacle/) and save links to files as well as additional metadata.

### 2. For own needs
Storing information of your own projects, websites, etc. The network can be made private.

### 3. Serverless solutions
Since the library is written in javascript, you can work with documents in the browser and do not use server code at all. In some cases, it can be very convenient.

## Node configuration

When you create an instance of the node you can pass options below. Only specific options of this library are described here, without considering the options of the parent classes.

* {number|string} __[request.documentAdditionNodeTimeout="2s"]__ - document addition timeout

## Collection configuration

In production, collections should only be created before the node is initialized! Any collection is an instance of the __Collection__ class. When you add a new collection you can pass the options:

* {integer|string} __[pk='']__ - primary key field. If collection has a primary key you can't add two documents with the same value in the pk field.

* {integer} __[limit=0]__ - documents limit for the collection. If it is zero then there is no limits. 

* {integer|string} __[maxSize=0]__ - memory limit for the collection. If it is zero then there is no limits. 

* {boolean} __[queue=false]__ - documents queue option. This option works in combination with meta.limit or meta.maxSize. If the queue is enabled, then when you add a new document that exceeds the limit, another one will be deleted to free up space. First of all, it is documents that were used less often.

* {string|string[]|array[]} __[limitationOrder="$accessedAt"]__ - sorting procedure for documents to be deleted if the limits are exceeded.

* {string} __[duplicationKey="$duplicate"]__ - document duplication key.

* {object} __[schema]__ - document fields structure.

* {object} __[defaults]__ - default values for document fields. Each property value can be a function.

* {object} __[setters]__ - setters for document fields. It is called on any document change. Each property value can be a function.

* {object} __[getters]__ - getters for document fields. It is called on any document receiving. Each property value can be a function.
 
* {integer|string} __[preferredDuplicates="auto"]__ - preferred number of documents copies on the network. If indicated in percent, the calculation will be based on the network size. If the option is "auto" it will be calculated as `Math.ceil(Math.sqrt(networkSize))`.

## Fields schema

If you need to have a strict field structure, then it can be defined as:

``` 
{ 
  type: 'object',
  props: {
    count: 'number',
    title: 'string',
    description: { type: 'string' },
    priority: {
      type: 'number',
      value: val => val >= -1 && val <= 1
    },
    goods: {
      type: 'array',
      items: {
        type: 'object',
        props: {
          title: 'string',
          isAble: 'boolean'
        }
      }
    }
  }
} 
```

This kind of a schema is handled by [utils.validateSchema](https://github.com/ortexx/spreadable/blob/master/src/utils.js) function, where you can find all the rules.

## Defaults, setters and getters

Defaults work only if the values are __undefined__. Setters are used anyway.

``` 
{ 
  defaults: {
    date: Date.now
    priority: 0
    'nested.prop': (key, doc) => Date.now() - doc.date
  },
  setters: {
    priority: (val, key, doc, prevDoc) => prevDoc? prevDoc.priority + 1: val
  },
  getters: {
    priority: (val, key, doc) => val - 1
  }
}
```

## Client configuration

When you create an instance of the client you can pass options below. Only specific options of this library are described here, without considering the options of the parent classes.

* {number|string} __[request.documentAdditionTimeout="10s"]__ - document storing timeout.

* {number|string} __[request.documentGettingTimeout="10s"]__ - document getting timeout.

* {number|string} __[request.documentUpdateTimeout="10s"]__ - document update timeout.

* {number|string} __[request.documentDeletionTimeout="10s"]__ - document deletion timeout.

## Client interface

async __Client.prototype.addDocument()__ - add file to the network.
  * {string} __collection__ - collection name
  * {object} __document__ - document
  * {object} __[options]__ - addition options
  * {object} __[options.ignoreExistenceError=false]__ - throw or not an error if the document already exists   
  * {number} __[options.timeout]__ - addition timeout

async __Client.prototype.getDocuments()__ - get all matched documents.
  * {string} __collection__ - collection name
  * {object} __[options]__ - getting options, including all actions.
  * {number} __[options.timeout]__ - getting timeout

async __Client.prototype.getDocumentsCount()__ - get matched documents count.
  * {string} __collection__ - collection name
  * {object} __[options]__ - getting options, including all actions
  * {number} __[options.timeout]__ - getting timeout

async __Client.prototype.getDocumentByPk()__ - get a document by the primary key.
  * {string} __collection__ - collection name
  * {*} __value__ - pk field value
  * {object} __[options]__ - getting options
  * {number} __[options.timeout]__ - getting timeout

async __Client.prototype.deleteDocuments()__ - update all matched documents.
  * {string} __collection__ - collection name
  * {object} __[options]__ - deletion options
  * {number} __[options.timeout]__ - deletion timeout

async __Client.prototype.updateDocuments()__ - get all matched documents.
  * {string} __collection__ - collection name
  * {object} __document__ - new updates
  * {object} __[options]__ - update options, including all actions
  * {number} __[options.timeout]__ - update timeout

## Actions

When you get, update or delete documents you often need to specify various filters, order, etc. 
To do this you can pass the following options to the client methods:

* {object} __[filter=null]__ - filtering documents by rules (for getting, update, deletion).

* {string[]} __[fields=null]__ - necessary document fields (for getting).

* {string[]|array[]} __[sort=null]__ - sorting rules (for getting).

* {integer} __[offset=0]__ - starting position in the found array (for getting)

* {integer} __[limit=0]__ - number of required documents (for getting). Zero means it is unlimited.

* {boolean} __[removeDuplicates=true]__ - return only unique documents if there is a primary key in the collection (for getting).

* {boolean} __[replace=false]__ - replace all document by the new one or merge if it's false. (for update).

## Filtering

As we found out earlier you can filter documents. Filters can be nested in each other.

``` 
{ 
  a: { $lt: 1 },
  $and: [
    { x: 1 },
    { y: { $gt: 2 } },
    { 
      $or: [
        { z: 1 },
        { "b.c": 2 }
      ] 
    }
  ]
} 
```

List of all filters:

* __$eq__ - сompare equality.  
    ``` 
    { x: 1 } or { x: { $eq: 1 } }
    ```

* __$ne__ - сompare inequality.  
    ``` 
    { x: { $ne: 1 } }
    ```

* __$eqs__ - сompare equality strictly (===).  
    ``` 
    { x: { $eqs: 1 } }
    ```

* __$nes__ - сompare inequality strictly (===).  
    ``` 
    { x: { $nes: 1 } }
    ```

* __$gt__ - check the value is greater than the filter.  
    ``` 
    { x: { $gt: 1 } }
    ```

* __$gte__ - check the value is greater or equal than the filter.  
    ``` 
    { x: { $gte: 1 } }
    ```

* __$lt__ - check the value is less than the filter.  
    ``` 
    { x: { $lt: 1 } }
    ```

* __$lte__ - check the value is less or equal than the filter.  
    ``` 
    { x: { $lte: 1 } }
    ```

* __$in__ - check the value is in the array.  
    ``` 
    { x: { $in: [1, 2] } }
    ```

* __$nin__ - check the value is not in the array.  
    ``` 
    { x: { $nin: [1, 2] } }
    ```

* __$sw__ - check the value starts with the filter.  
    ``` 
    { x: { $sw: 'ab' } }
    ```

* __$isw__ - check the value starts with the filter case-insensitive way.  
    ``` 
    { x: { $sw: 'aB' } }
    ```

* __$ew__ - check the value ends with the filter.  
    ``` 
    { x: { $ew: 'yz' } }
    ```

* __$iew__ - check the value ends with the filter case-insensitive way.  
    ``` 
    { x: { $ew: 'Yz' } }
    ```

* __$lk__ - check the value matchs the filter.  
    ``` 
    { x: { $lk: 'lmno' } }
    ```

* __$ilk__ - check the value matchs the filter case-insensitive way.  
    ``` 
    { x: { $lk: 'lMNo' } }
    ```

* __$rx__ - check the value matchs the regex filter.  
    ``` 
    { x: { $rx: /ab$/i } }
    ```
* __$lgt__ - check the array value length is greater than the filter.  
    ``` 
    { x: { $lgt: 1 } }
    ```

* __$lgte__ - check the array value length is greater or equal than the filter.  
    ``` 
    { x: { $lgte: 1 } }
    ```

* __$lgt__ - check the array value length is less than the filter.  
    ``` 
    { x: { $llt: 1 } }
    ```

* __$lgte__ - check the array value length is less or equal than the filter.  
    ``` 
    { x: { $llte: 1 } }
    ```

* __$and__ - rule of following all conditions.  
    ``` 
    { 
      $and: [
        { x: 1 },
        { y: { $gt: 2 } }
      ]
    } 
    ```

* __$or__ - rule of following at least one of the conditions.   
    ``` 
    { 
      $or: [
        { x: 1 },
        { y: { $gt: 2 } }
      ]
    } 
    ```

## Sorting

Receiving data can be sorted. The option might be in the following form:

``` 
{ sort: 'x' }
```

``` 
{ sort: ['x'] }
```

``` 
{ sort: ['x', 'y'] }
```

``` 
{ sort: [['x', 'desc']] }
```

``` 
{ sort: [['x', 'asc'], ['y.z', 'desc']] }
```

## Contribution

If you face a bug or have an idea how to improve the library, create an issue on github. In order to fix something or add new code yourself fork the library, make changes and create a pull request to the master branch. Don't forget about tests in this case. Also you can join [the project on github](https://github.com/ortexx/metastocle/projects/1).