# Enmap-Mongo

Enmap-Mongo is a provider for the [Enmap](https://www.npmjs.com/package/enmap) module. 

## Installation

To install Enmap-Mongo simply run `npm i enmap-mongo`.

## Usage

```js
// Load Enmap
const Enmap = require('enmap');
 
// Load EnmapMongo
const EnmapMongo = require('enmap-mongo');
 
// Initialize the provider
const Provider = new EnmapMongo({ name: 'test' });
 
// Initialize the Enmap with the provider instance.
const myColl = new Enmap({ provider: provider });
```

Shorthand declaration: 

```js
const Enmap = require('enmap');
const EnmapMongo = require('enmap-mongo');
const myColl = new Enmap({ provider: new EnmapMongo({ name: 'test' }); });
```

## Options

```js
// Example with all options.
const level = new EnmapMongo({ 
  name: 'test',
  dbName: 'enmap',
  user: 'username',
  pass: 'password',
  host: 'localhost',
  port: 27017
});
```

```js
// Example with full URL.
const level = new EnmapMongo({ 
  name: 'test',
  dbName: 'enmap',
  url: 'mongodb://username:password@localhost:27017/enmap'
});
```

### name

The `name` option is mandatory and defines the name of the collection where the data is stored. 

### dbName

The `dbName` is optional and defines the database where data is stored. If multiple enmap instances connect to the same database, the same database is used with different table collections. The default database is `enmap`.

### host

The `host` is optional and defines which host this module attempts to connect to. The default host is `localhost`.

### port

The `port` is optional and defines which port is used to connect to the Rethink DB. The default port is `27017`.

### user, pass

Optional, used for authentication. Needs both to work, or neither. 

### url

Optional. If used, the `host`, `port`, `user` and `pass` options are *ignored* , and `url` is used instead. Note that the `/dbname` at the end of your url *must* correspond to the `dbName` value (or `enmap`).