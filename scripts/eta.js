var lengthMins = 1;
var fps = 24;
var frames = fps*60*lengthMins;
var comparisons = 0;
// for (loop = 0; loop <= number; loop++) {
//     for (i=0;i<=loop;i++) total++;
// }
var comparisons = frames * frames;
var comparisonsPerMinute = 2200;
console.log(comparisons + " comparisons");
var eta = comparisons/comparisonsPerMinute/60/24;
console.log(eta.toFixed(2)+" days");

// 2964 3:40pm 3/7
// 2420 10:20pm 3/7
// 2292 5:15am 3/8
// 2848 2:25pm 3/8
// 2800 5:30pm 3/8
// 2756 3:00am 3/9
