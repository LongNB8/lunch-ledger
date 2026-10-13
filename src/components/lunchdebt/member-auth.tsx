import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { LogIn, Loader2, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { loginEmail } from './login-identity';
import { recordLogin } from './logins.functions';
const MemberAuthContext = createContext<{ userId: string | null; ready: boolean }>({ userId: null, ready: false });
export function MemberAuthProvider({ children }: { children: ReactNode }) {
 const [state, setState] = useState({ userId: null as string | null, ready: false });
 const queryClient = useQueryClient();
 useEffect(() => {
  let alive = true;
  let identityEvent = false;
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
   if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
   if (event === 'SIGNED_IN' && session && typeof window !== 'undefined') {
    const key = 'ld-login-' + session.access_token.slice(-16);
    if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, '1'); const method = session.user.app_metadata?.provider === 'google' ? 'google' : 'password'; setTimeout(() => { recordLogin({ data: { method } }).catch(() => {}); }, 0); }
   }
   identityEvent = true;
   queryClient.removeQueries({ queryKey: ['member-management'] });
   if (alive) setState({ userId: session?.user.id ?? null, ready: true });
  });
  supabase.auth.getUser().then(({ data }) => { if (alive && !identityEvent) setState({ userId: data.user?.id ?? null, ready: true }); }).catch(() => { if (alive && !identityEvent) setState({ userId: null, ready: true }); });
  return () => { alive = false; subscription.unsubscribe(); };
 }, [queryClient]);
 return <MemberAuthContext.Provider value={state}>{children}</MemberAuthContext.Provider>;
}
export function useMemberAuth() { return useContext(MemberAuthContext); }
export function MemberSignIn() {
 const [pending, setPending] = useState(false);
 const [error, setError] = useState('');
 const [info, setInfo] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 async function login() {
  setPending(true); setError('');
  try {
   const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin + '/admin/members' });
   if (result.error) setError('Không thể đăng nhập. Vui lòng thử lại.');
  } catch { setError('Không thể đăng nhập. Vui lòng thử lại.'); }
  finally { setPending(false); }
 }
 async function passwordAuth(mode: 'in' | 'up') {
  setError(''); setInfo('');
  const resolvedEmail = loginEmail(email);
  if (mode === 'up' && email.trim().toLowerCase() === 'admin') { setError('Tên đăng nhập này dành cho tài khoản quản lý đã tạo sẵn.'); return; }
  if (!resolvedEmail.includes('@') || !password || (mode === 'up' && password.length < 8)) { setError(mode === 'up' ? 'Nhập email hợp lệ và mật khẩu từ 8 ký tự.' : 'Nhập email hoặc tên đăng nhập và mật khẩu.'); return; }
  setPending(true);
  try {
   if (mode === 'in') {
    const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
    if (error) setError('Thông tin đăng nhập không đúng hoặc tài khoản chưa được xác nhận.');
   } else {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/admin/members' } });
    if (error) setError(error.message);
    else if (!data.session) setInfo('Đã gửi email xác nhận. Mở email để kích hoạt tài khoản.');
   }
  } catch { setError('Không thể kết nối. Vui lòng thử lại.'); } finally { setPending(false); }
 }
  return <div className="member-signin"><div className="min-w-0 flex-1"><span className="member-eyebrow"><LogIn size={16}/>KHÔNG GIAN RIÊNG TƯ</span><h2>Chào mừng đến LunchDebt</h2><p>Đăng nhập để xem bữa ăn và sổ tiền của nhóm bạn.</p>
   <form className="signin-form" onSubmit={e => { e.preventDefault(); passwordAuth('in'); }}>
   <label className="field full">Email hoặc tên đăng nhập<input className="h-12 rounded-md border bg-background px-3" type="text" autoComplete="username" placeholder="Email hoặc tên đăng nhập" value={email} onChange={e => setEmail(e.target.value)} aria-label="Email hoặc tên đăng nhập" required/></label>
   <label className="field full">Mật khẩu<span className="password-field"><LockKeyhole size={17}/><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} onChange={e => setPassword(e.target.value)} aria-label="Mật khẩu" required/><Button type="button" variant="ghost" size="icon" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</Button></span></label>
   <Button type="submit" disabled={pending} className="h-12">{pending ? <Loader2 className="animate-spin"/> : <LogIn/>}Đăng nhập</Button>
   <Button type="button" variant="outline" disabled={pending} className="h-12" onClick={() => passwordAuth('up')}>Tạo tài khoản</Button>
  </form>
  {error && <p role="alert" className="text-destructive">{error}</p>}{info && <p role="status">{info}</p>}</div><Button onClick={login} disabled={pending} variant="outline" className="member-primary">{pending ? <Loader2 className="animate-spin"/> : <LogIn/>}Đăng nhập với Google</Button></div>;
}
