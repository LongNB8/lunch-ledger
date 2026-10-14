import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { currency } from './data';
import { updateMealItems } from './meals.functions';
import { PricePresets } from './price-presets';

type EditItem = { id: string; name: string; price: number; member_ids: string[] };

export function MealEditDialog({ userId, meal, items, memberName }: { userId: string; meal: { id: string; name: string }; items: EditItem[]; memberName: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(meal.name);
  const [rows, setRows] = useState(items);
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = useServerFn(updateMealItems);
  const total = rows.reduce((s, r) => s + r.price, 0);
  const invalid = !name.trim() || total <= 0 || rows.some(r => !r.name.trim());
  const set = (id: string, patch: Partial<EditItem>) => setRows(l => l.map(r => r.id === id ? { ...r, ...patch } : r));
  async function submit() {
    setSaving(true);
    try {
      await save({ data: { meal_id: meal.id, name: name.trim(), items: rows.map(r => ({ id: r.id, name: r.name.trim(), price: r.price })) } });
      await Promise.all([qc.invalidateQueries({ queryKey: ['ledger', userId] }), qc.invalidateQueries({ queryKey: ['debts', userId] })]);
      toast.success('Đã cập nhật bữa ăn, công nợ được tính lại');
      setOpen(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Không thể lưu.'); } finally { setSaving(false); }
  }
  return <>
    <Button variant="outline" className="h-11" onClick={() => { setName(meal.name); setRows(items); setOpen(true); }}><Pencil/>Sửa giá tiền</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="meal-edit-dialog">
        <DialogHeader><DialogTitle>Sửa bữa ăn</DialogTitle><DialogDescription>Chỉnh tên hoặc giá từng món. Tổng bữa và công nợ sẽ tự tính lại.</DialogDescription></DialogHeader>
        <div className="meal-edit-body">
          <label className="field">Tên bữa ăn<input value={name} maxLength={120} onChange={e => setName(e.target.value)}/></label>
          {rows.map(r => <div key={r.id} className="meal-item">
            <input className="search-field" aria-label="Tên món" value={r.name} maxLength={120} onChange={e => set(r.id, { name: e.target.value })}/>
            <p className="text-xs text-muted-foreground">{r.member_ids.map(memberName).join(', ')}</p>
            <label className="field">Thành tiền (nghìn đồng)<input className="search-field" type="number" step="any" inputMode="decimal" value={r.price / 1000} onChange={e => set(r.id, { price: Math.round((Number(e.target.value) || 0) * 1000) })}/><span className="text-xs text-muted-foreground">{currency(r.price)}{r.member_ids.length > 1 ? ` · ${currency(r.price / r.member_ids.length)} / người` : ''}</span></label>
            {r.member_ids.length === 1 && <PricePresets value={r.price} onChange={price => set(r.id, { price })}/>}
          </div>)}
        </div>
        <DialogFooter className="meal-edit-footer"><span>Tổng mới: <strong>{currency(total)}</strong></span><Button className="h-11" disabled={invalid || saving} onClick={submit}>{saving ? <Loader2 className="animate-spin"/> : <Save/>}Lưu thay đổi</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
