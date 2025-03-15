function createProgressMessage(currentFrame, total, processingTime) {
  if (currentFrame < 2 || currentFrame > total - 1 || processingTime === 0) {
    return "comparing frames...";
  }

  const progress = Math.round((currentFrame / total) * 100);

  const totalComparisons = (total * (total - 1)) / 2;
  const completedComparisons = ((currentFrame - 1) * currentFrame) / 2;
  const remainingComparisons = totalComparisons - completedComparisons;

  const comparisonsInThisFrame = total - currentFrame;
  const comparisonsPerSec = comparisonsInThisFrame / (processingTime / 1000);

  const secsLeft = Math.round(remainingComparisons / comparisonsPerSec);
  const timeLeft = secsLeft > 60 ? `${Math.round(secsLeft / 60)}m` : `${secsLeft}s`;
  const rateDisplay = `${Math.round(comparisonsPerSec)}/s`;

  return `comparing frames - ${progress}%, ${timeLeft} left @ ${rateDisplay}`;
}

exports.createProgressMessage = createProgressMessage;
