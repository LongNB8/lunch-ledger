export function missingMealFields(name: string, date: string, total: number, selected: string[], items: { name: string; price: number; member_ids: string[] }[]) {
  const missing: string[] = [];
  if (!name.trim()) missing.push('Tên bữa ăn');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) missing.push('Ngày ăn hợp lệ');
  if (total <= 0 || total > 1_000_000_000) missing.push('Tổng tiền các món lớn hơn 0');
  if (!selected.length) missing.push('Người tham gia');
  if (!items.length) missing.push('Ít nhất một món');
  if (items.some(i => !i.name.trim() || i.name.trim().length > 120 || !i.member_ids.length || Math.abs(i.price) > 100_000_000)) missing.push('Tên, giá và người ăn cho mỗi món');
  return missing;
}