import { useEffect, useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowUpRight, Bell, Timer, ListChecks, CalendarDays, ChevronDown, History, Home, Menu, Plus, ShieldCheck, Users, Utensils, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { saigonToday, displayDate } from './ledger';
const navigation = [
 { to: '/' as const, label: 'Trang chủ', mobile: 'Trang chủ', icon: Home },
 { to: '/admin/meals/new' as const, label: 'Tạo bữa ăn', mobile: 'Tạo bữa', icon: Plus },
 { to: '/admin/debt' as const, label: 'Sổ công nợ', mobile: 'Sổ nợ', icon: Wallet },
  { to: '/admin/daily' as const, label: 'Bảng kê theo ngày', mobile: 'Bảng kê', icon: CalendarDays },
 { to: '/admin/members' as const, label: 'Quản lý thành viên', mobile: 'Thành viên', icon: Users },
 { to: '/admin/dishes' as const, label: 'Quản lý món ăn', mobile: 'Món ăn', icon: Utensils },
 { to: '/admin/logins' as const, label: 'Lịch sử đăng nhập', mobile: 'Đăng nhập', icon: History },
 { to: '/admin/batch' as const, label: 'Batch thủ công', mobile: 'Batch', icon: Timer },
 { to: '/admin/batch-history' as const, label: 'Lịch sử chạy batch', mobile: 'Lịch sử batch', icon: ListChecks },
];
export function Brand() { return <div className="brand"><span className="brand-icon"><Utensils size={21}/></span><span>Lunch<span className="text-primary">Debt</span><span className="text-primary">.</span></span></div>; }
function Navigation({ close }: { close?: () => void }) {
 const pathname = useRouterState({ select: s => s.location.pathname });
 return <nav aria-label="Menu chính">{navigation.map(item => <Button key={item.to} variant="ghost" className="side-link" data-active={pathname === item.to} asChild><Link to={item.to} onClick={close} aria-current={pathname === item.to ? 'page' : undefined}><item.icon size={18}/>{item.label}</Link></Button>)}</nav>;
}
function Workspace() { return <div className="workspace"><div className="workspace-card"><span className="avatar">LD</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Team Lunch</p><p className="mt-1 text-[10px] text-muted-foreground">Sổ tiền ăn riêng tư</p></div><ChevronDown size={14} className="text-muted-foreground"/></div><div className="mt-5 flex items-center gap-2 px-2 text-[10px] text-muted-foreground"><ShieldCheck size={13}/>Một bữa vui. Một sổ rõ ràng.</div></div>; }
export function AppLayout({ children }: { children: React.ReactNode }) {
 const pathname = useRouterState({ select: s => s.location.pathname });
 const title = navigation.find(item => item.to === pathname)?.label ?? 'LunchDebt';
 const [drawer, setDrawer] = useState(false);
 const [date, setDate] = useState('');
 useEffect(() => { setDate(displayDate(saigonToday())); }, []);
 return <div><aside className="app-sidebar"><Link to="/" aria-label="LunchDebt Trang chủ"><Brand/></Link><p className="brand-sub">Bữa trưa cùng nhau, công nợ rõ ràng.</p><p className="nav-caption">Không gian làm việc</p><Navigation/><Workspace/></aside><div className="app-main"><header className="topbar"><div className="min-w-0"><span className="topbar-label">{title}</span></div><div className="topbar-right"><span className="date-label">{date}</span><Sheet><SheetTrigger asChild><Button variant="ghost" size="icon" className="notification" aria-label="Thông báo"><Bell size={19}/></Button></SheetTrigger><SheetContent><SheetTitle>Thông báo</SheetTitle><SheetDescription>Cập nhật từ Team Lunch</SheetDescription><div className="drawer-body"><p className="text-sm font-medium">Chưa có thông báo mới</p><p className="mt-3 text-xs leading-6 text-muted-foreground">Các khoản tiền ăn được cập nhật trong bảng kê và sổ công nợ.</p></div></SheetContent></Sheet><span className="avatar">AD</span><Sheet open={drawer} onOpenChange={setDrawer}><SheetTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu" aria-label="Mở menu"><Menu size={22}/></Button></SheetTrigger><SheetContent side="left" className="flex flex-col pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]"><SheetTitle asChild><Brand/></SheetTitle><SheetDescription>Không gian Team Lunch</SheetDescription><div className="drawer-body"><Navigation close={() => setDrawer(false)}/></div><Workspace/></SheetContent></Sheet></div></header><main className="page-content">{children}<footer className="page-footer"><span className="footer-brand"><Utensils size={12}/>LunchDebt · Bữa trưa gắn kết</span><span>Sổ tiền ăn · {date}</span></footer></main></div><nav className="bottom-nav" aria-label="Điều hướng điện thoại">{navigation.slice(0,4).map((item,i) => <Button key={item.to} variant="ghost" className="bottom-item" data-active={pathname === item.to} asChild><Link to={item.to} aria-current={pathname === item.to ? 'page' : undefined}>{i === 1 ? <span className="bottom-add"><Plus/></span> : <item.icon/>}<span>{item.mobile}</span></Link></Button>)}</nav></div>;
}
export function PageHeading({ title, description, action = true }: { title: string; description: string; action?: boolean }) { return <div className="page-heading"><div className="min-w-0"><span className="page-eyebrow">LUNCHDEBT / TEAM LUNCH</span><h1>{title}</h1><p>{description}</p></div>{action && <Button asChild className="primary-action"><Link to="/admin/meals/new"><Plus/>Tạo bữa ăn mới</Link></Button>}</div>; }
export function SectionHeading({ title, to, label = 'Xem tất cả' }: { title: string; to: '/' | '/admin/daily' | '/admin/debt'; label?: string }) { return <div className="section-heading"><h2>{title}</h2><Link to={to} className="flex shrink-0 items-center gap-1">{label}<ArrowUpRight size={13}/></Link></div>; }
