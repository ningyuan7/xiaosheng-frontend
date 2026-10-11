import {useEffect,useState} from 'react';
import {Link,useNavigate} from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import {useAuth} from '@/context/AuthContext';
import {campusService,type Notice} from '@/services/campusService';
import {ErrorNotice,message,date} from './CampusShared';
import styles from './Campus.module.css';

export default function CampusNotificationsPage(){
  const {tokens}=useAuth();const navigate=useNavigate();const [items,setItems]=useState<Notice[]>([]);const [unread,setUnread]=useState(0);
  const [page,setPage]=useState(1);const [more,setMore]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  const load=async()=>{const data=await campusService.notices(page);setItems(data.items);setUnread(data.unread);setMore(data.hasMore);};
  useEffect(()=>{let current=true;if(!tokens){setItems([]);setUnread(0);return;}const run=()=>campusService.notices(page).then(data=>{if(current){setItems(data.items);setUnread(data.unread);setMore(data.hasMore);}}).catch(err=>{if(current)setError(message(err));});void run();const timer=window.setInterval(()=>void run(),60000);return()=>{current=false;window.clearInterval(timer);};},[page,tokens?.accessToken]);
  const read=async(id?:string,href?:string)=>{if(busy)return;setBusy(true);setError('');try{await campusService.readNotices(id);if(href)navigate(href);else await load();}catch(err){setError(message(err));}finally{setBusy(false);}};
  return <AppLayout header={<MainHeader headline="校园通知" subtitle={`${unread} 条未读通知`}/>}><ErrorNotice>{error}</ErrorNotice>
    {!tokens?<p className={styles.empty}>请先<Link to="/login">登录</Link>。</p>:<><div className={styles.actions}><button disabled={busy||unread===0} onClick={()=>void read()}>全部标记为已读</button></div>
      {items.length===0?<p className={styles.empty}>暂时没有通知。参与讨论后，回复和赞同会出现在这里。</p>:items.map(n=><article key={n.id} className={`${styles.card} ${styles.notice} ${!n.isRead?styles.unread:''}`}><div><h3>{n.message}</h3><span className={styles.meta}>{date(n.createdAt)} · {n.isRead?'已读':'未读'}</span></div><button className={styles.button} disabled={busy} onClick={()=>void read(n.id,n.href)}>查看</button></article>)}
      <div className={styles.actions}><button disabled={page===1||busy} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} 页</span><button disabled={!more||busy} onClick={()=>setPage(p=>p+1)}>下一页</button></div>
    </>}
  </AppLayout>;
}
