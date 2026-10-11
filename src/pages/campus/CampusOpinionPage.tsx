import {useEffect,useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import {useAuth} from '@/context/AuthContext';
import {campusService,type Opinion,type CampusComment} from '@/services/campusService';
import {useMembership,MembershipHint,ErrorNotice,message,date} from './CampusShared';
import styles from './Campus.module.css';

export default function CampusOpinionPage() {
  const {id=''}=useParams(); const navigate=useNavigate(); const {user}=useAuth();
  const {verified}=useMembership();
  const [post,setPost]=useState<Opinion|null>(null);const [comments,setComments]=useState<CampusComment[]>([]);
  const [cursor,setCursor]=useState<string|undefined>();const [more,setMore]=useState(false);
  const [content,setContent]=useState('');const [reply,setReply]=useState<CampusComment|null>(null);
  const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [reportTarget,setReportTarget]=useState<{type:string;id:string}|null>(null);const [reason,setReason]=useState('');
  const [confirmDelete,setConfirmDelete]=useState<{type:'opinion'|'comment';id:string}|null>(null);
  const [editing,setEditing]=useState(false);const [editTitle,setEditTitle]=useState('');const [editBody,setEditBody]=useState('');
  useEffect(()=>{
    let current=true;setLoading(true);setPost(null);setComments([]);setError('');setReply(null);setContent('');
    Promise.all([campusService.opinion(id),campusService.comments(id)]).then(([detail,page])=>{if(!current)return;setPost(detail);setComments(page.items);setCursor(page.nextCursor??undefined);setMore(page.hasMore);})
      .catch(err=>{if(current)setError(message(err));}).finally(()=>{if(current)setLoading(false);});
    return()=>{current=false;};
  },[id,user?.id]);
  const reload=async()=>{const [detail,page]=await Promise.all([campusService.opinion(id),campusService.comments(id)]);setPost(detail);setComments(page.items);setCursor(page.nextCursor??undefined);setMore(page.hasMore);};
  const action=async(work:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);setError('');try{await work();}catch(err){setError(message(err));}finally{setBusy(false);}};
  const react=(type:'like'|'fav')=>action(async()=>{if(!post)return;const result=await campusService.react(id,type,!Boolean(type==='like'?post.liked:post.faved));setPost({...post,...(type==='like'?{liked:result.enabled,likeCount:result.count}:{faved:result.enabled,favoriteCount:result.count})});});
  const submitComment=()=>action(async()=>{if(!content.trim())return;await campusService.comment(id,content,reply?.id);setContent('');setReply(null);await reload();});
  return <AppLayout header={<MainHeader headline="校园观点" rightSlot={<Link to="/">返回广场</Link>}/>}>
    <ErrorNotice>{error}</ErrorNotice>{loading?<p className={styles.empty}>正在加载…</p>:post?<>
      <article className={styles.card}><Link className={styles.topic} to={'/campus/topics/'+post.topicId}># {post.topicTitle}</Link><h1>{post.title}</h1>
        <p className={styles.meta}>{post.authorName} · {date(post.createdAt)}</p>
        <div className={styles.body}><ReactMarkdown remarkPlugins={[remarkGfm]}>{post.body}</ReactMarkdown></div>
        <div className={styles.images}>{post.images?.map((url,index)=><img key={index} src={url} alt={`观点配图 ${index+1}`} loading="lazy"/>)}</div>
        <div className={styles.actions}><button disabled={!verified||busy} className={post.liked?styles.primary:''} onClick={()=>void react('like')}>{post.liked?'已赞同':'赞同'} {post.likeCount}</button>
          <button disabled={!verified||busy} onClick={()=>void react('fav')}>{post.faved?'已收藏':'收藏'} {post.favoriteCount}</button><span>{post.commentCount} 条评论</span>
          <button disabled={!verified||busy} onClick={()=>{setReportTarget({type:'opinion',id});setReason('');}}>举报</button>
          {String(user?.id)===post.authorId&&<><button disabled={busy} onClick={()=>{setEditing(true);setEditTitle(post.title);setEditBody(post.body);}}>编辑观点</button><button disabled={busy} onClick={()=>setConfirmDelete({type:'opinion',id})}>删除观点</button></>}
        </div>
      </article>
      {editing&&<form className={`${styles.card} ${styles.form}`} onSubmit={e=>{e.preventDefault();void action(async()=>{await campusService.editOpinion(id,editTitle,editBody);setEditing(false);await reload();});}}><label htmlFor="edit-title">标题</label><input id="edit-title" required maxLength={100} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/><label htmlFor="edit-body">正文</label><textarea id="edit-body" required maxLength={20000} value={editBody} onChange={e=>setEditBody(e.target.value)}/><div className={styles.actions}><button disabled={busy}>保存修改</button><button type="button" disabled={busy} onClick={()=>setEditing(false)}>取消</button></div></form>}
      <section className={styles.comments}><h2>同学们的讨论</h2><MembershipHint verified={verified}/>
        {verified&&<form className={styles.form} onSubmit={e=>{e.preventDefault();void submitComment();}}>
          {reply&&<p className={styles.hint}>回复 {reply.authorName}<button type="button" onClick={()=>setReply(null)}>取消回复</button></p>}
          <label htmlFor="campus-comment">发表{reply?'回复':'评论'}</label><textarea id="campus-comment" required maxLength={1000} value={content} onChange={e=>setContent(e.target.value)} placeholder="友善讨论，尊重不同的观点。"/>
          <div className={styles.actions}><button className={styles.primary} disabled={busy||!content.trim()}>发送{reply?'回复':'评论'}</button></div>
        </form>}
        {comments.length===0?<p className={styles.empty}>还没有评论，来聊聊你的看法。</p>:comments.map(c=><article key={c.id} className={`${styles.card} ${c.rootId!=='0'?styles.reply:''}`}><div className={styles.meta}>{c.authorName} · {date(c.createdAt)}</div>
          <p className={styles.excerpt}>{c.replyName&&<strong>回复 {c.replyName}： </strong>}{c.content}</p>
          <div className={styles.actions}><button disabled={!verified||busy} onClick={()=>{setReply(c);document.getElementById('campus-comment')?.focus();}}>回复</button>
            <button disabled={!verified||busy} onClick={()=>{setReportTarget({type:'comment',id:c.id});setReason('');}}>举报</button>
            {String(user?.id)===c.authorId&&<button disabled={busy} onClick={()=>setConfirmDelete({type:'comment',id:c.id})}>删除</button>}
          </div>
        </article>)}
        {more&&<div className={styles.actions}><button disabled={busy} onClick={()=>void action(async()=>{const page=await campusService.comments(id,cursor);setComments(prev=>[...prev,...page.items]);setCursor(page.nextCursor??undefined);setMore(page.hasMore);})}>加载更多评论</button></div>}
      </section>
      {confirmDelete&&<div className={styles.card} role="dialog" aria-label="删除确认"><p>{confirmDelete.type==='opinion'?'删除后，观点将不再展示。':'删除主评论也会删除其下回复。'}确认删除？</p><div className={styles.actions}><button disabled={busy} onClick={()=>void action(async()=>{if(confirmDelete.type==='opinion'){await campusService.deleteOpinion(confirmDelete.id);navigate('/');}else{await campusService.deleteComment(confirmDelete.id);setConfirmDelete(null);await reload();}})}>确认删除</button><button onClick={()=>setConfirmDelete(null)}>取消</button></div></div>}
      {reportTarget&&<form className={styles.card} onSubmit={e=>{e.preventDefault();void action(async()=>{await campusService.report(reportTarget.type,reportTarget.id,reason);setReportTarget(null);});}}><label htmlFor="report-reason">举报原因</label><textarea id="report-reason" required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/><div className={styles.actions}><button disabled={busy}>提交举报</button><button type="button" onClick={()=>setReportTarget(null)}>取消</button></div></form>}
    </>:null}
  </AppLayout>;
}
