var should = require('should'),
    GraphBuilder = require('../'),
    path = require('path'),
    root = __dirname + '/files';

describe('concatenation', function() {
    it('should concatenate dependencies', function(done) {
        var realRoot = path.join(root, 'concat');
        var builder = new GraphBuilder(realRoot);
	    var file = path.join(realRoot, 'a.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            var concatenated = builder.concatenate(file);
            var expected =
'var baz = \'bat\';\n\
/** @depends\n\
 * b.js\n\
 */\n\
\n\
var foo = \'bar\';';

            concatenated.should.equal(expected);
            done();
        });
    });

    it('should concatenate nothing for file with no dependencies', function(done) {
        var realRoot = path.join(root, 'concat');
        var builder = new GraphBuilder(realRoot);
	    var file = path.join(realRoot, 'b.js');

        builder.buildGraph(file, function(err, files) {
            should.not.exist(err);
            var concatenated = builder.concatenate(file);
            var expected ='var baz = \'bat\';\n';
            concatenated.should.equal(expected);
            done();
        });
    });

    it('should throw if file does not exist in the cache', function() {
        var builder = new GraphBuilder();

        (function() {
            builder.concatenate('foo');
        }).should.throwError('The file "foo" is not in the file cache (attempting to concatenate "foo")');
    });
});