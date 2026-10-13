import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const itemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.number().int().min(-100_000_000).max(100_000_000),
  member_ids: z.array(z.string().uuid()).max(200),
});
export const mealSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên bữa ăn').max(120),
  eaten_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.number().int().min(1).max(1_000_000_000),
  participant_ids: z.array(z.string().uuid()).min(1).max(200),
  items: z.array(itemSchema).min(1).max(200),
});

export const saveMeal = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(mealSchema).handler(async ({ data, context }) => {
  const sum = data.items.reduce((s, i) => s + i.price, 0);
  if (sum !== data.total_amount) throw new Error('Tổng các món chưa khớp với tổng hóa đơn.');
  const allowed = new Set(data.participant_ids);
  if (data.items.some(i => i.member_ids.length === 0 || i.member_ids.some(id => !allowed.has(id)))) throw new Error('Mỗi món cần ít nhất một người ăn trong danh sách tham gia.');
  const owned = await context.supabase.from('members').select('id').in('id', data.participant_ids);
  if (owned.error || (owned.data?.length ?? 0) !== allowed.size) throw new Error('Có thành viên không hợp lệ.');
  const meal = await context.supabase.from('meals').insert({ name: data.name, eaten_on: data.eaten_on, total_amount: data.total_amount, participant_ids: data.participant_ids, owner_id: context.userId }).select('id').single();
  if (meal.error) throw new Error('Không thể lưu bữa ăn. Vui lòng thử lại.');
  const items = await context.supabase.from('meal_items').insert(data.items.map((i, position) => ({ ...i, position, meal_id: meal.data.id, owner_id: context.userId })));
  if (items.error) {
    await context.supabase.from('meals').delete().eq('id', meal.data.id);
    throw new Error('Không thể lưu danh sách món. Vui lòng thử lại.');
  }
  return { id: meal.data.id };
});

export const scanBill = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ image: z.string().regex(/^data:image\/(png|jpe?g|webp|heic|heif);base64,/).max(12_000_000) }))
  .handler(async ({ data }) => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) throw new Error('Chưa cấu hình dịch vụ AI.');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash',
        stream: true,
        response_format: { type: 'json_schema', json_schema: { name: 'bill', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['items', 'total'],
          properties: {
            total: { type: ['integer', 'null'] },
            items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'price'], properties: { name: { type: 'string' }, price: { type: 'integer' } } } },
          },
        } } },
        messages: [
          { role: 'system', content: 'Bạn đọc hóa đơn nhà hàng Việt Nam. Trả JSON: items là từng món (name, price = thành tiền của dòng đó tính bằng VNĐ, số nguyên, đã nhân số lượng), total = tổng tiền phải thanh toán cuối hóa đơn (VNĐ) hoặc null. Không đưa dòng tổng/thuế/giảm giá vào items.' },
          { role: 'user', content: [{ type: 'text', text: 'Bóc tách hóa đơn này.' }, { type: 'image_url', image_url: { url: data.image } }] },
        ],
      }),
    });
    if (res.status === 429) throw new Error('Hệ thống AI đang bận, thử lại sau ít phút.');
    if (res.status === 402) throw new Error('Đã hết hạn mức AI của workspace.');
    if (!res.ok || !res.body) throw new Error('Không đọc được hóa đơn. Vui lòng thử lại.');
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:') || t === 'data: [DONE]') continue;
        try { text += JSON.parse(t.slice(5)).choices?.[0]?.delta?.content ?? ''; } catch { /* partial */ }
      }
    }
    try {
      const parsed = z.object({ total: z.number().nullable(), items: z.array(z.object({ name: z.string(), price: z.number() })) }).parse(JSON.parse(text.replace(/^```json|```$/g, '').trim()));
      return { total: parsed.total == null ? null : Math.round(parsed.total), items: parsed.items.map(i => ({ name: i.name.slice(0, 120) || 'Món', price: Math.round(i.price) })) };
    } catch { throw new Error('Không đọc được hóa đơn. Hãy chụp rõ hơn.'); }
  });
