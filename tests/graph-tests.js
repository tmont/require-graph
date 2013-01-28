var should = require('should'),
    GraphBuilder = require('../'),
    path = require('path'),
    root = __dirname + '/files';

describe('graph building and parsing', function() {
    it('should handle chained dependencies', function(done) {
        var realRoot = path.join(root, 'flat');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(3);
            chain[0].should.equal(path.join(realRoot, 'd.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));
            chain[2].should.equal(path.join(realRoot, 'b.js'));
            done();
        });
    });

    it('should handle multiple dependencies', function(done) {
        var realRoot = path.join(root, 'multiple');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(3);
            chain[0].should.equal(path.join(realRoot, 'd.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));
            chain[2].should.equal(path.join(realRoot, 'b.js'));
            done();
        });
    });

    it('should handle nested directories', function(done) {
        var realRoot = path.join(root, 'nested');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(3);
            chain[0].should.equal(path.join(realRoot, 'dir/d.js'));
            chain[1].should.equal(path.join(realRoot, 'dir/c.js'));
            chain[2].should.equal(path.join(realRoot, 'dir/b.js'));
            done();
        });
    });

    it('should handle comment blocks with no @@end', function(done) {
        var realRoot = path.join(root, 'no-end');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(1);
            chain[0].should.equal(path.join(realRoot, 'b.js'));
            done();
        });
    });

    it('should handle whitespace around "require"', function(done) {
        var realRoot = path.join(root, 'whitespace');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(2);
            chain[0].should.equal(path.join(realRoot, 'b.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));
            done();
        });
    });

    it('should handle line breaks between "require" statements', function(done) {
        var realRoot = path.join(root, 'linebreaks');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(2);
            chain[0].should.equal(path.join(realRoot, 'b.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));
            done();
        });
    });

    it('should handle empty comment block', function(done) {
        var realRoot = path.join(root, 'empty');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(0);
            done();
        });
    });

    it('should clear file cache', function(done) {
        var realRoot = path.join(root, 'shouldParse');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.fileCache.should.eql({});

        builder.buildGraph(function(err) {
            should.not.exist(err);
            builder.fileCache.should.not.eql({});
            builder.clearCache();
            builder.fileCache.should.eql({});
            done();
        });
    });

    describe('with options', function() {
        it('should transform text before caching it', function(done) {
            var realRoot = path.join(root, 'transform');
            var builder = new GraphBuilder(realRoot, function() {
                return realRoot;
            });

            var options = {
                transform: function(text, fileName) {
                    should.exist(fileName);
                    return text + 'hello world';
                }
            };

            builder.buildGraph(options, function(err) {
                should.not.exist(err);
                var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
                chain.should.have.length(1);
                chain[0].should.equal(path.join(realRoot, 'b.js'));

                builder.fileCache.should.have.property(path.join(realRoot, 'a.js'));
                var a = builder.fileCache[path.join(realRoot, 'a.js')];
                a.should.have.property('data');
                a.data.should.match(/hello world$/);

                builder.fileCache.should.have.property(path.join(realRoot, 'b.js'));
                var b = builder.fileCache[path.join(realRoot, 'b.js')];
                b.should.have.property('data');
                b.data.should.match(/hello world$/);

                done();
            });
        });

        it('should not parse certain files', function(done) {
            var realRoot = path.join(root, 'shouldParse');
            var builder = new GraphBuilder(realRoot, function() {
                return realRoot;
            });

            var options = {
                shouldParse: function(fileName) {
                    return !/b\.js$/.test(fileName);
                }
            };

            builder.buildGraph(options, function(err) {
                should.not.exist(err);
                var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
                chain.should.have.length(1);
                chain[0].should.equal(path.join(realRoot, 'b.js'));

                builder.fileCache.should.have.property(path.join(realRoot, 'a.js'));
                builder.fileCache.should.not.have.property(path.join(realRoot, 'b.js'));

                done();
            });
        });
    });

    it('README example with concurrency', function(done) {
        var realRoot = path.join(root, 'readme');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph({ maxConcurrent: 10 }, function(err) {
            should.not.exist(err);
            var chain = builder.graph.getChain(path.join(realRoot, 'a.js'));
            chain.should.have.length(3);
            chain[0].should.equal(path.join(realRoot, 'd.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));
            chain[2].should.equal(path.join(realRoot, 'b.js'));

            chain = builder.graph.getChain(path.join(realRoot, 'b.js'));
            chain.should.have.length(2);
            chain[0].should.equal(path.join(realRoot, 'd.js'));
            chain[1].should.equal(path.join(realRoot, 'c.js'));

            chain = builder.graph.getChain(path.join(realRoot, 'c.js'));
            chain.should.have.length(1);
            chain[0].should.equal(path.join(realRoot, 'd.js'));

            chain = builder.graph.getChain(path.join(realRoot, 'd.js'));
            chain.should.have.length(0);

            var concatenated = builder.concatenate(path.join(realRoot, 'a.js'));
            var expected = require('fs').readFileSync(path.join(root, 'readme-expected.js'), 'utf8');
            concatenated.should.equal(expected);
            done();
        });
    });

    it('should throw if directory not given to constructor', function(done) {
        (function() {
            new GraphBuilder();
        }).should.throwError('GraphBuilder requires at least one directory');
        done();
    });
});