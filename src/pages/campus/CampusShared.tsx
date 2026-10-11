import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { campusService, type Membership } from '@/services/campusService';
import styles from './Campus.module.css';

export function useMembership() {
  const { tokens } = useAuth();
  const [member, setMember] = useState<Membership|null>(null);
  const [loading, setLoading] = useState(Boolean(tokens));
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    setMember(null); setError('');
    if (!tokens) { setLoading(false); return; }
    setLoading(true);
    campusService.me().then(data => { if (current) setMember(data); })
      .catch(err => { if (current) setError(message(err)); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tokens?.accessToken]);
  return {member, loading, error, verified: member?.verification.status === 'approved'};
}
export const message = (err: unknown) => err instanceof Error ? err.message : '操作失败，请稍后重试';
export const date = (time: number) => new Date(time).toLocaleString('zh-CN', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'});
export function MembershipHint({verified}: {verified: boolean}) {
  const {tokens} = useAuth();
  if (verified) return null;
  return <div className={styles.hint}>{tokens
    ? <>完成校园认证后，即可发表观点、参与讨论。<Link to="/campus/account">去认证 →</Link></>
    : <>登录后申请校园认证，和同学们一起讨论。<Link to="/login">去登录 →</Link></>}</div>;
}
export function ErrorNotice({children}: {children: string}) {
  return children ? <p role="alert" className={styles.error}>{children}</p> : null;
}
