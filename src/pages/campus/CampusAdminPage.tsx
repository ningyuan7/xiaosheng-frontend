import {useEffect,useState} from 'react';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import {campusService,type VerificationRequest,type Report,type Audit,type AdminContent} from '@/services/campusService';
import {useMembership,ErrorNotice,message,date} from './CampusShared';
import styles from './Campus.module.css';

export default function CampusAdminPage(){
  const {member,loading,error: memberError}=useMembership();const [verifications,setVerifications]=useState<VerificationRequest[]>([]);
  const [reports,setReports]=useState<Report[]>([]);const [logs,setLogs]=useState<Audit[]>([]);const [contents,setContents]=useState<AdminContent[]>([]);
  const [tab,setTab]=useState('verification');const [notes,setNotes]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const load=async()=>{const [v,r,l,c]=await Promise.all([campusService.verifications(),campusService.reports(),campusService.logs(),campusService.adminContent()]);setVerifications(v);setReports(r);setLogs(l);setContents(c);};
  useEffect(()=>{if(!member?.isAdmin)return;void load().catch(err=>setError(message(err)));},[member?.isAdmin]);
  const perform=async(work:()=>Promise<void>)=>{if(busy)return;setBusy(true);setError('');try{await work();await load();}catch(err){setError(message(err));}finally{setBusy(false);}};
  const note=(key:string)=><textarea aria-label="审核或处理说明" maxLength={500} value={notes[key]??''} onChange={e=>setNotes({...notes,[key]:e.target.value})} placeholder="填写核验结果或处理原因"/>;
  return <AppLayout header={<MainHeader headline="校园管理" subtitle="身份审核 · 内容治理 · 操作留痕"/>}><ErrorNotice>{error||memberError}</ErrorNotice>
    {loading?<p>正在检查权限…</p>:!member?.isAdmin?<p className={styles.empty}>该页面仅校园管理员可访问。</p>:<>
      <div className={styles.toolbar}>{[['verification','认证审核'],['reports','举报处理'],['content','内容管理'],['logs','操作记录']].map(([key,label])=><button key={key} className={tab===key?styles.selected:''} onClick={()=>setTab(key)}>{label}</button>)}</div>
      {tab==='verification'&&(verifications.length===0?<p className={styles.empty}>没有待审核申请。</p>:verifications.map(v=><article className={styles.card} key={v.userId}><h3>{v.nickname} · {v.campusName}</h3><p>学号：{v.studentNo}</p><p className={styles.excerpt}>{v.evidence}</p><small className={styles.meta}>{date(v.createdAt)}</small>{note('v'+v.userId)}<div className={styles.actions}><button disabled={busy} onClick={()=>void perform(()=>campusService.reviewVerification(v.userId,'approved',notes['v'+v.userId]??''))}>核验通过</button><button disabled={busy||!notes['v'+v.userId]?.trim()} onClick={()=>void perform(()=>campusService.reviewVerification(v.userId,'rejected',notes['v'+v.userId]??''))}>拒绝申请</button></div></article>))}
      {tab==='reports'&&(reports.length===0?<p className={styles.empty}>没有待处理举报。</p>:reports.map(r=><article className={styles.card} key={r.id}><h3>{r.targetType} · {r.targetId}</h3><p className={styles.excerpt}>{r.preview}</p><p>举报原因：{r.reason}</p>{note('r'+r.id)}<div className={styles.actions}><button disabled={busy||!notes['r'+r.id]?.trim()} onClick={()=>void perform(()=>campusService.reviewReport(r.id,'hidden',notes['r'+r.id]??''))}>隐藏内容</button><button disabled={busy||!notes['r'+r.id]?.trim()} onClick={()=>void perform(()=>campusService.reviewReport(r.id,'dismissed',notes['r'+r.id]??''))}>驳回举报</button></div></article>))}
      {tab==='content'&&contents.map(c=><article className={styles.card} key={c.targetType+c.id}><h3>{c.title}</h3><p className={styles.meta}>{c.targetType} · 当前状态：{c.status}</p><p className={styles.excerpt}>{c.preview}</p>{note('c'+c.id)}<div className={styles.actions}>{(c.targetType==='topic'?['active','closed','hidden']:['approved','hidden']).map(status=><button key={status} disabled={busy||status===c.status||!notes['c'+c.id]?.trim()} onClick={()=>void perform(()=>campusService.moderate(c.targetType,c.id,status,notes['c'+c.id]??''))}>{({active:'开放讨论',closed:'关闭讨论',hidden:'隐藏',approved:'恢复展示'} as Record<string,string>)[status]}</button>)}</div></article>)}
      {tab==='logs'&&logs.map(l=><article className={styles.card} key={l.id}><p>{l.action} · {l.targetType} {l.targetId}</p><p>{l.note}</p><span className={styles.meta}>操作人 {l.actorId} · {date(l.createdAt)}</span></article>)}
    </>}
  </AppLayout>;
}
