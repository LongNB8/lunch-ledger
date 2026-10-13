import { createFileRoute, Link, useBlocker, useNavigate } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, Loader2, Plus, Trash2, Users, Search, Utensils, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageHeading } from '@/components/lunchdebt/layout';
import { currency, pageHead } from '@/components/lunchdebt/data';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { listMembers } from '@/components/lunchdebt/members.functions';
import { listDishes } from '@/components/lunchdebt/dishes.functions';
import { saveMeal, scanBill } from '@/components/lunchdebt/meals.functions';
import { saigonToday } from '@/components/lunchdebt/ledger';
import { ConfirmAction } from '@/components/lunchdebt/confirm-action';
import { missingMealFields } from '@/components/lunchdebt/meal-validation';

export const Route = createFileRoute('/admin/meals/new')({ head: () => pageHead('Tạo bữa ăn', 'Tạo bữa ăn, quét hóa đơn bằng AI và đối soát tiền tự động với LunchDebt.'), component: NewMeal });

type Item = { key: string; name: string; price: number; member_ids: string[]; even?: boolean };
const MEAL_PRESETS = ['Cơm trưa văn phòng', 'Cơm tấm', 'Bún chả', 'Phở', 'Bún bò Huế', 'Lẩu', 'Trà sữa', 'Cà phê'];
const EVEN_NAME = 'Món chung (chia đều)';
const today = saigonToday;
const newKey = () => Math.random().toString(36).slice(2);
const dayLabel = (d: string) => { const [, m, day] = d.split('-'); return day && m ? `${day}/${m}` : d; };
const withDay = (p: string, d: string) => `${p} (${dayLabel(d)})`;
const lineTotal = (i: Item) => i.even ? i.price * i.member_ids.length : i.price;

