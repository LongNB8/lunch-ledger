import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const readLedger = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [meals, items, members, payments] = await Promise.all([
    context.supabase.from('meals').select('id,name,eaten_on,total_amount,participant_ids').order('eaten_on', { ascending: false }).order('created_at', { ascending: false }),
    context.supabase.from('meal_items').select('id,meal_id,name,price,member_ids,position').order('position'),
    context.supabase.from('members').select('id,name,nickname,is_active'),
    context.supabase.from('payments').select('id,member_id,amount,created_at').order('created_at', { ascending: false }),
  ]);
  if (meals.error || items.error || members.error || payments.error) throw new Error('Không thể tải bảng kê. Vui lòng thử lại.');
  return { meals: meals.data ?? [], items: items.data ?? [], members: members.data ?? [], payments: payments.data ?? [] };
});