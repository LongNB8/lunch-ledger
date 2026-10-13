import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { dishSchema } from './dish-schema';

export const listDishes = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const dishes = await context.supabase.from('dishes').select('id,name,price,icon').order('name');
  if (dishes.error) throw new Error('Không thể tải danh sách món. Vui lòng thử lại.');
  return { dishes: dishes.data ?? [] };
});

export const saveDish = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(dishSchema).handler(async ({ data, context }) => {
  const { id, ...values } = data;
  const result = id
    ? await context.supabase.from('dishes').update(values).eq('id', id).select('id').single()
    : await context.supabase.from('dishes').insert({ ...values, owner_id: context.userId }).select('id').single();
  if (result.error?.code === '23505') throw new Error('Món này đã có trong danh sách. Vui lòng chọn tên khác.');
  if (result.error) throw new Error('Không thể lưu món ăn. Vui lòng thử lại.');
  return result.data;
});

export const deleteDish = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  const result = await context.supabase.from('dishes').delete().eq('id', data.id).select('id').single();
  if (result.error) throw new Error('Không thể xóa món ăn. Vui lòng thử lại.');
  return { ok: true };
});
