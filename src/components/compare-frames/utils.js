function createProgressMessage(current, total, processingTime) {
  if (current < 2 || current > total - 1) {
    return "comparing frames...";
  }

  const progress = Math.round((current / total) * 100);
  const diffsPerSec = total / (processingTime / 1000);
  const diffsLeft = (total - current) * total;
  const secsLeft = Math.round(diffsLeft / diffsPerSec);
  const timeLeft = secsLeft > 60 ? `${Math.round(secsLeft / 60)}m` : `${secsLeft}s`;

  return `comparing frames - ${progress}%, ${timeLeft} left @ ${Math.round(diffsPerSec)}/s`;
}

exports.createProgressMessage = createProgressMessage;