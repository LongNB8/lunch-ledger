import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useState, type FormEvent } from 'react';
import { useSuspenseQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, Pencil, Plus, Save, Search, Trash2, Utensils, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pageHead, currency } from '@/components/lunchdebt/data';
import { MemberPanel } from '@/components/lunchdebt/member-panel';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { ConfirmAction } from '@/components/lunchdebt/confirm-action';
import { dishSchema, type Dish, type DishInput } from '@/components/lunchdebt/dish-schema';
import { listDishes, saveDish, deleteDish } from '@/components/lunchdebt/dishes.functions';
import { normalizeSearch } from '@/components/lunchdebt/member-schema';

export const Route = createFileRoute('/admin/dishes')({ head: () => pageHead('Quản lý món ăn', 'Quản lý danh sách món hay gọi cùng giá thường dùng, để tạo bữa ăn nhanh hơn trên LunchDebt.'), component: Dishes });

function Dishes() {
  const { userId, ready } = useMemberAuth();
  if (!ready) return <div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải món ăn…</div>;
  if (!userId) return <><MemberSignIn/><DishView dishes={[]} signedIn={false}/></>;
  return <Suspense fallback={<div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải món ăn…</div>}><SavedDishes userId={userId}/></Suspense>;
}

function SavedDishes({ userId }: { userId: string }) {
  const fetchDishes = useServerFn(listDishes);
  const query = queryOptions({ queryKey: ['dishes', userId], queryFn: () => fetchDishes() });
  const { data } = useSuspenseQuery(query);
  return <DishView dishes={data.dishes} signedIn/>;
}

function DishView({ dishes, signedIn }: { dishes: Dish[]; signedIn: boolean }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish>();
  const [deleting, setDeleting] = useState<Dish>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const queryClient = useQueryClient();
  const save = useServerFn(saveDish);
  const remove = useServerFn(deleteDish);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['dishes'] });
  const term = normalizeSearch(search.trim());
  const filtered = dishes.filter(dish => normalizeSearch(dish.name).includes(term));
  const price = (dish: Dish) => dish.price > 0 ? currency(dish.price) : '—';
  async function onSave(values: DishInput) { await save({ data: values }); await refresh(); setOpen(false); setNotice(editing ? 'Đã cập nhật món ăn.' : 'Đã thêm món ăn.'); }
  async function confirmDelete() { if (!deleting) return; setBusy(true); setError(''); try { await remove({ data: { id: deleting.id } }); await refresh(); setDeleting(undefined); setNotice('Đã xóa món ăn.'); } catch (e) { setError(e instanceof Error ? e.message : 'Không thể xóa món ăn.'); } finally { setBusy(false); } }
  function startEdit(dish?: Dish) { setEditing(dish); setOpen(true); setNotice(''); }
  function actions(dish: Dish) { return <div className="member-actions"><Button variant="ghost" className="member-icon-action" aria-label={`Sửa ${dish.name}`} title="Sửa món ăn" onClick={() => startEdit(dish)}><Pencil/></Button><Button variant="ghost" className="member-icon-action text-destructive" aria-label={`Xóa ${dish.name}`} title="Xóa món ăn" onClick={() => { setDeleting(dish); setError(''); }}><Trash2/></Button></div>; }
  return <>
    <div className="member-page-heading">
      <div className="min-w-0">
        <span className="member-eyebrow"><Utensils size={14}/>DANH MỤC MÓN ĂN</span>
        <h1>Quản lý món ăn</h1>
        <p>Lưu sẵn món hay gọi để tạo bữa ăn chỉ với vài nhấp.</p>
      </div>
      <Button className="member-primary" onClick={() => startEdit()}><Plus/>Thêm món ăn</Button>
    </div>
    <div className="member-overview"><span><strong>{dishes.length}</strong> món ăn</span><span><span className="member-dot"/><strong>{dishes.filter(d => d.price > 0).length}</strong> đã có giá hay gọi</span></div>
    <div className="member-toolbar">
      <div className="member-search"><Search size={18}/><input aria-label="Tìm món ăn" placeholder="Tìm món ăn…" maxLength={120} value={search} onChange={event => setSearch(event.target.value)}/>{search && <Button variant="ghost" size="icon" aria-label="Xóa tìm kiếm" onClick={() => setSearch('')}><X/></Button>}</div>
    </div>
    {notice && <p className="member-success" role="status">{notice}</p>}
    {error && !deleting && <p className="member-error" role="alert">{error}</p>}
    <div className="member-desktop data-table-wrap">
      <table className="data-table member-table">
        <thead><tr><th>Tên món</th><th>Giá hay gọi</th><th>Thao tác</th></tr></thead>
        <tbody>{filtered.map(dish => <tr key={dish.id}><td>{dish.name}</td><td>{price(dish)}</td><td>{actions(dish)}</td></tr>)}</tbody>
      </table>
    </div>
    <div className="member-mobile-list">
      {filtered.map(dish => <article className="member-mobile-card" key={dish.id}>
        <div className="member-card-top"><div className="min-w-0"><h2>{dish.name}</h2><p>{dish.price > 0 ? `Hay gọi ${dish.price / 1000}k` : 'Chưa ghi giá'}</p></div>{actions(dish)}</div>
        <div className="member-card-bottom"><span className="pill neutral member-team-label">{price(dish)}</span></div>
      </article>)}
    </div>
    {filtered.length === 0 && <div className="member-empty">
      <span className="member-empty-icon"><Utensils size={26}/></span>
      <h2>{dishes.length ? 'Không tìm thấy món ăn' : 'Chưa có món ăn nào'}</h2>
      <p>{dishes.length ? 'Không có tên món phù hợp.' : 'Thêm món hay gọi để tạo bữa ăn nhanh hơn.'}</p>
      <Button variant="outline" className="member-primary" onClick={() => dishes.length ? setSearch('') : startEdit()}>{dishes.length ? 'Xóa bộ lọc' : <><Plus/>Thêm món đầu tiên</>}</Button>
    </div>}
    <p className="member-count">Hiển thị {filtered.length} / {dishes.length} món ăn</p>
    <MemberPanel open={open} onOpenChange={value => setOpen(value)} title={editing ? 'Sửa món ăn' : 'Thêm món ăn'} description="Tên món và giá hay gọi của món.">
      <DishForm key={editing?.id ?? 'new'} dish={editing} dishes={dishes} signedIn={signedIn} onSave={onSave} onClose={() => setOpen(false)}/>
    </MemberPanel>
    <ConfirmAction open={Boolean(deleting)} title="Xóa món ăn?" description={`Món "${deleting?.name ?? ''}" sẽ bị bỏ khỏi danh sách gợi ý. Các bữa ăn đã lưu không bị thay đổi.`} confirmLabel="Xóa món ăn" onCancel={() => setDeleting(undefined)} onConfirm={confirmDelete}/>
  </>;
}

