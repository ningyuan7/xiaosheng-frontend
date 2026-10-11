import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import {useAuth} from '@/context/AuthContext';
import {campusService,type Campus,type Membership,type Opinion} from '@/services/campusService';
import {ErrorNotice,message} from './CampusShared';
import styles from './Campus.module.css';

export default function CampusAccountPage() {
  const {tokens}=useAuth();const [member,setMember]=useState<Membership|null>(null);
  const [campuses,setCampuses]=useState<Campus[]>([]);const [campusId,setCampusId]=useState('1');
  const [studentNo,setStudentNo]=useState('');const [evidence,setEvidence]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [mode,setMode]=useState('mine');
  const [items,setItems]=useState<Opinion[]>([]);const [page,setPage]=useState(1);const [more,setMore]=useState(false);
  const reload=async()=>{const data=await campusService.me();setMember(data);setCampusId(data.verification.campusId??'1');};
  useEffect(()=>{let current=true;if(!tokens){setMember(null);return;}Promise.all([campusService.me(),campusService.campuses()]).then(([data,list])=>{if(current){setMember(data);setCampuses(list);setCampusId(data.verification.campusId??list[0]?.id??'1');}}).catch(err=>{if(current)setError(message(err));});return()=>{current=false;};},[tokens?.accessToken]);
  useEffect(()=>{let current=true;if(!tokens){setItems([]);return;}campusService.feed({campusId,mode,page}).then(data=>{if(current){setItems(data.items);setMore(data.hasMore);}}).catch(err=>{if(current)setError(message(err));});return()=>{current=false;};},[campusId,mode,page,tokens?.accessToken]);
  const status=member?.verification.status;
  const submit=async()=>{if(busy)return;setBusy(true);setError('');try{await campusService.verify({campusId,studentNo,evidence});await reload();}catch(err){setError(message(err));}finally{setBusy(false);}};
  return <AppLayout header={<MainHeader headline="我的校园" subtitle="管理校园身份与个人讨论" rightSlot={<Link to="/profile">个人资料</Link>}/>}>
    <ErrorNotice>{error}</ErrorNotice>{!tokens?<div className={styles.empty}>请先<Link to="/login">登录</Link>，再管理校园身份。</div>:<>
      <section className={styles.card}><h2>校园身份认证</h2><p>状态：{status==='approved'?'已认证':status==='pending'?'审核中':status==='rejected'?'未通过':'未认证'}</p>
        {member?.verification.reviewNote&&<p>审核说明：{member.verification.reviewNote}</p>}
        {status==='approved'||status==='pending'?<p className={styles.meta}>学号：{member?.verification.studentNo} · {status==='pending'?'管理员核验后会通过站内通知告知结果。':'学号仅本人和审核管理员可见。'}</p>:<form className={styles.form} onSubmit={e=>{e.preventDefault();void submit();}}>
          <label htmlFor="verify-campus">学校</label><select id="verify-campus" value={campusId} onChange={e=>setCampusId(e.target.value)}>{campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label htmlFor="student-no">学号</label><input id="student-no" required pattern="[A-Za-z0-9-]{4,32}" maxLength={32} value={studentNo} onChange={e=>setStudentNo(e.target.value)} placeholder="填写本人学号"/>
          <label htmlFor="verify-evidence">身份核验说明</label><textarea id="verify-evidence" required maxLength={500} value={evidence} onChange={e=>setEvidence(e.target.value)} placeholder="填写院系、年级及可由学校管理员核验的身份信息。不要填写密码或身份证号码。"/>
          <small>填写学号不会自动通过认证，需要管理员核验。认证材料不向其他用户展示。</small><div className={styles.actions}><button disabled={busy} className={styles.primary}>{busy?'提交中…':'提交认证申请'}</button></div>
        </form>}
        {member?.isAdmin&&<Link className={styles.button} to="/campus/admin">进入校园管理</Link>}
      </section>
      <div className={styles.toolbar}>{[['mine','我的观点'],['favorites','我的收藏']].map(([key,label])=><button key={key} className={mode===key?styles.selected:''} onClick={()=>{setMode(key);setPage(1);}}>{label}</button>)}<Link className={styles.button} to="/campus/notifications">查看通知</Link></div>
      {items.length===0?<p className={styles.empty}>这里还没有内容。</p>:items.map(p=><article key={p.id} className={styles.card}><Link to={'/campus/opinions/'+p.id}><h3>{p.title}</h3></Link><p className={styles.meta}># {p.topicTitle} · {p.likeCount} 赞同 · {p.commentCount} 评论</p></article>)}
      <div className={styles.actions}><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} 页</span><button disabled={!more} onClick={()=>setPage(p=>p+1)}>下一页</button></div>
    </>}
  </AppLayout>;
}
