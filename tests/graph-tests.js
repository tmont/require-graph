var should = require('should'),
    GraphBuilder = require('../'),
    path = require('path'),
    root = __dirname + '/files';

describe('graph building and parsing', function() {
    it('should handle chained dependencies', function(done) {
        var realRoot = path.join(root, 'flat');
        var builder = new GraphBuilder();
		var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(3);
            files[0].should.equal(path.join(realRoot, 'd.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));
            files[2].should.equal(path.join(realRoot, 'b.js'));
            done();
        });
    });

    it('should handle multiple dependencies', function(done) {
        var realRoot = path.join(root, 'multiple');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(3);
            files[0].should.equal(path.join(realRoot, 'd.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));
            files[2].should.equal(path.join(realRoot, 'b.js'));
            done();
        });
    });

    it('should handle nested directories', function(done) {
        var realRoot = path.join(root, 'nested');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(3);
            files[0].should.equal(path.join(realRoot, 'dir/d.js'));
            files[1].should.equal(path.join(realRoot, 'dir/c.js'));
            files[2].should.equal(path.join(realRoot, 'dir/b.js'));
            done();
        });
    });

    it('should handle comment blocks with no closing comment', function(done) {
        var realRoot = path.join(root, 'no-end');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(0);
            done();
        });
    });

    it('should handle goofy whitespace', function(done) {
        var realRoot = path.join(root, 'whitespace');
        var builder = new GraphBuilder(realRoot);
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(2);
            files[0].should.equal(path.join(realRoot, 'b.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));
            done();
        });
    });

    it('should handle line breaks between dependencies', function(done) {
        var realRoot = path.join(root, 'linebreaks');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(2);
            files[0].should.equal(path.join(realRoot, 'b.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));
            done();
        });
    });

    it('should handle empty comment block', function(done) {
        var realRoot = path.join(root, 'empty');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            files.should.have.length(0);
            done();
        });
    });

    it('should clear file cache', function(done) {
        var realRoot = path.join(root, 'shouldParse');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.fileCache.should.eql({});

        builder.buildGraph(file, function(err) {
            should.not.exist(err);
            builder.fileCache.should.not.eql({});
            builder.clearCache();
            builder.fileCache.should.eql({});
            done();
        });
    });

	it('should handle directory path as dependency', function(done) {
		var realRoot = path.join(root, 'dir');
		var builder = new GraphBuilder();
		var file = path.join(realRoot, 'file.js');

		builder.buildGraph(file, function(err, files) {
			should.not.exist(err);
			files.should.have.length(4);
			files[0].should.equal(path.join(realRoot, 'dir/1.js'));
			files[1].should.equal(path.join(realRoot, 'dir/2.js'));
			files[2].should.equal(path.join(realRoot, 'dir/another/3.js'));
			files[3].should.equal(path.join(realRoot, 'dir/another/onemore/4.js'));
			done();
		});
	});

    describe('with options', function() {
        it('should transform text before caching it', function(done) {
            var realRoot = path.join(root, 'transform');
            var builder = new GraphBuilder(realRoot);
	        var file = path.join(realRoot, 'a.js');

            var options = {
                transform: function(text, fileName) {
                    should.exist(fileName);
                    return text + 'hello world';
                }
            };

            builder.buildGraph(file, options, function(err, files) {
                should.not.exist(err);
                files.should.have.length(1);
                files[0].should.equal(path.join(realRoot, 'b.js'));

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

	    it('should remove headers', function(done) {
		    var realRoot = path.join(root, 'removeHeaders');
		    var builder = new GraphBuilder(realRoot);
		    var file = path.join(realRoot, 'a.js');

		    var options = {
			    removeHeaders: true
		    };

		    builder.buildGraph(file, options, function(err, files) {
			    should.not.exist(err);
			    files.should.have.length(1);
			    files[0].should.equal(path.join(realRoot, 'b.js'));

			    builder.fileCache.should.have.property(path.join(realRoot, 'a.js'));
			    var a = builder.fileCache[path.join(realRoot, 'a.js')];
			    a.should.have.property('data', '\nvar foo;');

			    done();
		    });
	    });

        it('should not parse certain files', function(done) {
            var realRoot = path.join(root, 'shouldParse');
            var builder = new GraphBuilder(realRoot);
	        var file = path.join(realRoot, 'a.js');

            var options = {
                shouldParse: function(fileName) {
                    return !/b\.js$/.test(fileName);
                }
            };

            builder.buildGraph(file, options, function(err, files) {
                should.not.exist(err);
                files.should.have.length(1);
                files[0].should.equal(path.join(realRoot, 'b.js'));

                builder.fileCache.should.have.property(path.join(realRoot, 'a.js'));
                builder.fileCache.should.not.have.property(path.join(realRoot, 'b.js'));

                done();
            });
        });
    });

    it('README example with concurrency', function(done) {
        var realRoot = path.join(root, 'readme');
        var builder = new GraphBuilder();
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, { maxConcurrent: 10 }, function(err, files) {
            should.not.exist(err);
            files.should.have.length(3);
            files[0].should.equal(path.join(realRoot, 'd.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));
            files[2].should.equal(path.join(realRoot, 'b.js'));

            files = builder.getFiles(path.join(realRoot, 'b.js'));
            files.should.have.length(2);
            files[0].should.equal(path.join(realRoot, 'd.js'));
            files[1].should.equal(path.join(realRoot, 'c.js'));

            files = builder.getFiles(path.join(realRoot, 'c.js'));
            files.should.have.length(1);
            files[0].should.equal(path.join(realRoot, 'd.js'));

            files = builder.getFiles(path.join(realRoot, 'd.js'));
            files.should.have.length(0);

            var concatenated = builder.concatenate(path.join(realRoot, 'a.js'));
            var expected = require('fs').readFileSync(path.join(root, 'readme-expected.js'), 'utf8');
            concatenated.should.equal(expected);
            done();
        });
    });
});