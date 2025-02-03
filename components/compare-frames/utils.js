function createProgressMessage(currentFrame, total, processingTime) {
  if (currentFrame < 2 || currentFrame > total - 1) {
    return "comparing frames...";
  }

  const progress = Math.round((currentFrame / total) * 100);
  const diffsPerSec = total / (processingTime / 1000);
  const diffsLeft = (total - currentFrame) * total;
  const secsLeft = Math.round(diffsLeft / diffsPerSec);
  const timeLeft = secsLeft > 60 ? `${Math.round(secsLeft / 60)}m` : `${secsLeft}s`;

  return `comparing frames - ${progress}%, ${timeLeft} left @ ${Math.round(diffsPerSec)}/s`;
}

exports.createProgressMessage = createProgressMessage;
