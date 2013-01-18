var path = require('path'),
    DepGraph = require('dep-graph'),
    fs = require('fs'),
    async = require('async'),
    wrench = require('wrench');

function GraphBuilder(directories, rootLocator) {
    this.directories = Array.isArray(directories) ? directories : [ directories ];
    this.rootLocator = rootLocator;
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
 * @param {Function} [options.transformFileContents] Transforms the contents of the file
 * after it's been read
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

    var graphBuilder = this;
    function processFile(absolutePath, fileCallback) {
        if (graphBuilder.fileCache[absolutePath]) {
            fileCallback();
            return;
        }

        if (options.shouldParse && !options.shouldParse(absolutePath)) {
            fileCallback();
            return;
        }

        fs.readFile(absolutePath, 'utf8', function(err, data) {
            if (err) {
                fileCallback(err);
                return;
            }

            data = options.transform ? options.transform(data) : data;
            graphBuilder.fileCache[absolutePath] = { data: data };
            var commentBlock = graphBuilder.fileCache[absolutePath].data;
            var end = commentBlock.indexOf('@@ end */');
            if (end !== -1) {
                commentBlock = commentBlock.substring(0, end);
            }

            var regex = /^[\*\s]*\/\/=\s*require\s+(.+)$/i,
                lines = commentBlock.replace(/\r\n/g, '\n').split('\n'),
                dependencies = [];
            for (var i = 0, match; i < lines.length; i++) {
                if (match = regex.exec(lines[i])) {
                    dependencies.push(match[1].trim());
                }
            }

            async.forEachLimit(dependencies, 1, function(relativePath, callback) {
                var dependencyPath = path.join(
                    graphBuilder.rootLocator(path.extname(relativePath)),
                    relativePath
                );

                graphBuilder.graph.add(absolutePath, dependencyPath);
                processFile(dependencyPath, callback);
            }, fileCallback);
        });
    }

    function processDirectory(directory, dirCallback) {
        try {
            var files = wrench.readdirSyncRecursive(directory);
            async.forEachLimit(files, 1, function(file, fileCallback) {
                processFile(path.join(directory, file), fileCallback);
            }, dirCallback);
        } catch (e) {
            dirCallback(e);
        }
    }

    async.forEachLimit(this.directories, 1, processDirectory, callback);
};

GraphBuilder.prototype.concatenate = function(absolutePath, options) {
    options = options || {};

    var graphBuilder = this;
    var files = graphBuilder.graph.getChain(absolutePath),
        concatenatedFile = '';

    // getChain doesn't include the head of the chain, so we add it manually
    // at the end of the array
    files.push(absolutePath);

    for (var i = 0, file; i < files.length; i++) {
        file = files[i];
        if (!graphBuilder.fileCache[file]) {
            invokeCallback(new Error('The file "' + file + '" is not in the file cache'));
            return;
        }

        var fileContents = graphBuilder.fileCache[file].data,
            end = '*/';

        if (options.removeComments) {
            // Remove any orphaned comments from the head of the file
            while (fileContents.indexOf('/*') === 0) {
                fileContents = fileContents.substr(fileContents.indexOf(end) + end.length);
            }

            graphBuilder.fileCache[file].data = fileContents;
        }

        concatenatedFile += fileContents;
    }

    return concatenatedFile;
};

module.exports = GraphBuilder;
