const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const utcDateToDateStr = (dt) => (dt ? dateFormatter.format(dt) : '');

const utcDateToDateTimeStr = (dt) => (dt ? dateTimeFormatter.format(dt) : '');

const formatAxiosError = (error) => error ? (error.response?.data?.detail ?? (error.message ?? '')) : '';

function fileSize(size, precision = 1, base = 1024) {
  const prefixes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const multiplier = 10 ** precision;

  let i = 0;

  do {
    if (size < base ** (i + 1)) break;
    i += 1;
  } while (i < prefixes.length - 1);

  return i === 0
    ? `${size} ${size === 1 ? 'byte' : 'bytes'}`
    : `${(Math.round(size * multiplier / (base ** i)) / multiplier).toFixed(precision)} ${prefixes[i]}`;
}

export { utcDateToDateStr, utcDateToDateTimeStr, formatAxiosError, fileSize };
