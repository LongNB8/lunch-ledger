import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const listDebts = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { data, error } = await context.supabase.from('view_member_balances').select('member_id,name,nickname,balance').gt('balance', 0).order('balance', { ascending: false });
 if (error) throw new Error('Không thể tải sổ nợ. Vui lòng thử lại.');
 return (data ?? []).map(r => ({ member_id: r.member_id!, name: r.name ?? '', nickname: r.nickname ?? '', balance: Number(r.balance ?? 0) }));
});

// Amount is re-read on the server so the payment always equals the full current debt.
export const settleDebt = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ memberId: z.string().uuid() })).handler(async ({ data, context }) => {
 const bal = await context.supabase.from('view_member_balances').select('balance').eq('member_id', data.memberId).single();
 const amount = Number(bal.data?.balance ?? 0);
 if (bal.error || amount <= 0) throw new Error('Thành viên này không còn nợ.');
 const res = await context.supabase.from('payments').insert({ member_id: data.memberId, amount, owner_id: context.userId }).select('id').single();
 if (res.error) throw new Error('Không thể gạch nợ. Vui lòng thử lại.');
 return { paymentId: res.data.id, amount };
});

export const undoPayment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ paymentId: z.string().uuid() })).handler(async ({ data, context }) => {
 const res = await context.supabase.from('payments').delete().eq('id', data.paymentId).select('id').single();
 if (res.error) throw new Error('Không thể hoàn tác.');
 return { ok: true };
});