function NewMeal() {
  const { userId, ready } = useMemberAuth();
  return <>
    <PageHeading title="Tạo bữa ăn mới" description="Quét hóa đơn, chia món và đối soát tiền." action={false}/>
    {!ready ? <Loader2 className="animate-spin"/> : userId ? <MealForm userId={userId}/> : <MemberSignIn/>}
  </>;
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * scale; c.height = img.height * scale;
      const context = c.getContext('2d');
      if (!context) { URL.revokeObjectURL(img.src); reject(new Error('Không thể đọc ảnh.')); return; }
      context.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function MealForm({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const membersQuery = useQuery({ queryKey: ['member-management', userId, 'list'], queryFn: () => listMembers() });
  const members = useMemo(() => (membersQuery.data?.members ?? []).filter(m => m.is_active), [membersQuery.data]);
  const dishesQuery = useQuery({ queryKey: ['dishes', userId], queryFn: () => listDishes() });
  const dishes = dishesQuery.data?.dishes ?? [];
  const presets = [...new Set([...MEAL_PRESETS, ...dishes.map(d => d.name)])].slice(0, 12);
  const [name, setName] = useState('');
  const [date, setDate] = useState(today());
  const [items, setItems] = useState<Item[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedRef = useRef(false);
  const dirty = !saved && Boolean(name || items.length || date !== today());
  const blocker = useBlocker({ shouldBlockFn: () => dirty && !savedRef.current, enableBeforeUnload: dirty, withResolver: true });
  const fileRef = useRef<HTMLInputElement>(null);

  const sum = items.reduce((s, i) => s + (lineTotal(i) || 0), 0);
  const hasEven = items.some(i => i.even);
  const changeDate = (d: string) => { const preset = presets.find(p => name === withDay(p, date)); setDate(d); if (preset) setName(withDay(preset, d)); };
  const totalNum = sum;
  const participants = [...new Set(items.flatMap(i => i.member_ids))];
  const missing = missingMealFields(name, date, totalNum, participants, items.map(i => i.even ? { ...i, name: EVEN_NAME } : i));
  const canSave = !missing.length && !saving && !scanning;
  const update = (key: string, patch: Partial<Item>) => setItems(list => list.map(i => i.key === key ? { ...i, ...patch } : i));

  async function onScan(file?: File) {
    if (!file) return;
    setScanning(true);
    try {
      const image = await readFile(file);
      const r = await scanBill({ data: { image } });
      setItems(list => [...list, ...r.items.map(i => ({ key: newKey(), name: i.name, price: i.price, member_ids: [] }))]);
      toast.success(`Đã đọc ${r.items.length} món từ hóa đơn`);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Không đọc được hóa đơn.'); }
    finally { setScanning(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function onSave() {
    setSaving(true);
    try {
      const saved = await saveMeal({ data: { name: name.trim(), eaten_on: date, total_amount: totalNum, participant_ids: participants, items: items.map(i => ({ name: i.even ? EVEN_NAME : i.name.trim(), price: lineTotal(i), member_ids: i.member_ids })) } });
      savedRef.current = true;
      setSaved(true);
      toast.success('Đã lưu bữa ăn');
      await queryClient.invalidateQueries({ queryKey: ['ledger', userId] });
      await queryClient.invalidateQueries({ queryKey: ['debts', userId] });
      await navigate({ to: '/admin/daily', search: { date, meal: saved.id } });
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Không thể lưu.'); }
    finally { setSaving(false); }
  }

   return <><ConfirmAction open={blocker.status === 'blocked'} title="Rời bữa ăn chưa lưu?" description="Nội dung đang nhập sẽ mất nếu bạn rời trang." confirmLabel="Rời trang" onCancel={() => blocker.reset?.()} onConfirm={() => blocker.proceed?.()}/><div className="meal-builder">
    <section className="meal-col">
      <div className="form-section">
        <h2 className="builder-title"><span>01</span>Thông tin bữa ăn</h2>
        <div className="grid gap-4">
          <div className="field">
            <label htmlFor="meal-name">Tên bữa ăn *</label>
            <input id="meal-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập tên hoặc chọn bên dưới" maxLength={120}/>
            <div role="radiogroup" aria-label="Tên có sẵn" className="flex flex-wrap gap-2 mt-1">{presets.map(p => <label key={p} className="meal-check cursor-pointer text-sm" data-selected={name === withDay(p, date)}><input type="radio" name="meal-preset" checked={name === withDay(p, date)} onChange={() => setName(withDay(p, date))}/>{p}</label>)}</div>
          </div>
          <label className="field">Ngày ăn<input type="date" value={date} onChange={e => changeDate(e.target.value)}/></label>
        </div>
      </div>
    </section>

    <section className="meal-col">
      <div className="form-section">
        <div className="dish-heading"><h2 className="builder-title"><span>02</span>Danh sách món <small>{items.length}</small></h2>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={e => onScan(e.target.files?.[0])}/>
          <Button className="h-12 w-full sm:w-auto" onClick={() => fileRef.current?.click()} disabled={scanning}>{scanning ? <Loader2 className="animate-spin"/> : <Camera/>}{scanning ? 'Đang đọc hóa đơn…' : 'Chụp hóa đơn'}</Button></div>
        <div className="grid gap-3">
           {items.length === 0 && <div className="dish-empty"><Utensils size={30}/><h3>Chưa có món ăn</h3></div>}
           {items.map(i => <div key={i.key} className="meal-item">
            {i.even ? <p className="text-sm font-medium">{EVEN_NAME}</p> : <input className="search-field" list="dish-suggestions" value={i.name} onChange={e => { const value = e.target.value; const match = dishes.find(d => d.name.toLowerCase() === value.trim().toLowerCase()); update(i.key, match && i.price === 0 && match.price > 0 ? { name: value, price: match.price } : { name: value }); }} placeholder="Tên món" aria-label="Tên món"/>}
            <label className="field">{i.even ? 'Giá mỗi người (nghìn đồng)' : 'Giá món (nghìn đồng)'}<input className="search-field" type="number" step="any" inputMode="decimal" value={i.price / 1000} onChange={e => update(i.key, { price: Math.round((Number(e.target.value) || 0) * 1000) })} aria-label="Giá món (nghìn đồng)"/><span className="text-xs text-muted-foreground">{i.even ? `${currency(i.price)} × ${i.member_ids.length} người = ${currency(lineTotal(i))}` : currency(i.price)}</span></label>
            <MemberPicker members={members} loading={membersQuery.isLoading} error={membersQuery.isError} onRetry={() => void membersQuery.refetch()} value={i.member_ids} onChange={ids => update(i.key, { member_ids: ids })}/>
            <div className="flex gap-2"><Button variant="secondary" className="h-12 flex-1" disabled={!i.even && items.length > 1} onClick={() => update(i.key, { even: !i.even })}>{i.even ? 'Nhập tên món' : 'Chia đều món này'}</Button><Button variant="ghost" className="h-12" aria-label="Xóa dòng" onClick={() => setItems(l => l.filter(x => x.key !== i.key))}><Trash2/></Button></div>
          </div>)}
          {hasEven ? <p className="text-xs text-muted-foreground">Đang chia đều — không thể thêm món thủ công. Bỏ chia đều để thêm món.</p> : <Button variant="outline" className="h-12" onClick={() => setItems(l => [...l, { key: newKey(), name: '', price: 0, member_ids: [] }])}><Plus/>Thêm món thủ công</Button>}
          {dishes.length > 0 && <datalist id="dish-suggestions">{dishes.map(d => <option key={d.id} value={d.name}/>)}</datalist>}
        </div>
      </div>

      <div className="form-section meal-reconciliation">
        <h2 className="builder-title"><ReceiptText size={19}/>Tổng kết</h2>
        <div className="flex justify-between text-sm"><span>Số món</span><strong>{items.length}</strong></div>
        <div className="flex justify-between mt-2"><span>Tổng bữa ăn</span><strong className="text-primary">{currency(sum)}</strong></div>
        {missing.length > 0 && <div className="mt-3 text-sm text-muted-foreground" aria-live="polite"><p className="font-medium">Còn thiếu:</p><ul className="list-disc pl-5 mt-2 space-y-1">{missing.map(field => <li key={field}>{field}</li>)}</ul></div>}
        <Button className="h-12 w-full mt-4" disabled={!canSave} onClick={onSave}>{saving ? <Loader2 className="animate-spin"/> : <Check/>}Lưu bữa ăn</Button>
      </div>
    </section>
  </div></>;
}

type Member = { id: string; name: string; nickname?: string | null };

function MemberPicker({ members, loading, error, onRetry, value, onChange }: { members: Member[]; loading: boolean; error: boolean; onRetry: () => void; value: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState('');
  const visible = members.filter(m => (m.name + ' ' + (m.nickname ?? '')).toLowerCase().includes(search.toLowerCase()));
  const toggle = (id: string, on: boolean) => onChange(on ? [...value, id] : value.filter(x => x !== id));
  return <Popover onOpenChange={open => { if (!open) setSearch(''); }}>
    <PopoverTrigger asChild><Button variant="outline" className="h-12 justify-start"><Users/>{value.length === 0 ? 'Chọn người ăn' : `${value.length} người`}</Button></PopoverTrigger>
    <PopoverContent className="member-picker-popover" align="start">
      {error ? <div role="alert" className="text-destructive text-sm"><p>Không tải được thành viên.</p><Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>Thử lại</Button></div>
      : loading ? <Loader2 className="animate-spin"/>
      : members.length === 0 ? <Button asChild variant="outline" size="sm"><Link to="/admin/members"><Plus/>Thêm thành viên</Link></Button>
      : <>
        <label className="member-search picker-search"><Search size={18}/><input aria-label="Tìm người ăn" placeholder="Tìm thành viên…" value={search} onChange={e => setSearch(e.target.value)}/></label>
        <div className="flex gap-2 mb-2"><Button size="sm" variant="outline" className="h-9 flex-1" onClick={() => onChange(members.map(m => m.id))}>Chọn tất cả</Button><Button size="sm" variant="ghost" className="h-9 flex-1" onClick={() => onChange([])}>Bỏ chọn</Button></div>
        <div className="max-h-64 overflow-auto grid gap-1">
          {visible.length === 0 ? <p className="text-sm text-muted-foreground">Không tìm thấy thành viên.</p>
          : visible.map(m => <label key={m.id} className="meal-check" data-selected={value.includes(m.id)}><input type="checkbox" checked={value.includes(m.id)} onChange={e => toggle(m.id, e.target.checked)}/><span className="avatar">{m.name.split(' ').slice(-2).map(s => s[0]).join('')}</span><span>{m.name}{m.nickname && <small>{m.nickname}</small>}</span></label>)}
        </div>
      </>}
    </PopoverContent>
  </Popover>;
}
