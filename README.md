# require-graph

[![Build Status](https://travis-ci.org/tmont/require-graph.png?branch=master)](https://travis-ci.org/tmont/require-graph)

A tiny library for building/serving dependencies for client-side assets
(JavaScript, HTML templates, etc.). Licensed under [MIT](./LICENSE).

## Installation
`npm install require-graph`

## Examples
Suppose you have some JavaScript files that depend on each other:

- `a.js` depends on `b.js` and `c.js`
- `b.js` depends on `c.js` and `d.js`
- `c.js` depends on `d.js`

`a.js`:
```javascript
/** @depends
 * b.js
 * c.js
 */

messages.push('I am file A!');

```

`b.js`:
```javascript
/** @depends
 * c.js
 * d.js
 */

messages.push('I am file B!');

```

`c.js`:
```javascript
/** @depends
 * d.js
 */

messages.push('I am file C!');

```

`d.js`:
```javascript
var messages = [ 'I am file D!' ];

```

After defining all the dependencies, you can concatenate them at runtime
(or build time, or whenever-you-want-time):

```javascript
var GraphBuilder = require('require-graph'),
  path = require('path'),
  builder = new GraphBuilder(),
  root = '/path/to/files';

builder.buildGraph(path.join(root, 'a.js'), function(err, dependencies) {
  if (err) {
    console.log('oh god why', err);
    return;
  }

  console.log(builder.getFiles(path.join(root, 'a.js'))); // [ 'd.js', 'c.js', 'b.js' ]
  console.log(builder.getFiles(path.join(root, 'b.js'))); // [ 'd.js', 'c.js' ]
  console.log(builder.getFiles(path.join(root, 'c.js'))); // [ 'd.js' ]
  console.log(builder.getFiles(path.join(root, 'd.js'))); // []

  console.log(builder.concatenate(path.join(root, 'a.js')));

  // var messages = [ 'I am file D!' ];
  // /** @depends
  //  * d.js
  //  */
  //
  // messages.push('I am file C!');
  // /** @depends
  //  * c.js
  //  * d.js
  //  */
  //
  // messages.push('I am file B!');
  // /**
  //  * b.js
  //  * c.js
  //  */
  //
  // messages.push('I am file A!');
});
```

### Directories as dependencies
You can also specify a relative directory as a dependency, in which
case all files in that directory (recursively) will be set as
dependencies. For example:

```
/** @depends
 * this/file.js
 * that/directory
 */
```

## `buildGraph()` Options
Remove require-graph specific headers (the `/** @depends...*/` blocks):

```javascript
var options = {
  removeHeaders: true
};
build.buildGraph(options, callback);
```

Do something to the file's contents:

```javascript
var options = {
  transform: function(contents, filename) {
    var stat = fs.statSync(filename);
    return '// last modified on ' + stat.mtime + '\n' + contents;
  }
};
build.buildGraph(options, callback);
```

Control which files are parsed:

```javascript
var options = {
  shouldParse: function(filename) {
    // only parse javascript files
    return /\.js$/.test(filename);
  }
};
build.buildGraph(options, callback);
```


## Development
```bash
git clone git@github.com:tmont/require-graph.git
cd require-graph
npm install
npm test
```