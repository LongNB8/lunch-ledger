import { z } from 'zod';
export const memberSchema = z.object({
 id: z.string().uuid().optional(),
 name: z.string().trim().min(1, 'Vui lòng nhập tên đầy đủ.').max(100, 'Tên tối đa 100 ký tự.'),
 nickname: z.string().trim().max(60, 'Nickname tối đa 60 ký tự.'),
 email: z.union([z.literal(''), z.string().trim().email('Email không hợp lệ.').max(254, 'Email quá dài.')]),
 team_id: z.union([z.string().uuid('Vui lòng chọn Team hợp lệ.'), z.null()]),
 transfer_code: z.string().trim().min(1, 'Vui lòng nhập mã CK.').max(32, 'Mã CK tối đa 32 ký tự.').regex(/^[A-Z0-9]+$/, 'Mã CK chỉ gồm chữ in hoa không dấu và số.'),
 is_active: z.boolean(),
});
export const teamSchema = z.object({ name: z.string().trim().min(1, 'Vui lòng nhập tên Team.').max(100, 'Tên Team tối đa 100 ký tự.') });
export type MemberInput = z.infer<typeof memberSchema>;
export type Team = { id: string; name: string };
export type Member = MemberInput & { id: string };
export function normalizeSearch(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase(); }
export function suggestTransferCode(name: string, used: string[] = []) {
 const parts = normalizeSearch(name.trim()).split(/\s+/);
 const base = (parts.at(-1) ?? '').replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 28);
 if (!base) return '';
 let code = base;
 let suffix = 2;
 while (used.includes(code)) { code = `${base}${suffix}`; suffix += 1; }
 return code;
}
export function filterMembers(members: Member[], search: string) {
 const term = normalizeSearch(search.trim());
 return members.filter(member => normalizeSearch(member.name).includes(term) || normalizeSearch(member.email).includes(term));
}
