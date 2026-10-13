import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useState } from 'react';
import { queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { CheckCircle2, ChevronDown, Loader2, Megaphone, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { listDebts, settleDebt, undoPayment } from '@/components/lunchdebt/debt.functions';

import { useLedger } from '@/components/lunchdebt/use-ledger';
import { displayDate } from '@/components/lunchdebt/ledger';

export const Route = createFileRoute('/admin/debt')({ head: () => pageHead('Sổ công nợ', 'Theo dõi công nợ bữa ăn, gạch nợ 1 chạm và chốt nợ Thứ 6 trên LunchDebt.'), component: Debt });

type Debt = { member_id: string; name: string; nickname: string; balance: number };
const vnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

function Debt() {
 const { userId, ready } = useMemberAuth();
 const loading = <div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải sổ nợ…</div>;
 if (!ready) return loading;
 if (!userId) return <><PageHeading title="Sổ công nợ" description="Đăng nhập để xem và gạch nợ."/><MemberSignIn/></>;
 return <Suspense fallback={loading}><DebtBoard userId={userId}/></Suspense>;
}

function DebtBoard({ userId }: { userId: string }) {
 const fetchDebts = useServerFn(listDebts);
 const settle = useServerFn(settleDebt);
 const undo = useServerFn(undoPayment);
 const qc = useQueryClient();
 const key = ['debts', userId];
 const { data } = useSuspenseQuery(queryOptions({ queryKey: key, queryFn: () => fetchDebts() }));
 const { data: ledger } = useLedger(userId);
 const [search, setSearch] = useState('');
 const visible = data.filter(d => `${d.name} ${d.nickname}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
 const total = data.reduce((s, d) => s + d.balance, 0);

 async function pay(d: Debt) {
  qc.setQueryData<Debt[]>(key, old => (old ?? []).filter(x => x.member_id !== d.member_id));
  try {
   const { paymentId } = await settle({ data: { memberId: d.member_id } });
   qc.invalidateQueries({ queryKey: ['ledger', userId] });
   toast.success(`Đã gạch nợ thành công cho ${d.name}`, { duration: 5000, action: { label: 'Hoàn tác', onClick: async () => {
    try { await undo({ data: { paymentId } }); toast('Đã hoàn tác'); } catch (e) { toast.error((e as Error).message); }
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ['ledger', userId] });
   } } });
  } catch (e) { toast.error((e as Error).message); qc.invalidateQueries({ queryKey: key }); }
 }

 async function closeFriday() {
  const lines = data.map(d => `${d.name}${d.nickname ? ` (${d.nickname})` : ''}: ${vnd(d.balance)} VNĐ`).join('\n');
  const text = `📢 BẢNG TỔNG KẾT TIỀN ĂN TUẦN NÀY:\n---------------------------------\n${lines || 'Không ai còn nợ 🎉'}\n\n👉 Anh em bấm vào link quét VietQR thanh toán nhé: ${window.location.origin}`;
  try { await navigator.clipboard.writeText(text); toast.success('Đã sao chép nội dung chốt nợ để gửi nhóm Zalo!'); }
  catch { toast.error('Trình duyệt chặn sao chép. Vui lòng thử lại.'); }
 }

 return <>
  <PageHeading title="Sổ công nợ" description="Tiền ăn đã chia − tiền đã thanh toán = số tiền còn cần thu."/>
  <section className="debt-overview"><div><span className="member-eyebrow"><Wallet size={16}/>CÔNG NỢ HIỆN TẠI</span><h2>{currency(total)}</h2><p>{data.length} thành viên còn nợ · Tất cả bữa ăn đã ghi sổ</p></div><div className="friday-action"><Button size="lg" className="h-12" onClick={closeFriday}><Megaphone/>Chốt nợ Thứ 6</Button><span>Tổng hợp các khoản còn nợ để gửi nhóm</span></div></section>
  <div className="debt-toolbar"><h2>Khoản cần thu <span className="pill warning">{data.length}</span></h2><label className="member-search"><Search size={17}/><input aria-label="Tìm người còn nợ" placeholder="Tìm tên hoặc nickname…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
  {data.length === 0 ? <div className="ledger-empty"><CheckCircle2/><h3>Không ai còn nợ</h3><p>Tất cả khoản tiền ăn hiện tại đã được thanh toán.</p></div> : visible.length === 0 ? <div className="ledger-empty"><Search/><h3>Không tìm thấy thành viên</h3></div> :
  <div className="debt-cards">{visible.map((d, index) => {
   const contributions = ledger.meals.map(m => ({ ...m, amount: ledger.items.filter(i => i.meal_id === m.id && i.member_ids.includes(d.member_id) && i.member_ids.length).reduce((s,i) => s + i.price / i.member_ids.length, 0) })).filter(m => m.amount !== 0);
   const spent = contributions.reduce((s,m) => s + m.amount,0);
   const paid = ledger.payments.filter(p => p.member_id === d.member_id).reduce((s,p) => s + p.amount,0);
   return <article key={d.member_id} className="debt-account"><div className="debt-account-top"><span className="avatar" data-tone={index % 2 ? 'orange' : 'blue'}>{d.name.split(' ').slice(-2).map(s => s[0]).join('')}</span><div><h3>{d.name}</h3><p>{d.nickname || `${contributions.length} bữa ăn đã tham gia`}</p></div><span className="pill warning">Còn nợ</span></div>
   <div className="debt-due"><span>Cần thanh toán</span><strong>{currency(d.balance)}</strong></div>
   <dl className="debt-math"><div><dt>Tiền ăn đã chia</dt><dd>{currency(spent)}</dd></div><div><dt>Đã thanh toán</dt><dd>{currency(paid)}</dd></div></dl>
   <details className="debt-detail"><summary>{contributions.length} bữa ăn · Chi tiết khoản tiền<ChevronDown size={15}/></summary><div>{contributions.map(m => <div className="contribution-row" key={m.id}><div><h4>{m.name}</h4><p>{displayDate(m.eaten_on)}</p></div><strong>{currency(m.amount)}</strong></div>)}{ledger.payments.filter(p => p.member_id === d.member_id).map(p => <div className="contribution-row" key={p.id}><div><h4>Đã thanh toán</h4><p>{displayDate(p.created_at.slice(0,10))}</p></div><strong className="text-primary">−{currency(p.amount)}</strong></div>)}</div></details>
   <label className="debt-settle"><Checkbox aria-label={`Đã trả hết — ${d.name}`} className="size-6" onCheckedChange={v => v && pay(d)}/><span>Đã trả hết<small>Ghi nhận đủ {currency(d.balance)}</small></span><CheckCircle2 size={18}/></label>
  </article>;
  })}</div>}
 </>;
}
