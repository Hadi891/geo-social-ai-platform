export function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString.endsWith('Z') ? isoString : isoString + 'Z');
  if (isNaN(date.getTime())) return isoString;

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return '1 min ago';

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}
