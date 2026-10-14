import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { runDebtReport } from './batch.server';

export const listBatchJobs = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const read = () => context.supabase.from('batch_jobs').select('id,code,name,description,days_of_week,run_time,is_active,last_run_at,updated_at').order('created_at');
  let { data, error } = await read();
  if (error) throw new Error('Không tải được danh sách batch.');
  if (!data?.length) {
    // Every account gets its own fixed debt-report batch; users can only edit it, never create/delete.
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const ins = await supabaseAdmin.from('batch_jobs').insert({ code: `debt-report-${context.userId}`, owner_id: context.userId, name: 'Gửi báo cáo công nợ', description: 'Gửi email bảng công nợ chưa thanh toán cho admin.', days_of_week: [2, 4], run_time: '15:00' }).select('id').single();
    if (!ins.error) await supabaseAdmin.rpc('schedule_batch_job', { _job_id: ins.data.id });
    ({ data, error } = await read());
    if (error) throw new Error('Không tải được danh sách batch.');
  }
  return { jobs: data ?? [], recipient: process.env['REPORT_ADMIN_EMAIL'] || 'long17000547@gmail.com' };
});

export const updateBatchJob = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), days_of_week: z.array(z.number().int().min(0).max(6)).max(7), run_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), is_active: z.boolean() }))
  .handler(async ({ data, context }) => {
    const days = [...new Set(data.days_of_week)].sort();
    const res = await context.supabase.from('batch_jobs').update({ days_of_week: days, run_time: data.run_time, is_active: data.is_active, updated_at: new Date().toISOString() }).eq('id', data.id).select('id').single();
    if (res.error) throw new Error('Không thể cập nhật batch.');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const sched = await supabaseAdmin.rpc('schedule_batch_job', { _job_id: data.id });
    if (sched.error) throw new Error('Đã lưu nhưng không cập nhật được lịch chạy.');
    return { ok: true };
  });

export const triggerBatchJob = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const own = await context.supabase.from('batch_jobs').select('id').eq('id', data.id).single();
    if (own.error) throw new Error('Không tìm thấy batch.');
    const r = await runDebtReport(data.id, 'manual');
    if (r.status === 'failed') throw new Error(`Chạy batch thất bại: ${r.message}`);
    return r;
  });

export const listBatchRuns = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('batch_job_runs').select('id,job_id,trigger_type,status,recipient,debtor_count,total_debt,message,started_at,finished_at,batch_jobs(name)').order('started_at', { ascending: false }).limit(200);
  if (error) throw new Error('Không tải được lịch sử batch.');
  return { runs: (data ?? []).map(r => ({ ...r, job_name: (r.batch_jobs as { name: string } | null)?.name ?? 'Batch' })) };
});
