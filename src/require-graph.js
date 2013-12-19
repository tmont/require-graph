var path = require('path'),
    DepGraph = require('dep-graph'),
    fs = require('fs'),
    async = require('async'),
    wrench = require('wrench');

function GraphBuilder(directories) {
    if (!directories) {
        throw new Error('GraphBuilder requires at least one directory');
    }

    this.directories = Array.isArray(directories) ? directories : [ directories ];
    this.graph = new DepGraph();
    this.fileCache = {};
}

GraphBuilder.prototype.clearCache = function() {
    this.fileCache = {};
};

/**
 * Builds the dependency graph
 *
 * @param {Object} [options] Options for the graph builder
 * @param {Function} [options.transform] Transforms the contents of the file
 * after it's been read
 * @param {Function} [options.shouldParse] Filter for determining which files to parse
 * @param {Boolean} [options.removeHeaders] Remove require-graph comment headers from all files
 * @param {Function} [callback]
 */
GraphBuilder.prototype.buildGraph = function(options, callback) {
    if (typeof(options) === 'function') {
        callback = options;
        options = null;
    }

    if (typeof(callback) !== 'function') {
        callback = function() {};
    }

    options = options || {};

    var self = this;
    function processFile(absolutePath, next) {
        if (self.fileCache[absolutePath]) {
            next();
            return;
        }

        if (options.shouldParse && !options.shouldParse(absolutePath)) {
            next();
            return;
        }

        fs.readFile(absolutePath, 'utf8', function(err, contents) {
            if (err) {
                next(err);
                return;
            }

	        if (options.transform) {
		        contents = options.transform(contents, absolutePath);
	        }

	        self.fileCache[absolutePath] = { data: contents };

	        if (/^\s*\/\*\* @depends/.test(contents)) {
		        var end = contents.indexOf('*/');
		        if (end !== -1) {
			        var commentBlock = contents.substring(0, end);
			        if (options.removeHeaders) {
				        self.fileCache[absolutePath].data = contents.substring(end + 2);
			        }

			        var lines = commentBlock.replace(/\r\n/g, '\n').split('\n'),
				        dependencies = [];
			        for (var i = 1, match; i < lines.length; i++) {
				        if (match = /^[*\s]*([^*\s].*)$/.exec(lines[i])) {
					        var filename = match[1].trim();
					        if (filename) {
					            dependencies.push(filename);
					        }
				        }
			        }

			        async.eachLimit(dependencies, options.maxConcurrent || 10, function(relativePath, next) {
				        var dependencyPath = path.join(
					        path.dirname(absolutePath),
					        relativePath
				        );

				        self.graph.add(absolutePath, dependencyPath);
				        processFile(dependencyPath, next);
			        }, next);
		        } else {
			        next();
		        }
	        } else {
		        next();
	        }
        });
    }

    function processDirectory(directory, next) {
        try {
            var files = wrench.readdirSyncRecursive(directory);
            async.forEachLimit(files, options.maxConcurrent || 10, function(file, next) {
                var absolutePath = path.join(directory, file);
                fs.stat(absolutePath, function(err, stat) {
                    if (err) {
                        next(err);
                        return;
                    }

                    if (stat.isDirectory()) {
                        next();
                    } else {
                        processFile(absolutePath, next);
                    }
                });
            }, next);
        } catch (e) {
            next(e);
        }
    }

    async.forEachLimit(this.directories, options.maxConcurrent || 10, processDirectory, callback);
};

GraphBuilder.prototype.concatenate = function(absolutePath) {
    var files = this.graph.getChain(absolutePath),
        concatenated = '';

    // getChain doesn't include the head of the chain, so we add it manually
    // at the end of the array
    files.push(absolutePath);

    for (var i = 0, file; i < files.length; i++) {
        file = files[i];
        if (!this.fileCache[file]) {
            throw new Error(
	            'The file "' + file + '" is not in the file cache (attempting to ' +
	            'concatenate "' + absolutePath + '")'
            );
        }

        concatenated += this.fileCache[file].data;
    }

    return concatenated;
};

GraphBuilder.prototype.getFiles = function(absolutePath) {
	return this.graph.getChain(absolutePath);
};

module.exports = GraphBuilder;
