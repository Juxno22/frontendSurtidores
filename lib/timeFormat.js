export function formatDurationHHMMSS(seconds) {
  const totalSeconds = Math.max(0, Math.round(Number(seconds || 0)));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(secs).padStart(2, '0')
  ].join(':');
}

export function formatDurationFromHours(hours) {
  return formatDurationHHMMSS(Number(hours || 0) * 3600);
}

export function formatHourMinute(value) {
  if (!value) return '-';

  const text = String(value);

  if (text.includes('T')) {
    return text.slice(11, 16);
  }

  if (text.includes(' ')) {
    return text.slice(11, 16);
  }

  return text.slice(0, 5);
}