import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Clock, History, Loader2, Mail, Play, Save, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { listBatchJobs, triggerBatchJob, updateBatchJob } from '@/components/lunchdebt/batch.functions';

export const Route = createFileRoute('/admin/batch')({ head: () => pageHead('Batch thủ công', 'Chỉnh lịch chạy và chạy ngay các batch tự động như gửi email công nợ trên LunchDebt.'), component: BatchPage });

const DAYS = [{ v: 1, l: 'T2' }, { v: 2, l: 'T3' }, { v: 3, l: 'T4' }, { v: 4, l: 'T5' }, { v: 5, l: 'T6' }, { v: 6, l: 'T7' }, { v: 0, l: 'CN' }];
const fmt = (s: string | null) => s ? new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa chạy';

function BatchPage() {
  const { userId, ready } = useMemberAuth();
  return <><PageHeading title="Batch thủ công" description="Chỉnh giờ chạy tự động hoặc chạy ngay một batch." action={false}/>{!ready ? <Loader2 className="animate-spin"/> : userId ? <Jobs userId={userId}/> : <MemberSignIn/>}</>;
}

type Job = Awaited<ReturnType<typeof listBatchJobs>>['jobs'][number];

function Jobs({ userId }: { userId: string }) {
  const list = useServerFn(listBatchJobs);
  const q = useQuery({ queryKey: ['batch-jobs', userId], queryFn: () => list() });
  if (q.isLoading) return <div className="member-loading"><Loader2 className="animate-spin"/>Đang tải batch…</div>;
  if (q.isError) return <p role="alert" className="field-error">Không tải được batch.</p>;
  const jobs = q.data?.jobs ?? [];
  if (!jobs.length) return <div className="ledger-empty"><Timer/><h3>Chưa có batch nào</h3><p>Tài khoản này chưa được gán batch.</p></div>;
  return <div className="batch-list">{jobs.map(j => <JobCard key={j.id} job={j} recipient={q.data!.recipient} userId={userId}/>)}</div>;
}

function JobCard({ job, recipient, userId }: { job: Job; recipient: string; userId: string }) {
  const qc = useQueryClient();
  const update = useServerFn(updateBatchJob);
  const trigger = useServerFn(triggerBatchJob);
  const [days, setDays] = useState<number[]>(job.days_of_week);
  const [time, setTime] = useState(job.run_time.slice(0, 5));
  const [active, setActive] = useState(job.is_active);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  useEffect(() => { setDays(job.days_of_week); setTime(job.run_time.slice(0, 5)); setActive(job.is_active); }, [job]);
  const dirty = time !== job.run_time.slice(0, 5) || active !== job.is_active || [...days].sort().join() !== [...job.days_of_week].sort().join();
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['batch-jobs', userId] }), qc.invalidateQueries({ queryKey: ['batch-runs', userId] })]);
  async function save() {
    setSaving(true);
    try { await update({ data: { id: job.id, days_of_week: days, run_time: time, is_active: active } }); await refresh(); toast.success('Đã cập nhật lịch chạy'); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Không thể lưu.'); } finally { setSaving(false); }
  }
  async function run() {
    setRunning(true);
    try { const r = await trigger({ data: { id: job.id } }); await refresh(); toast.success(r.status === 'success' ? `Đã gửi email: ${r.debtors} người nợ · ${currency(r.total)}` : 'Đã chạy batch'); }
    catch (e) { await refresh(); toast.error(e instanceof Error ? e.message : 'Chạy thất bại.'); } finally { setRunning(false); }
  }
  const dayText = DAYS.filter(d => days.includes(d.v)).map(d => d.l).join(', ') || 'Không có ngày';
  return <section className="form-section batch-card">
    <div className="batch-head"><span className="table-meal-icon"><Mail size={20}/></span><div className="min-w-0 flex-1"><h2>{job.name}</h2><p>{job.description}</p></div><span className={`pill ${active ? '' : 'neutral'}`}>{active ? 'Đang bật' : 'Đã tắt'}</span></div>
    <dl className="batch-meta"><div><dt>Người nhận</dt><dd>{recipient}</dd></div><div><dt>Lịch hiện tại</dt><dd>{job.is_active ? `${DAYS.filter(d => job.days_of_week.includes(d.v)).map(d => d.l).join(', ')} lúc ${job.run_time.slice(0, 5)}` : 'Tắt'}</dd></div><div><dt>Lần chạy gần nhất</dt><dd>{fmt(job.last_run_at)}</dd></div></dl>
    <div className="field"><span>Ngày chạy trong tuần</span><div className="batch-days" role="group" aria-label="Ngày chạy">{DAYS.map(d => { const on = days.includes(d.v); return <button key={d.v} type="button" className="price-preset" aria-pressed={on} data-selected={on} onClick={() => setDays(on ? days.filter(x => x !== d.v) : [...days, d.v])}>{d.l}</button>; })}</div></div>
    <div className="batch-row"><label className="field">Giờ chạy (giờ Việt Nam)<div className="tax-input-wrap"><input type="time" value={time} onChange={e => setTime(e.target.value)}/><Clock size={16}/></div></label><label className="batch-switch"><Switch checked={active} onCheckedChange={setActive}/>Tự động chạy</label></div>
    <p className="text-xs text-muted-foreground">Sẽ chạy: {active ? `${dayText} lúc ${time}` : 'không tự động'}. Lịch tự động hoạt động sau khi ứng dụng được xuất bản.</p>
    <div className="batch-actions"><Button variant="outline" className="h-12" disabled={!dirty || saving || !/^\d{2}:\d{2}$/.test(time)} onClick={save}>{saving ? <Loader2 className="animate-spin"/> : <Save/>}Lưu lịch</Button><Button className="h-12" disabled={running} onClick={run}>{running ? <Loader2 className="animate-spin"/> : <Play/>}{running ? 'Đang gửi…' : 'Chạy ngay'}</Button><Button variant="ghost" className="h-12" asChild><Link to="/admin/batch-history"><History/>Lịch sử chạy</Link></Button></div>
  </section>;
}
