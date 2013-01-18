var should = require('should'),
	GraphBuilder = require('../'),
	path = require('path'),
	root = __dirname + '/files';

describe('graph building', function() {
	it('should handle chained dependencies', function(done) {
		var flatRoot = path.join(root, 'flat');
		var builder = new GraphBuilder(flatRoot, function() {
			return flatRoot;
		});

		builder.buildGraph(function(err) {
			should.not.exist(err);
			var chain = builder.graph.getChain(path.join(flatRoot, 'a.js'));
			chain.should.have.length(3);
			chain[0].should.equal(path.join(flatRoot, 'd.js'));
			chain[1].should.equal(path.join(flatRoot, 'c.js'));
			chain[2].should.equal(path.join(flatRoot, 'b.js'));
			done();
		});
	});

	it('should handle multiple dependencies', function(done) {
		var multiRoot = path.join(root, 'multiple');
		var builder = new GraphBuilder(multiRoot, function() {
			return multiRoot;
		});

		builder.buildGraph(function(err) {
			should.not.exist(err);
			var chain = builder.graph.getChain(path.join(multiRoot, 'a.js'));
			chain.should.have.length(3);
			chain[0].should.equal(path.join(multiRoot, 'd.js'));
			chain[1].should.equal(path.join(multiRoot, 'c.js'));
			chain[2].should.equal(path.join(multiRoot, 'b.js'));
			done();
		});
	});
});