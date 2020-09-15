const fs = require("mz/fs");
var out = '', obj = [], diffs = [], usedKeys = [];

fs.readFile('logs/comparisons.txt',
    function(err, data) {
        if (err) throw err;

        var text = data.toString('utf8');
        var json = JSON.parse(text);
        for (i in json) obj.push(json[i]);

        sort(0);
});

function sort(i) {

    poolSize = obj.length - usedKeys.length;
    console.log(poolSize);

    out += "file 'frames/" + (i+1) + ".jpg'\n" +
                 "duration " + '0.5' + "\n";

    console.log(i);
    console.log(usedKeys);
    // console.log(obj[i]);

    var objValues = obj[i];

    for (k in usedKeys) delete objValues[usedKeys[k]+1];
    console.log(objValues);

    for (d in objValues) diffs.push(objValues[d]);
    sorted = diffs.sort(function(a, b){return a-b});

    var diffLevel = 1;
    var nextKey = Object.keys(obj[i]).find(key => obj[i][key] === sorted[diffLevel]) - 1;
    console.log(nextKey);

    usedKeys.push(i);
    diffs = [];

    if (usedKeys.length == obj.length) output(out);
    else sort(nextKey);
}

function output(a) {
    // console.log(a);
    fs.writeFile('logs/sequence.txt', a, function (err) {
      if (err) throw err;
      console.log('written!');
    });
}
