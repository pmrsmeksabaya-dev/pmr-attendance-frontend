const TZ = 'Asia/Makassar';

export function formatWitaDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(d);
}

export function formatWitaTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: TZ,
    }).format(d) + ' WITA'
  );
}

export function formatWitaDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return (
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TZ,
    }).format(d) + ' WITA'
  );
}