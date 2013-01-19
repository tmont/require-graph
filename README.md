# require-graph

[![Build Status](https://travis-ci.org/clipboard/require-graph.png?branch=master)](https://travis-ci.org/clipboard/require-graph)

A tiny library for building/serving dependencies for client-side assets
(JavaScript, HTML templates, etc.).

At [Clipboard](https://clipboard.com/) it is used for concatenating client-side
JavaScript files at runtime.

## Examples
Suppose you have some JavaScript files that depend on each other:

- `a.js` depends on `b.js` and `c.js`
- `b.js` depends on `c.js` and `d.js`
- `c.js` depends on `d.js`

`a.js`:
```javascript
/**
 //= require b.js
 //= require c.js
 @@end */

messages.push('I am file A!');

```

`b.js`:
```javascript
/**
 //= require c.js
 //= require d.js
 @@end */

messages.push('I am file B!');

```

`c.js`:
```javascript
/**
 //= require d.js
 @@end */

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
    root = '/path/to/js/files';
var builder = new GraphBuilder(root, function() { return root; });
builder.buildGraph(function(err) {
    if (err) {
        console.log('oh god why', err);
        return;
    }

    console.log(builder.graph.getChain(path.join(root, 'a.js'))); // [ 'd.js', 'c.js', 'b.js' ]
    console.log(builder.graph.getChain(path.join(root, 'b.js'))); // [ 'd.js', 'c.js' ]
    console.log(builder.graph.getChain(path.join(root, 'c.js'))); // [ 'd.js' ]
    console.log(builder.graph.getChain(path.join(root, 'd.js'))); // []

    console.log(builder.concatenate(path.join(root, 'a.js')));

    // var messages = [ 'I am file D!' ];
    // /**
    //  //= require d.js
    // @@end */
    //
    // messages.push('I am file C!');
    // /**
    //  //= require c.js
    //  //= require d.js
    //  @@end */
    //
    // messages.push('I am file B!');
    // /**
    // //= require b.js
    // //= require c.js
    //  @@end */
    //
    // messages.push('I am file A!');
});
```

Pretty cool, but those comments are pretty annoying and totally unprofessional
and embarrassing to have in the concatenated file. Whatever can I do?

```javascript
var options = {
    transform: function(contents) {
        var token = '@@end */';
        var end = contents.indexOf(token);
        return end === -1 ? contents : contents.substring(end + token.length);
    }
};

console.log(builder.concatenate(path.join(root, 'a.js'), options));
```

## Development
```bash
git clone git@github.com:clipboard/require-graph.git
cd require-graph
npm install
npm test
