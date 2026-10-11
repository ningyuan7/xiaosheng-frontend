import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import AuthStatus from '@/features/auth/AuthStatus';
import { campusService, type Topic, type Opinion } from '@/services/campusService';
import { useAuth } from '@/context/AuthContext';
import { useMembership, MembershipHint, ErrorNotice, message, date } from './CampusShared';
import styles from './Campus.module.css';

export default function CampusHomePage() {
  const {id: topicId} = useParams();
  const [params] = useSearchParams();
  const {tokens} = useAuth();
  const {member, verified, error: membershipError} = useMembership();
  const campusId = member?.verification.campusId ?? '1';
  const [campusName,setCampusName] = useState('我的校园');
  const [mode,setMode] = useState('latest');
  const [items,setItems] = useState<Opinion[]>([]);
  const [hot,setHot] = useState<Topic[]>([]);
  const [topic,setTopic] = useState<Topic|null>(null);
  const [topics,setTopics] = useState<Topic[]>([]);
  const [generated,setGenerated] = useState(0);
  const [page,setPage] = useState(1);
  const [more,setMore] = useState(false);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [input,setInput] = useState(params.get('q') ?? '');
  const [query,setQuery] = useState(params.get('q') ?? '');
  const [reporting,setReporting] = useState(false);const [reason,setReason] = useState('');const [notice,setNotice]=useState('');
  useEffect(() => { setPage(1); setMode('latest'); setTopic(null); },[topicId]);
  useEffect(() => { setInput(params.get('q') ?? ''); setQuery(params.get('q') ?? ''); setPage(1); },[params]);
  useEffect(() => {
    let current=true; setLoading(true); setError('');
    Promise.all([campusService.feed({campusId,topicId,mode,query,page}),campusService.hot(campusId),campusService.topics(campusId),campusService.campuses(),topicId?campusService.topic(topicId):Promise.resolve(null)])
      .then(([feed,ranking,allTopics,campuses,detail])=> {
        if(!current) return;
        setItems(feed.items); setMore(feed.hasMore); setHot(ranking.items); setGenerated(ranking.generatedAt); setTopics(allTopics); setTopic(detail);
        setCampusName(campuses.find(c=>c.id===campusId)?.name ?? '我的校园');
      }).catch(err=> {if(current) {setError(message(err));setItems([]);setHot([]);}})
      .finally(()=> {if(current) setLoading(false);});
    return()=> {current=false;};
  },[campusId,topicId,mode,query,page,tokens?.accessToken]);
  const follow = async () => {
    if(!topic || busy) return; setBusy(true);
    try {await campusService.follow(topic.id,!topic.following);setTopic({...topic,following:!topic.following});}
    catch(err) {setError(message(err));} finally {setBusy(false);}
  };
  return <AppLayout header={<MainHeader headline="校声 · 校园广场" subtitle={campusName} rightSlot={<AuthStatus/>}/>}>
    <MembershipHint verified={verified}/><ErrorNotice>{error || membershipError}</ErrorNotice>
    <div className={styles.grid}><section className={styles.main}>
      <div className={styles.hero}><span className={styles.eyebrow}>CAMPUS / DISCUSS / CONNECT</span>
        <h1>{topic?.title ?? '校园里的每一种声音，都值得被听见。'}</h1>
        <p>{topic?.description || '聊学习，聊生活，聊那些与你我有关的小事。'}</p>
        <div className={styles.actions}><Link className={`${styles.button} ${styles.primary}`} to={`/create${topicId?'?topicId='+topicId:''}`}>发表观点</Link>
          {topic && <><span className={styles.badge}>{topic.category} · {topic.visibility==='campus'?'本校可见':'公开'} · {topic.status==='closed'?'已关闭讨论':'讨论中'}</span>
          <button disabled={!verified || busy} onClick={()=>void follow()}>{topic.following?'取消关注':'关注话题'}</button></>}
          {topic&&<button disabled={!verified||busy} onClick={()=>{setReporting(true);setReason('');}}>举报话题</button>}
        </div>
        {!topicId && <div className={styles.heroTags}><span>学习交流</span><span>校园日常</span><span>求助互助</span><span>实习就业</span></div>}
      </div>
      {notice&&<p className={styles.hint}>{notice}</p>}
      {reporting&&topic&&<form className={`${styles.card} ${styles.form}`} onSubmit={e=>{e.preventDefault();if(busy)return;setBusy(true);void campusService.report('topic',topic.id,reason).then(()=>{setReporting(false);setNotice('举报已提交，管理员会核实处理。');}).catch(err=>setError(message(err))).finally(()=>setBusy(false));}}><label htmlFor="topic-report">举报原因</label><textarea id="topic-report" required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/><div className={styles.actions}><button disabled={busy}>提交举报</button><button type="button" disabled={busy} onClick={()=>setReporting(false)}>取消</button></div></form>}
      <form className={styles.search} onSubmit={e=>{e.preventDefault();setQuery(input.trim());setPage(1);}}><input aria-label="搜索校园观点" placeholder="搜索观点、校园话题…" maxLength={100} value={input} onChange={e=>setInput(e.target.value)}/><button className={styles.button}>搜索</button></form>
      <div className={styles.toolbar}>{[['latest','最新'],['hot','热门'],['following','关注']].map(([key,label])=><button className={mode===key?styles.selected:''} key={key} disabled={key==='following'&&!tokens} onClick={()=>{setMode(key);setPage(1);}}>{label}</button>)}<Link className={styles.button} to="/create?newTopic=1">发起话题</Link></div>
      {loading?<p className={styles.empty}>正在加载校园讨论…</p>:items.length===0?<div className={styles.empty}>还没有符合条件的观点。来发表第一条吧。</div>:items.map(item=><article className={styles.card} key={item.id}>
        <Link className={styles.topic} to={`/campus/topics/${item.topicId}`}># {item.topicTitle}</Link>
        <h2><Link to={`/campus/opinions/${item.id}`}>{item.title}</Link></h2>
        <div className={styles.meta}>{item.authorName} · {date(item.createdAt)}</div>
        <p className={styles.excerpt}>{item.body.slice(0,180)}{item.body.length>180?'…':''}</p>
        <div className={styles.counts}><span>{item.likeCount} 赞同</span><span>{item.commentCount} 评论</span><span>{item.favoriteCount} 收藏</span></div>
      </article>)}
      <div className={styles.actions}><button disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>上一页</button><span>第 {page} 页</span><button disabled={!more||loading} onClick={()=>setPage(p=>p+1)}>下一页</button></div>
    </section><aside className={styles.hot}><span className={styles.eyebrow}>WHAT'S HAPPENING</span><h2>校园十大热点</h2><p className={styles.meta}>近 24 小时参与热度 · 每 5 分钟更新</p>
      {generated>0&&<span className={styles.meta}>更新于 {date(generated)}</span>}
      {hot.length===0?<p className={styles.meta}>有效讨论产生后，话题将进入热榜。</p>:<ol>{hot.map((item,index)=><li key={item.id}><span className={styles.rank}>{index+1}</span><div><Link to={`/campus/topics/${item.id}`}>{item.title}</Link><small>热度 {(item.heat??0).toFixed(1)} · {item.participants} 人参与 · {item.opinionCount} 条观点</small></div></li>)}</ol>}
      <h3>最近话题</h3><div className={styles.recentTopics}>{topics.slice(0,8).map(t=><Link key={t.id} to={`/campus/topics/${t.id}`}># {t.title}</Link>)}</div>
    </aside></div>
  </AppLayout>;
}