function DishForm({ dish, dishes, signedIn, onSave, onClose }: { dish?: Dish | undefined; dishes: Dish[]; signedIn: boolean; onSave: (input: DishInput) => Promise<void>; onClose: () => void }) {
  const [values, setValues] = useState<DishInput>(dish ?? { name: '', price: 0 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  function field<K extends keyof DishInput>(key: K, value: DishInput[K]) { setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '', form: '' })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = dishSchema.safeParse({ ...values, name: values.name.trim() });
    if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return; }
    if (!signedIn) { setErrors({ form: 'Vui lòng đăng nhập trước khi lưu món ăn.' }); return; }
    if (dishes.some(d => d.id !== dish?.id && d.name.toLowerCase() === parsed.data.name.toLowerCase())) { setErrors({ name: 'Món này đã có trong danh sách.' }); return; }
    setBusy(true); setErrors({});
    try { await onSave(parsed.data); } catch (e) { setErrors({ form: e instanceof Error ? e.message : 'Không thể lưu. Vui lòng thử lại.' }); } finally { setBusy(false); }
  }
  const errorText = (key: string) => errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null;
  return <form onSubmit={submit} noValidate className="member-form">
    <div className="member-form-grid">
      <label className="field full">Tên món <span className="sr-only">bắt buộc</span><input name="name" placeholder="Cơm tấm, bún chả…" maxLength={120} value={values.name} aria-required="true" aria-invalid={Boolean(errors['name'])} onChange={event => field('name', event.target.value)}/>{errorText('name')}</label>
      <label className="field full">Giá hay gọi (nghìn đồng)<input name="price" type="number" step="any" inputMode="decimal" min={0} placeholder="0" value={values.price / 1000} onChange={event => field('price', Math.round((Number(event.target.value) || 0) * 1000))}/><span className="text-xs text-muted-foreground">{values.price > 0 ? currency(values.price) : 'Chưa rõ giá'}</span>{errorText('price')}</label>
    </div>
    {errors['form'] && <div className="member-error" role="alert">{errors['form']}</div>}
    <div className="member-form-footer">
      <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
      <Button type="submit" className="member-primary" disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}{dish ? 'Lưu thay đổi' : 'Thêm món ăn'}</Button>
    </div>
  </form>;
}
