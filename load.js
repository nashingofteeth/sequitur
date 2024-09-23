const seq = require("./src/sequitur");

(async () => {
  if (Object.keys(seq.args).length < 2) {
    console.log("no file arguments");
  } else {
    if (seq.args.a) {
      seq.wave();
    }
    if (seq.args.v) {
      seq.diffs();
    }
  }
})();
