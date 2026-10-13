import { displayDate } from './ledger';

export type DraftItem = { key: string; name: string; price: number; member_ids: string[]; even?: boolean };
export const EVEN_NAME = 'Món chung (chia đều)';
export const presetMealName = (preset: string, date: string) => `${preset} (${displayDate(date)})`;
export const draftItemTotal = (item: DraftItem) => item.price * (item.even ? item.member_ids.length : 1);
export const savedDraftItem = (item: DraftItem) => ({ name: item.even ? EVEN_NAME : item.name.trim(), price: draftItemTotal(item), member_ids: item.member_ids });