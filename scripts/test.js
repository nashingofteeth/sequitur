const { exec } = require("child_process");
const fs = require("mz/fs");


fs.readFile('temp/wave.txt',
    function(err, data) {
        if (err || data.toString('utf8') == '') {
        	exec('touch temp/wave.txt');
        }
    }
 );