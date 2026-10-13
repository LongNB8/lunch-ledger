import { createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { useSuspenseQuery, queryOptions } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, Monitor, Smartphone, Globe, Clock } from 'lucide-react';
import { pageHead } from '@/components/lunchdebt/data';
import { PageHeading } from '@/components/lunchdebt/layout';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { listLogins } from '@/components/lunchdebt/logins.functions';

export const Route = createFileRoute('/admin/logins')({ head: () => pageHead('Lịch sử đăng nhập', 'Theo dõi thời gian, thiết bị, trình duyệt và địa chỉ IP của các lần đăng nhập LunchDebt.'), component: Logins });

const loading = <div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải lịch sử…</div>;
function Logins() {
  const { userId, ready } = useMemberAuth();
  if (!ready) return loading;
  if (!userId) return <MemberSignIn/>;
  return <Suspense fallback={loading}><History userId={userId}/></Suspense>;
}
const fmt = (s: string) => new Date(s).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
function History({ userId }: { userId: string }) {
  const fetchLogins = useServerFn(listLogins);
  const { data } = useSuspenseQuery(queryOptions({ queryKey: ['logins', userId], queryFn: () => fetchLogins() }));
  const rows = data.logins;
  const week = rows.filter(r => Date.now() - new Date(r.logged_in_at).getTime() < 7 * 864e5).length;
  const devices = new Set(rows.map(r => `${r.device}-${r.os}-${r.browser}`)).size;
  const ips = new Set(rows.map(r => r.ip_address).filter(Boolean)).size;
  const stats = [['Tổng lượt đăng nhập', rows.length], ['7 ngày qua', week], ['Thiết bị khác nhau', devices], ['Địa chỉ IP', ips]] as const;
  return <div className="space-y-6">
    <PageHeading title="Lịch sử đăng nhập" description="Các lần đăng nhập gần nhất vào tài khoản của bạn." action={false}/>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="rounded-lg border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>)}</div>
    <div className="rounded-lg border bg-card">
      {rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground">Chưa có lần đăng nhập nào được ghi lại.</p> :
      <ul className="divide-y">{rows.map(r => <li key={r.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 text-sm">
        <span className="flex min-w-48 items-center gap-2 font-medium"><Clock size={15} className="text-primary"/>{fmt(r.logged_in_at)}</span>
        <span className="min-w-40 text-muted-foreground">{r.email}</span>
        <span className="flex items-center gap-2">{r.device === 'Máy tính' ? <Monitor size={15}/> : <Smartphone size={15}/>}{r.device} · {r.os} · {r.browser}</span>
        <span className="flex items-center gap-2 text-muted-foreground"><Globe size={15}/>{r.ip_address || '—'}{r.country ? ` (${r.country})` : ''}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{r.method === 'google' ? 'Google' : 'Mật khẩu'}</span>
      </li>)}</ul>}
    </div>
  </div>;
}
