const DEFAULT_ADMIN_EMAIL = 'long17000547@gmail.com';
const vnd = (n: number) => `${Math.round(n).toLocaleString('vi-VN')} đ`;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const vnDate = (d: string) => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };

type Debtor = { name: string; nickname: string; consumed: number; paid: number; remaining: number; lines: { date: string; meal: string; item: string; share: number }[] };

async function collectDebts(ownerId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const [members, meals, items, payments] = await Promise.all([
    supabaseAdmin.from('members').select('id,name,nickname').eq('owner_id', ownerId),
    supabaseAdmin.from('meals').select('id,name,eaten_on').eq('owner_id', ownerId),
    supabaseAdmin.from('meal_items').select('meal_id,name,price,member_ids').eq('owner_id', ownerId),
    supabaseAdmin.from('payments').select('member_id,amount').eq('owner_id', ownerId),
  ]);
  if (members.error || meals.error || items.error || payments.error) throw new Error('Không đọc được dữ liệu công nợ.');
  const mealById = new Map((meals.data ?? []).map(m => [m.id, m]));
  const debtors: Debtor[] = [];
  for (const m of members.data ?? []) {
    const lines = (items.data ?? []).filter(i => i.member_ids.includes(m.id)).map(i => {
      const meal = mealById.get(i.meal_id);
      return { date: meal?.eaten_on ?? '', meal: meal?.name ?? '', item: i.name, share: i.price / new Set(i.member_ids).size };
    }).sort((a, b) => b.date.localeCompare(a.date));
    const consumed = lines.reduce((s, l) => s + l.share, 0);
    const paid = (payments.data ?? []).filter(p => p.member_id === m.id).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.round(consumed - paid);
    if (remaining > 0) debtors.push({ name: m.name, nickname: m.nickname, consumed, paid, remaining, lines: lines.slice(0, 30) });
  }
  return debtors.sort((a, b) => b.remaining - a.remaining);
}

function renderEmail(debtors: Debtor[], total: number) {
  const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const th = 'style="text-align:left;padding:10px;background:#0f766e;color:#fff;font-size:13px"';
  const td = 'style="padding:9px 10px;border-bottom:1px solid #e5e7eb;font-size:13px"';
  const tdr = 'style="padding:9px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right"';
  const summary = debtors.map((d, i) => `<tr><td ${td}>${i + 1}</td><td ${td}><b>${esc(d.name)}</b>${d.nickname ? ` <span style="color:#6b7280">(${esc(d.nickname)})</span>` : ''}</td><td ${tdr}>${vnd(d.consumed)}</td><td ${tdr}>${vnd(d.paid)}</td><td ${tdr}><b style="color:#b91c1c">${vnd(d.remaining)}</b></td></tr>`).join('');
  const details = debtors.map(d => `<h3 style="margin:24px 0 8px;font-size:15px;color:#0f172a">${esc(d.name)} — còn nợ <span style="color:#b91c1c">${vnd(d.remaining)}</span></h3><table style="width:100%;border-collapse:collapse"><tr><th ${th}>Ngày</th><th ${th}>Bữa ăn</th><th ${th}>Món</th><th ${th} align="right">Phần tiền</th></tr>${d.lines.map(l => `<tr><td ${td}>${l.date ? vnDate(l.date) : ''}</td><td ${td}>${esc(l.meal)}</td><td ${td}>${esc(l.item)}</td><td ${tdr}>${vnd(l.share)}</td></tr>`).join('')}</table>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:760px;margin:auto;color:#0f172a"><div style="background:#0f766e;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0"><div style="font-size:12px;opacity:.85">LUNCHDEBT · BÁO CÁO TỰ ĐỘNG</div><h1 style="margin:6px 0 0;font-size:22px">Công nợ tiền ăn chưa thanh toán</h1></div><div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 10px 10px"><p style="margin:0 0 16px">Cập nhật lúc <b>${now}</b>. Có <b>${debtors.length}</b> thành viên còn nợ, tổng cộng <b style="color:#b91c1c">${vnd(total)}</b>.</p>${debtors.length ? `<table style="width:100%;border-collapse:collapse"><tr><th ${th}>#</th><th ${th}>Thành viên</th><th ${th} align="right">Đã ăn</th><th ${th} align="right">Đã trả</th><th ${th} align="right">Còn nợ</th></tr>${summary}<tr><td ${td} colspan="4"><b>Tổng cộng</b></td><td ${tdr}><b style="color:#b91c1c">${vnd(total)}</b></td></tr></table><h2 style="margin:28px 0 0;font-size:17px">Chi tiết theo thành viên</h2><p style="margin:4px 0 0;color:#6b7280;font-size:12px">Tối đa 30 món gần nhất cho mỗi người.</p>${details}` : '<p>🎉 Không còn ai nợ tiền ăn.</p>'}<p style="margin-top:28px;color:#6b7280;font-size:12px">Email được gửi tự động từ LunchDebt.</p></div></div>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const user = process.env['EMAIL_USER'];
  const pass = process.env['EMAIL_PASSWORD'];
  if (!user || !pass) throw new Error('Chưa cấu hình tài khoản gửi email.');
  const nodemailer = (await import('nodemailer')).default;
  const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass: pass.replace(/\s+/g, '') } });
  await transport.sendMail({ from: `LunchDebt <${user}>`, to, subject, html });
}

export async function runDebtReport(jobId: string, trigger: 'manual' | 'schedule') {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const job = await supabaseAdmin.from('batch_jobs').select('id,owner_id,is_active').eq('id', jobId).single();
  if (job.error) throw new Error('Không tìm thấy batch.');
  if (trigger === 'schedule' && !job.data.is_active) return { status: 'skipped' as const };
  const recipient = process.env['REPORT_ADMIN_EMAIL'] || DEFAULT_ADMIN_EMAIL;
  const run = await supabaseAdmin.from('batch_job_runs').insert({ job_id: jobId, owner_id: job.data.owner_id, trigger_type: trigger, recipient }).select('id').single();
  if (run.error) throw new Error('Không ghi được lịch sử chạy.');
  try {
    const debtors = await collectDebts(job.data.owner_id);
    const total = debtors.reduce((s, d) => s + d.remaining, 0);
    const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    await sendMail(recipient, `[LunchDebt] Công nợ tiền ăn ${today}: ${debtors.length} người · ${vnd(total)}`, renderEmail(debtors, total));
    await supabaseAdmin.from('batch_job_runs').update({ status: 'success', debtor_count: debtors.length, total_debt: total, message: `Đã gửi email tới ${recipient}`, finished_at: new Date().toISOString() }).eq('id', run.data.id);
    await supabaseAdmin.from('batch_jobs').update({ last_run_at: new Date().toISOString() }).eq('id', jobId);
    return { status: 'success' as const, debtors: debtors.length, total };
  } catch (e) {
    const message = (e instanceof Error ? e.message : 'Lỗi không xác định').slice(0, 500);
    console.error('debt report failed', message);
    await supabaseAdmin.from('batch_job_runs').update({ status: 'failed', message, finished_at: new Date().toISOString() }).eq('id', run.data.id);
    return { status: 'failed' as const, message };
  }
}

export async function verifyBatchToken(token: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const { data } = await supabaseAdmin.from('batch_runtime_secrets').select('token').eq('id', 1).maybeSingle();
  if (!data?.token || data.token.length !== token.length) return false;
  const { timingSafeEqual } = await import('node:crypto');
  return timingSafeEqual(Buffer.from(data.token), Buffer.from(token));
}
