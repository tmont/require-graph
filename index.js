var path = require('path'),
	DepGraph = require('dep-graph'),
	fs = require('fs'),
	async = require('async'),
	wrench = require('wrench');

function GraphBuilder() {
	this.graph = new DepGraph();
	this.fileCache = {};
}

GraphBuilder.prototype.clearCache = function() {
	this.fileCache = {};
};

/**
 * Builds the dependency graph for a file
 *
 * @param {String} file File to build dependency graph for
 * @param {Object} [options] Options for the graph builder
 * @param {Function} [options.transform] Transforms the contents of the file
 * after it's been read
 * @param {Function} [options.shouldParse] Filter for determining which files to parse
 * @param {Boolean} [options.removeHeaders] Remove require-graph comment headers from all files
 * @param {Function} [callback]
 */
GraphBuilder.prototype.buildGraph = function(file, options, callback) {
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

			if (!/^\s*\/\*\* @depends/.test(contents)) {
				next();
				return;
			}

			var end = contents.indexOf('*/');
			if (end === -1) {
				next();
				return;
			}

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

			async.eachSeries(dependencies, function(relativePath, next) {
				var dependencyPath = path.join(
					path.dirname(absolutePath),
					relativePath
				);

				fs.stat(dependencyPath, function(err, stat) {
					if (err) {
						next(err);
						return;
					}

					if (stat.isDirectory()) {
						processDirectory(dependencyPath, next, absolutePath);
					} else {
						self.graph.add(absolutePath, dependencyPath);
						processFile(dependencyPath, next);
					}
				});
			}, next);
		});
	}

	function processDirectory(directory, next, declaringFile) {
		try {
			var files = wrench.readdirSyncRecursive(directory);
			async.eachLimit(files, options.maxConcurrent || 10, function(file, next) {
				var absolutePath = path.join(directory, file);
				fs.stat(absolutePath, function(err, stat) {
					if (err) {
						next(err);
						return;
					}

					if (stat.isDirectory()) {
						next();
					} else {
						if (declaringFile) {
							self.graph.add(declaringFile, absolutePath);
						}
						processFile(absolutePath, next);
					}
				});
			}, next);
		} catch (e) {
			next(e);
		}
	}

	processFile(file, function(err) {
		callback(err, self.graph.getChain(file));
	});
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
