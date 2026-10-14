import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { CheckCircle2, Hand, Loader2, Timer, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { listBatchRuns } from '@/components/lunchdebt/batch.functions';

export const Route = createFileRoute('/admin/batch-history')({ head: () => pageHead('Lịch sử chạy batch', 'Theo dõi mỗi lần batch chạy: thời gian, kết quả, người nhận email và tổng công nợ trên LunchDebt.'), component: HistoryPage });

const fmt = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const secs = (a: string, b: string | null) => b ? `${((Date.parse(b) - Date.parse(a)) / 1000).toFixed(1)} giây` : '—';

function HistoryPage() {
  const { userId, ready } = useMemberAuth();
  return <><PageHeading title="Lịch sử chạy batch" description="Mỗi lần chạy thủ công hoặc theo lịch đều được ghi lại." action={false}/>{!ready ? <Loader2 className="animate-spin"/> : userId ? <Runs userId={userId}/> : <MemberSignIn/>}</>;
}

function Runs({ userId }: { userId: string }) {
  const list = useServerFn(listBatchRuns);
  const q = useQuery({ queryKey: ['batch-runs', userId], queryFn: () => list() });
  if (q.isLoading) return <div className="member-loading"><Loader2 className="animate-spin"/>Đang tải lịch sử…</div>;
  if (q.isError) return <div role="alert" className="field-error">Không tải được lịch sử. <Button variant="outline" size="sm" onClick={() => void q.refetch()}>Thử lại</Button></div>;
  const runs = q.data?.runs ?? [];
  const ok = runs.filter(r => r.status === 'success').length;
  const fail = runs.filter(r => r.status === 'failed').length;
  return <>
    <section className="daily-overview"><div className="daily-total"><span className="member-eyebrow"><Timer size={16}/>TỔNG SỐ LẦN CHẠY</span><p>Đã ghi nhận</p><h2>{runs.length}</h2></div><div className="daily-count"><CheckCircle2 size={22}/><strong>{ok}</strong><span>Thành công</span></div><div className="daily-count"><XCircle size={22}/><strong>{fail}</strong><span>Thất bại</span></div></section>
    {runs.length === 0 ? <div className="ledger-empty"><Timer/><h3>Chưa có lần chạy nào</h3><p>Chạy thử ở trang Batch thủ công.</p></div> :
    <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Thời gian</th><th>Batch</th><th>Kiểu</th><th>Trạng thái</th><th>Người nợ</th><th>Tổng nợ</th><th>Thời lượng</th><th>Ghi chú</th></tr></thead><tbody>{runs.map(r => <tr key={r.id}>
      <td className="whitespace-nowrap">{fmt(r.started_at)}</td><td>{r.job_name}</td>
      <td><span className="pill neutral">{r.trigger_type === 'manual' ? <><Hand size={12}/> Thủ công</> : <><Timer size={12}/> Theo lịch</>}</span></td>
      <td><span className={`pill ${r.status === 'success' ? '' : 'warning'}`}>{r.status === 'success' ? 'Thành công' : r.status === 'failed' ? 'Thất bại' : 'Đang chạy'}</span></td>
      <td>{r.debtor_count}</td><td>{currency(Number(r.total_debt))}</td><td className="text-muted-foreground">{secs(r.started_at, r.finished_at)}</td><td className="text-muted-foreground batch-msg">{r.message || r.recipient}</td>
    </tr>)}</tbody></table></div>}
  </>;
}
