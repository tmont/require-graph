var should = require('should'),
    GraphBuilder = require('../'),
    path = require('path'),
    root = __dirname + '/files';

describe('concatenation', function() {
    it('should concatenate dependencies', function(done) {
        var realRoot = path.join(root, 'concat');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var concatenated = builder.concatenate(path.join(realRoot, 'a.js'));
            var expected =
'var baz = \'bat\';\n\
/**\n\
 //= require b.js\n\
 @@end */\n\
\n\
var foo = \'bar\';';

            concatenated.should.equal(expected);
            done();
        });
    });

    it('should concatenate nothing for file with no dependencies', function(done) {
        var realRoot = path.join(root, 'concat');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var concatenated = builder.concatenate(path.join(realRoot, 'b.js'));
            var expected ='var baz = \'bat\';\n';
            concatenated.should.equal(expected);
            done();
        });
    });

    it('should transform file contents', function(done) {
        var realRoot = path.join(root, 'concat');
        var builder = new GraphBuilder(realRoot, function() {
            return realRoot;
        });

        builder.buildGraph(function(err) {
            should.not.exist(err);
            var options = {
                transform: function(contents, file) {
                    file.should.match(/b\.js$/);
                    return contents.replace('baz', 'giggity');
                }
            }
            var concatenated = builder.concatenate(path.join(realRoot, 'b.js'), options);
            var expected = 'var giggity = \'bat\';\n';
            concatenated.should.equal(expected);
            done();
        });
    });

    it('should throw if file does not exist in the cache', function(done) {
        var builder = new GraphBuilder('foo', function() {
            return null;
        });

        (function() {
            builder.concatenate('foo');
        }).should.throwError('The file "foo" is not in the file cache');
        done();
    });
});