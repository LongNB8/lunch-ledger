import { describe, expect, it } from 'vitest';
import { memberSchema, teamSchema, suggestTransferCode, filterMembers, type Member } from '@/components/lunchdebt/member-schema';
const member: Member = { id: '11111111-1111-4111-8111-111111111111', name: 'Nguyễn Văn Nam', nickname: '', email: 'nam@example.com', team_id: null, transfer_code: 'NAM', is_active: true };
describe('Member form validation', () => {
 it('suggests uppercase unaccented surname and resolves known duplicates', () => { expect(suggestTransferCode('Nguyễn Văn Nam')).toBe('NAM'); expect(suggestTransferCode('Đặng Đức Đạt')).toBe('DAT'); expect(suggestTransferCode('Nguyễn Văn Nam', ['NAM','NAM2'])).toBe('NAM3'); expect(suggestTransferCode(' ')).toBe(''); });
 it('accepts required name, optional email and team', () => { expect(memberSchema.safeParse(member).success).toBe(true); expect(memberSchema.safeParse({...member,email:''}).success).toBe(true); });
 it('rejects blank names, invalid email, invalid team and invalid transfer code', () => { for (const changes of [{name:'  '},{email:'bad@email'},{team_id:'wrong'},{transfer_code:'NÁM'},{transfer_code:'nam'},{transfer_code:''},{nickname:'x'.repeat(61)}]) expect(memberSchema.safeParse({...member,...changes}).success).toBe(false); });
 it('validates Team names', () => { expect(teamSchema.safeParse({name:'   '}).success).toBe(false); expect(teamSchema.parse({name:' Team A '}).name).toBe('Team A'); });
 it('searches names without accents and email instantly', () => { expect(filterMembers([member],'nguyen')).toHaveLength(1); expect(filterMembers([member],'EXAMPLE.COM')).toHaveLength(1); expect(filterMembers([member],'missing')).toHaveLength(0); });
});
