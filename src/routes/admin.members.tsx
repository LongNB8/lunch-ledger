import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useState } from 'react';
import { useSuspenseQuery, useQueryClient, queryOptions } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Loader2, Mail, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { pageHead } from '@/components/lunchdebt/data';
import { MemberPanel } from '@/components/lunchdebt/member-panel';
import { MemberForm } from '@/components/lunchdebt/member-form';
import { MemberSignIn, useMemberAuth } from '@/components/lunchdebt/member-auth';
import { filterMembers, type Member, type MemberInput, type Team } from '@/components/lunchdebt/member-schema';
import { listMembers, saveMember, deleteMember, setMemberActive } from '@/components/lunchdebt/members.functions';
export const Route = createFileRoute('/admin/members')({ head: () => pageHead('Quản lý thành viên', 'Quản lý thành viên, Team, email, mã chuyển khoản và trạng thái hoạt động trên LunchDebt.'), component: Members });
function Members() {
 const { userId, ready } = useMemberAuth();
 if (!ready) return <div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải thành viên…</div>;
 if (!userId) return <><MemberSignIn/><MemberView members={[]} teams={[]} signedIn={false}/></>;
 return <Suspense fallback={<div className="member-loading" role="status"><Loader2 className="animate-spin"/>Đang tải thành viên…</div>}><SavedMembers userId={userId}/></Suspense>;
}
function SavedMembers({ userId }: { userId: string }) {
 const fetchMembers = useServerFn(listMembers);
 const query = queryOptions({ queryKey: ['member-management',userId], queryFn: () => fetchMembers() });
 const { data } = useSuspenseQuery(query);
 return <MemberView members={data.members} teams={data.teams} signedIn/>;
}
function MemberView({ members, teams, signedIn }: { members: Member[]; teams: Team[]; signedIn: boolean }) {
 const [search, setSearch] = useState('');
 const [teamFilter, setTeamFilter] = useState('all');
 const [open, setOpen] = useState(false);
 const [editing, setEditing] = useState<Member>();
 const [deleting, setDeleting] = useState<Member>();
 const [busyId, setBusyId] = useState('');
 const [deleteBusy, setDeleteBusy] = useState(false);
 const [error, setError] = useState('');
 const [notice, setNotice] = useState('');
 const queryClient = useQueryClient();
 const save = useServerFn(saveMember);
 const remove = useServerFn(deleteMember);
 const active = useServerFn(setMemberActive);
 const refresh = () => queryClient.invalidateQueries({ queryKey: ['member-management'] });
 const filtered = filterMembers(members, search).filter(member => teamFilter === 'all' || (member.team_id ?? 'none') === teamFilter);
 const teamName = (id: string | null) => teams.find(t => t.id === id)?.name ?? 'Chưa có Team';
 async function onSave(values: MemberInput) { await save({ data: values }); await refresh(); setOpen(false); setNotice(editing ? 'Đã cập nhật thành viên.' : 'Đã thêm thành viên.'); }
 async function toggle(member: Member, value: boolean) { setBusyId(member.id); setError(''); try { await active({ data: { id: member.id, is_active: value } }); await refresh(); setNotice('Đã cập nhật trạng thái thành viên.'); } catch(e) { setError(e instanceof Error ? e.message : 'Không thể đổi trạng thái.'); } finally { setBusyId(''); } }
 async function confirmDelete() { if (!deleting) return; setDeleteBusy(true); setError(''); try { await remove({ data: { id: deleting.id } }); await refresh(); setDeleting(undefined); setNotice('Đã xóa thành viên.'); } catch(e) { setError(e instanceof Error ? e.message : 'Không thể xóa thành viên.'); } finally { setDeleteBusy(false); } }
 function startEdit(member?: Member) { setEditing(member); setOpen(true); setNotice(''); }
 function actions(member: Member) { return <div className="member-actions"><Button variant="ghost" className="member-icon-action" aria-label={`Sửa ${member.name}`} title="Sửa thành viên" onClick={() => startEdit(member)}><Pencil/></Button><Button variant="ghost" className="member-icon-action text-destructive" aria-label={`Xóa ${member.name}`} title="Xóa thành viên" onClick={() => { setDeleting(member); setError(''); }}><Trash2/></Button></div>; }
 function status(member: Member) { return <div className="member-status"><Switch checked={member.is_active} disabled={busyId === member.id} aria-label={`Hoạt động ${member.name}`} onCheckedChange={value => void toggle(member,value)}/><span className={member.is_active ? 'text-primary' : 'text-muted-foreground'}>{member.is_active ? 'Hoạt động' : 'Tạm ngưng'}</span></div>; }
 return <><div className="member-page-heading"><div className="min-w-0"><span className="member-eyebrow"><Users size={14}/>TEAM & THÀNH VIÊN</span><h1>Quản lý thành viên</h1><p>Mỗi thành viên, một kết nối trong nhóm.</p></div><Button className="member-primary" onClick={() => startEdit()}><Plus/>Thêm thành viên</Button></div><div className="member-overview"><span><strong>{members.length}</strong> thành viên</span><span><span className="member-dot"/><strong>{members.filter(m => m.is_active).length}</strong> đang hoạt động</span><span><strong>{teams.length}</strong> Team</span></div><div className="member-toolbar"><div className="member-search"><Search size={18}/><input aria-label="Tìm theo tên hoặc email" placeholder="Tìm theo tên hoặc email…" maxLength={254} value={search} onChange={event => setSearch(event.target.value)}/>{search && <Button variant="ghost" size="icon" aria-label="Xóa tìm kiếm" onClick={() => setSearch('')}><X/></Button>}</div><select aria-label="Lọc Team" value={teamFilter} onChange={event => setTeamFilter(event.target.value)}><option value="all">Tất cả Team</option><option value="none">Chưa có Team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>{notice && <p className="member-success" role="status">{notice}</p>}{error && !deleting && <p className="member-error" role="alert">{error}</p>}<div className="member-desktop data-table-wrap"><table className="data-table member-table"><thead><tr><th>Tên</th><th>Nickname</th><th>Email</th><th>Team</th><th>Mã CK</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{filtered.map(member => <tr key={member.id}><td><span className="flex items-center gap-3"><span className="avatar">{member.name.split(/\s+/).slice(-2).map(n => n[0]).join('')}</span><span className="member-cell-text">{member.name}</span></span></td><td><span className="member-cell-text text-muted-foreground">{member.nickname || '—'}</span></td><td><span className="member-cell-email">{member.email || '—'}</span></td><td><span className="pill neutral member-team-label">{teamName(member.team_id)}</span></td><td><code className="member-code">{member.transfer_code}</code></td><td>{status(member)}</td><td>{actions(member)}</td></tr>)}</tbody></table></div><div className="member-mobile-list">{filtered.map(member => <article className="member-mobile-card" key={member.id}><div className="member-card-top"><div className="flex min-w-0 items-center gap-3"><span className="avatar">{member.name.split(/\s+/).slice(-2).map(n => n[0]).join('')}</span><div className="min-w-0"><h2>{member.name}</h2><p>{member.nickname || 'Thành viên'}</p></div></div>{actions(member)}</div><div className="member-card-email"><Mail size={14}/><span>{member.email || 'Chưa có email'}</span></div><div className="member-card-bottom"><span className="pill neutral member-team-label">{teamName(member.team_id)}</span><code className="member-code">{member.transfer_code}</code></div><div className="member-mobile-status">{status(member)}</div></article>)}</div>{filtered.length === 0 && <div className="member-empty"><span className="member-empty-icon"><Users size={26}/></span><h2>{members.length ? 'Không tìm thấy thành viên' : 'Chưa có thành viên'}</h2><p>{members.length ? 'Không có tên hoặc email phù hợp.' : 'Những người bạn cùng bàn sẽ xuất hiện ở đây.'}</p><Button variant="outline" className="member-primary" onClick={() => members.length ? (setSearch(''), setTeamFilter('all')) : startEdit()}>{members.length ? 'Xóa bộ lọc' : <><Plus/>Thêm thành viên đầu tiên</>}</Button></div>}<p className="member-count">Hiển thị {filtered.length} / {members.length} thành viên</p><MemberPanel open={open} onOpenChange={value => setOpen(value)} title={editing ? 'Sửa thành viên' : 'Thêm thành viên'} description="Thông tin thành viên trong nhóm của bạn."><MemberForm key={editing?.id ?? 'new'} member={editing} members={members} teams={teams} signedIn={signedIn} onSave={onSave} onClose={() => setOpen(false)} onTeamCreated={async (_team: Team) => { await refresh(); }}/></MemberPanel><MemberPanel open={Boolean(deleting)} onOpenChange={value => { if (!value && !deleteBusy) setDeleting(undefined); }} title="Xóa thành viên?" description="Thao tác này không thể hoàn tác."><p className="break-words text-sm leading-7">Bạn có chắc muốn xóa <strong>{deleting?.name}</strong> khỏi danh sách?</p>{error && <p className="member-error" role="alert">{error}</p>}<div className="member-form-footer"><Button variant="outline" disabled={deleteBusy} onClick={() => setDeleting(undefined)}>Hủy</Button><Button variant="destructive" className="member-primary" disabled={deleteBusy} onClick={confirmDelete}>{deleteBusy ? <Loader2 className="animate-spin"/> : <Trash2/>}Xóa thành viên</Button></div></MemberPanel></>;
}
