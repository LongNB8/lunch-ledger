import { useState, type FormEvent } from 'react';
import { Check, Loader2, Plus, Save, X } from 'lucide-react';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { addTeam } from './members.functions';
import { memberSchema, suggestTransferCode, teamSchema, type Member, type MemberInput, type Team } from './member-schema';
export function MemberForm({ member, members, teams, signedIn, onSave, onClose, onTeamCreated }: { member?: Member | undefined; members: Member[]; teams: Team[]; signedIn: boolean; onSave: (input: MemberInput) => Promise<void>; onClose: () => void; onTeamCreated: (team: Team) => Promise<void> }) {
 const [values, setValues] = useState<MemberInput>(member ?? { name: '', nickname: '', email: '', team_id: null, transfer_code: '', is_active: true });
 const [codeEdited, setCodeEdited] = useState(Boolean(member));
 const [errors, setErrors] = useState<Record<string,string>>({});
 const [busy, setBusy] = useState(false);
 const [teamMode, setTeamMode] = useState(false);
 const [teamName, setTeamName] = useState('');
 const [teamError, setTeamError] = useState('');
 const [teamBusy, setTeamBusy] = useState(false);
 const [newTeams, setNewTeams] = useState<Team[]>([]);
 const createTeam = useServerFn(addTeam);
 const allTeams = [...teams, ...newTeams.filter(t => !teams.some(existing => existing.id === t.id))];
 function field<K extends keyof MemberInput>(key: K, value: MemberInput[K]) { setValues(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '', form: '' })); }
 async function submit(event: FormEvent) {
  event.preventDefault();
  const parsed = memberSchema.safeParse({ ...values, email: values.email.trim() });
  if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return; }
  if (!signedIn) { setErrors({ form: 'Vui lòng đăng nhập trước khi lưu thành viên.' }); return; }
  if (members.some(m => m.id !== member?.id && m.transfer_code === parsed.data.transfer_code)) { setErrors({ transfer_code: 'Mã CK đã được sử dụng. Vui lòng chọn mã khác.' }); return; }
  setBusy(true); setErrors({});
  try { await onSave(parsed.data); } catch(error) { setErrors({ form: error instanceof Error ? error.message : 'Không thể lưu. Vui lòng thử lại.' }); } finally { setBusy(false); }
 }
 async function quickTeam() {
  const parsed = teamSchema.safeParse({ name: teamName });
  if (!parsed.success) { setTeamError(parsed.error.issues[0]?.message ?? 'Tên Team không hợp lệ.'); return; }
  if (!signedIn) { setTeamError('Vui lòng đăng nhập trước khi tạo Team.'); return; }
  setTeamBusy(true); setTeamError('');
  try { const team = await createTeam({ data: parsed.data }); setNewTeams(current => [...current, team]); field('team_id', team.id); setTeamMode(false); setTeamName(''); await onTeamCreated(team); }
  catch(error) { setTeamError(error instanceof Error ? error.message : 'Không thể tạo Team.'); }
  finally { setTeamBusy(false); }
 }
 const errorText = (key: string) => errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null;
 return <form onSubmit={submit} noValidate className="member-form"><div className="member-form-grid"><label className="field full">Tên đầy đủ <span className="sr-only">bắt buộc</span><input autoComplete="name" name="name" placeholder="Nguyễn Văn Nam" maxLength={100} value={values.name} aria-required="true" aria-invalid={Boolean(errors['name'])} onChange={event => { const name = event.target.value; field('name', name); if (!codeEdited) field('transfer_code', suggestTransferCode(name, members.filter(m => m.id !== member?.id).map(m => m.transfer_code))); }}/>{errorText('name')}</label><label className="field">Nickname<input name="nickname" placeholder="Tên thường gọi" maxLength={60} value={values.nickname} onChange={event => field('nickname', event.target.value)}/>{errorText('nickname')}</label><label className="field">Mã CK<input name="transfer_code" placeholder="NAM" maxLength={32} value={values.transfer_code} aria-invalid={Boolean(errors['transfer_code'])} onChange={event => { setCodeEdited(true); field('transfer_code', event.target.value.toUpperCase()); }}/>{errorText('transfer_code')}</label><label className="field full">Email<input name="email" type="email" autoComplete="email" placeholder="nam@example.com" maxLength={254} value={values.email} aria-invalid={Boolean(errors['email'])} onChange={event => field('email', event.target.value)}/>{errorText('email')}</label><div className="field full"><label htmlFor="member-team">Team</label><div className="team-picker"><select id="member-team" value={values.team_id ?? ''} onChange={event => field('team_id', event.target.value || null)}><option value="">Chưa chọn Team</option>{allTeams.map(team => <option value={team.id} key={team.id}>{team.name}</option>)}</select><Button type="button" variant="outline" aria-label="Tạo Team mới" title="Tạo Team mới" className="member-icon-action" onClick={() => { setTeamMode(!teamMode); setTeamError(''); }}>{teamMode ? <X/> : <Plus/>}</Button></div>{errorText('team_id')}{teamMode && <div className="quick-team-form"><label className="sr-only" htmlFor="new-team">Tên Team mới</label><input id="new-team" placeholder="Tên Team mới" maxLength={100} value={teamName} onChange={event => setTeamName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void quickTeam(); } }}/><Button type="button" aria-label="Lưu Team mới" title="Lưu Team mới" className="member-icon-action" disabled={teamBusy} onClick={quickTeam}>{teamBusy ? <Loader2 className="animate-spin"/> : <Check/>}</Button>{teamError && <span className="field-error full" role="alert">{teamError}</span>}</div>}</div></div><div className="member-active-field"><label htmlFor="member-active">Đang hoạt động</label><Switch id="member-active" checked={values.is_active} onCheckedChange={value => field('is_active', value)}/></div>{errors['form'] && <div className="member-error" role="alert">{errors['form']}</div>}<div className="member-form-footer"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Hủy</Button><Button type="submit" className="member-primary" disabled={busy || teamBusy}>{busy ? <Loader2 className="animate-spin"/> : <Save/>}{member ? 'Lưu thay đổi' : 'Thêm thành viên'}</Button></div></form>;
}
