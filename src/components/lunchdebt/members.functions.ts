import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { memberSchema, teamSchema } from './member-schema';
export const listMembers = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const [members, teams] = await Promise.all([
  context.supabase.from('members').select('id,name,nickname,email,team_id,transfer_code,is_active').order('name'),
  context.supabase.from('teams').select('id,name').order('name'),
 ]);
 if (members.error || teams.error) throw new Error('Không thể tải danh sách. Vui lòng thử lại.');
 return { members: members.data ?? [], teams: teams.data ?? [] };
});
export const saveMember = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(memberSchema).handler(async ({ data, context }) => {
 const { id, ...values } = data;
 const result = id
  ? await context.supabase.from('members').update(values).eq('id', id).select('id').single()
  : await context.supabase.from('members').insert({ ...values, owner_id: context.userId }).select('id').single();
 if (result.error?.code === '23505') throw new Error('Mã CK đã được sử dụng. Vui lòng chọn mã khác.');
 if (result.error?.code === '23503') throw new Error('Team không còn tồn tại hoặc không thuộc tài khoản của bạn.');
 if (result.error) throw new Error('Không thể lưu thành viên. Vui lòng thử lại.');
 return result.data;
});
export const addTeam = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(teamSchema).handler(async ({ data, context }) => {
 const result = await context.supabase.from('teams').insert({ name: data.name, owner_id: context.userId }).select('id,name').single();
 if (result.error?.code === '23505') throw new Error('Tên Team đã tồn tại. Hãy chọn Team trong danh sách.');
 if (result.error) throw new Error('Không thể tạo Team. Vui lòng thử lại.');
 return result.data;
});
export const deleteMember = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
 const result = await context.supabase.from('members').delete().eq('id', data.id).select('id').single();
 if (result.error) throw new Error('Không thể xóa thành viên. Vui lòng thử lại.');
 return { ok: true };
});
export const setMemberActive = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), is_active: z.boolean() })).handler(async ({ data, context }) => {
 const result = await context.supabase.from('members').update({ is_active: data.is_active }).eq('id', data.id).select('id').single();
 if (result.error) throw new Error('Không thể đổi trạng thái. Vui lòng thử lại.');
 return { ok: true };
});
