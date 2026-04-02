export function formatNotificationTime(dateTime: string): string {
  const parsedDate = parseDDMMYYYYHHMM(dateTime);

  if (!parsedDate) {
    return dateTime;
  }

  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();

  if (diffMs <= 0) {
    return '1 min ago';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 60) {
    const minutes = Math.max(1, diffMinutes);
    return `${minutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function parseDDMMYYYYHHMM(value: string): Date | null {
  const match = value.match(
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const [, dd, mm, yyyy, hh, min] = match;

  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const hour = Number(hh);
  const minute = Number(min);

  const date = new Date(year, month - 1, day, hour, minute);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
}