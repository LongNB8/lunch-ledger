export function parseDailySearch(search: Record<string, unknown>): { date?: string; meal?: string } {
  const date = search['date'];
  const validDate = typeof date === 'string' && (date === 'all' || (/^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date));
  return {
    ...(validDate ? { date } : {}),
    ...(typeof search['meal'] === 'string' && /^[0-9a-f-]{36}$/i.test(search['meal']) ? { meal: search['meal'] } : {}),
  };
}