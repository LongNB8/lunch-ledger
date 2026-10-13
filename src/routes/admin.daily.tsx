import { createFileRoute, Link } from '@tanstack/react-router';
import { Suspense } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Utensils, Users, ReceiptText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { useLedger } from '@/components/lunchdebt/use-ledger';
import { displayDate, saigonToday } from '@/components/lunchdebt/ledger';
import { parseDailySearch } from '@/components/lunchdebt/daily-search';
export const Route = createFileRoute('/admin/daily')({ validateSearch: parseDailySearch, head: () => pageHead('Bảng kê theo ngày', 'Bảng kê bữa ăn thực tế hôm nay, từng món, người tham gia và chi phí theo ngày trên LunchDebt.'), component: Daily });
function Daily() {
 const { userId, ready } = useMemberAuth();
 return <><PageHeading title="Bảng kê theo ngày" description="Từng bữa ăn, từng món và phần tiền của mỗi người."/>{!ready ? <Loader2 className="animate-spin"/> : userId ? <Suspense fallback={<div className="member-loading">Đang tải bảng kê…</div>}><DailyLedger userId={userId}/></Suspense> : <MemberSignIn/>}</>;
}
function DailyLedger({ userId }: { userId: string }) {
 const { data } = useLedger(userId);
 const search = Route.useSearch();
 const date = search.date === 'all' ? '' : search.date ?? saigonToday();
 const filteredDate = date || saigonToday();
 const adjacentDate = (offset: number) => {
  const next = new Date(`${filteredDate}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + offset);
  return next.toISOString().slice(0, 10);
 };
 const navigate = Route.useNavigate();
 const setDate = (value: string) => navigate({ search: { date: value || 'all' }, resetScroll: false });
 const filtered = date ? data.meals.filter(m => m.eaten_on === date) : data.meals;
 const participants = new Set(filtered.flatMap(m => m.participant_ids)).size;
 return <>
  <div className="daily-toolbar">
   <div className="date-switcher"><Button variant="ghost" size="icon" aria-label="Ngày trước" title="Ngày trước" asChild><Link to="/admin/daily" search={{ date: adjacentDate(-1) }} resetScroll={false}><ChevronLeft/></Link></Button><label className="date-picker"><CalendarDays size={18}/><input aria-label="Lọc theo ngày" type="date" value={date} onChange={e => void setDate(e.target.value)}/></label><Button variant="ghost" size="icon" aria-label="Ngày sau" title="Ngày sau" asChild><Link to="/admin/daily" search={{ date: adjacentDate(1) }} resetScroll={false}><ChevronRight/></Link></Button></div>
   <div className="date-presets"><Button variant={date === saigonToday() ? 'secondary' : 'ghost'} asChild><Link to="/admin/daily" search={{ date: saigonToday() }} resetScroll={false}>Hôm nay</Link></Button><Button variant={!date ? 'secondary' : 'ghost'} asChild><Link to="/admin/daily" search={{ date: 'all' }} resetScroll={false}>Tất cả ngày</Link></Button></div>
  </div>
  <section className="daily-overview"><div className="daily-total"><span className="member-eyebrow"><ReceiptText size={16}/>{date ? displayDate(date) : 'TẤT CẢ NGÀY'}</span><p>Tổng chi phí</p><h2>{currency(filtered.reduce((s,m) => s + m.total_amount, 0))}</h2></div><div className="daily-count"><Utensils size={22}/><strong>{filtered.length}</strong><span>Bữa ăn</span></div><div className="daily-count"><Users size={22}/><strong>{participants}</strong><span>Người tham gia</span></div></section>
  <div className="section-heading ledger-section-title"><h2>Bữa ăn đã ghi sổ</h2><span className="pill neutral">{filtered.length} bữa</span></div>
  {filtered.length === 0 ? <div className="ledger-empty"><Utensils/><h3>Chưa có bữa ăn{date ? ' trong ngày này' : ''}</h3><p>Không có khoản chi nào được ghi nhận.</p><Button asChild className="mt-5"><Link to="/admin/meals/new"><Plus/>Tạo bữa ăn mới</Link></Button></div> : <div className="daily-meals">{filtered.map(m => {
   const mealItems = data.items.filter(i => i.meal_id === m.id);
   return <details className="daily-meal" key={`${m.id}-${search.meal ?? ''}`} open={m.id === search.meal || filtered.length === 1} data-highlighted={m.id === search.meal}><summary><span className="table-meal-icon"><Utensils size={20}/></span><div><h3>{m.name}</h3><p>{displayDate(m.eaten_on)} · {m.participant_ids.length} người · {mealItems.length} món</p></div><strong>{currency(m.total_amount)}</strong><span className="detail-chevron" aria-hidden>⌄</span></summary><div className="daily-items"><div className="daily-item-header"><span>Món ăn & người ăn</span><span>Thành tiền</span></div>{mealItems.map(i => <div className="daily-item" key={i.id}><div><h4>{i.name}</h4><p>{i.member_ids.map(id => data.members.find(x => x.id === id)?.name ?? 'Thành viên đã xóa').join(', ')}</p></div><div><strong>{currency(i.price)}</strong><p>{i.member_ids.length ? `${currency(i.price / i.member_ids.length)} / người` : 'Chưa phân chia'}</p></div></div>)}<div className="daily-item-total"><span>Tổng bữa ăn</span><strong>{currency(m.total_amount)}</strong></div></div></details>;
  })}</div>}
 </>;
}
