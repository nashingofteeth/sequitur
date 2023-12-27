const fs = require("mz/fs"),
      args = require('minimist')(process.argv.slice(2)),
      framerate = args['r'] ? parseFloat(args['r']) : 24,
      size = args['s'] ? parseInt(args['s']) : 240,
      initialize = args['i'];

exports.framerate = framerate;
exports.args = args;

// make or remove data folder
const dir = 'data';
if (initialize && fs.existsSync(dir))
    fs.rmSync(dir, { recursive: true, force: true });
if (!fs.existsSync(dir))
    fs.mkdirSync(dir);

function requireFiles(args) {
    var valid = true;

    for ( a in args ) {
        if (Array.isArray(args[a])) {
            for (f in args[a])
                if ( !fs.existsSync(args[a][f]) )
                    valid = false;
        }
        
        else if ( !args[a] || !fs.existsSync(args[a]) )
            valid = false;
    }

    if ( !valid ) {
        console.log('files not provided or do not exist!');
        process.exit();
    }
}

// data functions
exports.frameCount = function (v = args['v'], s = size) {
    requireFiles([v]);
    return require("./components/extract-frames").frames(v, s);
}
exports.diffs = function (v = args['v'], s = size, sorted) { 
    requireFiles([v]);
    const frameCount = require("./components/extract-frames").frames(v, s);
    return require('./components/compare-frames').diffs(v, frameCount, sorted);
}
exports.wave = function (a = args['a'], r = framerate) {
    requireFiles([a]);
    return require('./components/sample-audio').wave(a, r);
}

exports.export = function (sequence, s = size, r = framerate, v = args['v'], a = args['a']) {
    requireFiles([v]);
    require('./components/export-sequence').concat(sequence, s, r, v, a);
}