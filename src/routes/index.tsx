import { Link, createFileRoute } from '@tanstack/react-router';
import { Suspense } from 'react';
import { ArrowRight, CalendarDays, CircleDollarSign, Loader2, Plus, Users, Utensils, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading, SectionHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { useLedger } from '@/components/lunchdebt/use-ledger';
import { displayDate, saigonToday } from '@/components/lunchdebt/ledger';
import lunchImage from '@/assets/lunch.jpg';
export const Route = createFileRoute('/')({ head: () => pageHead('Trang chủ', 'Tổng quan bữa ăn hôm nay, chi phí tháng này, khoản đã thu và công nợ thực tế của bạn trên LunchDebt.'), component: Index });
function Index() {
 const { userId, ready } = useMemberAuth();
 return <><PageHeading title="LunchDebt" description="Bữa ăn hôm nay, tiền đã thu và những khoản còn cần thanh toán." action={false}/>{!ready ? <Loading/> : userId ? <Suspense fallback={<Loading/>}><Overview userId={userId}/></Suspense> : <><Welcome/><MemberSignIn/></>}</>;
}
function Loading() { return <div className="member-loading"><Loader2 className="animate-spin"/>Đang tải tổng quan…</div>; }
function Welcome() { return <section className="home-banner"><img src={lunchImage} alt="Bữa cơm gà cùng rau xanh và canh"/><div><span className="home-eyebrow">BỮA TRƯA CÙNG NHAU</span><h2>Bữa trưa cùng nhau.</h2><p>LunchDebt · Sổ tiền ăn của bạn</p></div></section>; }
function Overview({ userId }: { userId: string }) {
 const { data } = useLedger(userId);
 const today = saigonToday();
 const monthMeals = data.meals.filter(m => m.eaten_on.startsWith(today.slice(0, 7)));
 const todayMeals = data.meals.filter(m => m.eaten_on === today);
 const debts = data.members.map(m => {
  const spent = data.items.reduce((sum, i) => sum + (i.member_ids.includes(m.id) && i.member_ids.length ? i.price / i.member_ids.length : 0), 0);
  const paid = data.payments.filter(p => p.member_id === m.id).reduce((sum, p) => sum + p.amount, 0);
  return { ...m, balance: spent - paid };
 }).filter(m => m.balance > 0).sort((a,b) => b.balance - a.balance);
 const totalDebt = debts.reduce((sum,m) => sum + m.balance, 0);
 const paidMonth = data.payments.filter(p => p.created_at.slice(0,7) === today.slice(0,7)).reduce((sum,p) => sum + p.amount,0);
 const stats = [
  { label: 'Còn cần thu', value: currency(totalDebt), icon: Wallet, tone: 'warning', note: `${debts.length} thành viên còn nợ · tất cả bữa ăn` },
  { label: 'Đã thu tháng này', value: currency(paidMonth), icon: CircleDollarSign, tone: '', note: `Các khoản thanh toán tháng ${Number(today.slice(5,7))}` },
  { label: 'Chi phí tháng này', value: currency(monthMeals.reduce((s,m) => s + m.total_amount,0)), icon: Utensils, tone: 'info', note: `${monthMeals.length} bữa ăn đã ghi nhận` },
  { label: 'Thành viên đang ăn', value: `${data.members.filter(m => m.is_active).length} người`, icon: Users, tone: '', note: `${data.members.length} thành viên trong sổ` },
 ];
 return <><div className="home-intro"><Welcome/><div className="home-today"><span className="member-eyebrow"><CalendarDays size={15}/>HÔM NAY · {displayDate(today)}</span><h2>{todayMeals.length ? `${todayMeals.length} bữa ăn đã ghi sổ` : 'Hôm nay ăn gì?'}</h2><p>{todayMeals.length ? `${currency(todayMeals.reduce((s,m) => s + m.total_amount,0))} tổng chi phí hôm nay` : 'Chưa có bữa ăn nào được ghi nhận hôm nay.'}</p><Button asChild className="h-12"><Link to="/admin/meals/new"><Plus/>Tạo bữa ăn mới</Link></Button></div></div><div className="stat-grid live-stats">{stats.map(s => <article className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><span className={`stat-icon ${s.tone}`}><s.icon size={17}/></span></div><p className="stat-value">{s.value}</p><p className="stat-note">{s.note}</p></article>)}</div><div className="overview-columns"><section><SectionHeading title="Bữa ăn gần đây" to="/admin/daily" label="Bảng kê"/>{data.meals.length ? <div className="home-meals">{data.meals.slice(0,5).map(m => <Link to="/admin/daily" search={{ date: m.eaten_on, meal: m.id }} className="home-meal-row" key={m.id}><span className="table-meal-icon"><Utensils size={18}/></span><div><h3>{m.name}</h3><p>{displayDate(m.eaten_on)} · {m.participant_ids.length} người · {data.items.filter(i => i.meal_id === m.id).length} món</p></div><strong>{currency(m.total_amount)}<ArrowRight size={15}/></strong></Link>)}</div> : <div className="ledger-empty"><Utensils/><h3>Chưa có bữa ăn</h3><p>Bữa ăn đã lưu sẽ xuất hiện trong sổ của bạn.</p></div>}</section><section><SectionHeading title="Những khoản cần thu" to="/admin/debt"/>{debts.length ? <div className="home-debts">{debts.slice(0,5).map((m,index) => <div className="debt-row" key={m.id}><span className="avatar" data-tone={index % 2 ? 'orange' : 'blue'}>{m.name.split(' ').slice(-2).map(s => s[0]).join('')}</span><div className="min-w-0"><p className="member-name">{m.name}</p><p className="member-sub">{m.nickname || 'Tiền ăn còn thiếu'}</p></div><strong className="text-destructive text-sm">{currency(m.balance)}</strong></div>)}<div className="debt-summary"><span>Tổng còn cần thu</span><strong>{currency(totalDebt)}</strong></div></div> : <div className="ledger-empty"><CircleDollarSign/><h3>Không có khoản cần thu</h3><p>Sổ hiện tại không có thành viên còn nợ.</p></div>}<Button variant="outline" className="mt-4 w-full h-12" asChild><Link to="/admin/debt">Mở sổ công nợ<ArrowRight/></Link></Button></section></div></>;
}
