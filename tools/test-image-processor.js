const { getDiff } = require('../components/compare-frames/image-processor');
(async () => {
    const startTime = Date.now();
    let diff = await getDiff('IMG_9231_trimmed.MOV', '1', '2');
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    console.log('Diff is: ', diff);
    console.log(`Execution time: ${elapsedTime}ms`);
})();
