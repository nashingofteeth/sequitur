const fs = require("mz/fs");
var names = [], out = '';

const dir = './frames_240/';
fs.readdir(dir, (err, files) => {
      for (i = 1; i < files.length; i++) names.push(i);
      console.log(names);
      shuffle(names);
});

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    output(a);
}

function output(shuffled) {
    for (i in names) out += "mv frames_240/" + (parseInt(i)+1) + ".jpg" + " frames_240/" + shuffled[i] + ".jpg;\n" +
                            "mv frames_480/" + (parseInt(i)+1) + ".jpg" + " frames_480/" + shuffled[i] + ".jpg;\n";
    console.log(out);
    fs.writeFile('shuffle.sh', out, function (err) {
      if (err) throw err;
      console.log('written!');
    });
}
