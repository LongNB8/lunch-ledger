import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

function parseAgent(ua: string) {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Khác';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Khác';
  const device = /iPad|Tablet/.test(ua) ? 'Máy tính bảng' : /Mobi|iPhone|Android/.test(ua) ? 'Điện thoại' : 'Máy tính';
  return { browser, os, device };
}

export const recordLogin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ method: z.enum(['password', 'google']) }))
  .handler(async ({ data, context }) => {
    const ua = (getRequestHeader('user-agent') ?? '').slice(0, 400);
    const ip = (getRequestHeader('cf-connecting-ip') ?? getRequestHeader('x-forwarded-for')?.split(',')[0] ?? '').trim();
    const country = getRequestHeader('cf-ipcountry') ?? '';
    const email = String((context.claims as { email?: string }).email ?? '');
    const { error } = await context.supabase.from('login_history').insert({ user_id: context.userId, email, method: data.method, ip_address: ip, user_agent: ua, country, ...parseAgent(ua) });
    if (error) throw new Error('Không thể ghi lịch sử đăng nhập.');
    return { ok: true };
  });

export const listLogins = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from('login_history').select('id,email,method,ip_address,browser,os,device,country,logged_in_at').order('logged_in_at', { ascending: false }).limit(200);
  if (error) throw new Error('Không thể tải lịch sử đăng nhập.');
  return { logins: data ?? [] };
});
