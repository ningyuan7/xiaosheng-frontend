import { useEffect,useState } from 'react';
import { useNavigate,useSearchParams,Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import MainHeader from '@/components/layout/MainHeader';
import {campusService,CAMPUS_CATEGORIES,type Topic} from '@/services/campusService';
import {useMembership,MembershipHint,ErrorNotice,message} from './CampusShared';
import styles from './Campus.module.css';

export default function CampusCreatePage() {
  const [params]=useSearchParams(); const navigate=useNavigate();
  const {member,verified,loading,error: membershipError}=useMembership();
  const campusId=member?.verification.campusId ?? '1';
  const [topics,setTopics]=useState<Topic[]>([]); const [topicId,setTopicId]=useState(params.get('topicId')??'');
  const [newTopic,setNewTopic]=useState(params.get('newTopic')==='1');
  const [topicTitle,setTopicTitle]=useState('');const [description,setDescription]=useState('');
  const [category,setCategory]=useState(CAMPUS_CATEGORIES[0]);const [visibility,setVisibility]=useState('public');
  const [title,setTitle]=useState(''); const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  const [uploading,setUploading]=useState(false);const [images,setImages]=useState<Array<{id:string;name:string}>>([]);
  const upload=async(files:FileList|null)=>{
    if(!files||uploading||busy)return;
    if(images.length+files.length>9){setError('每条观点最多上传 9 张图片');return;}
    setUploading(true);setError('');
    try{for(const file of Array.from(files)){const id=await campusService.uploadImage(campusId,file);setImages(prev=>[...prev,{id,name:file.name}]);}}
    catch(err){setError(message(err));}finally{setUploading(false);}
  };
  useEffect(()=>{let current=true;if(!verified){setTopics([]);return;}campusService.topics(campusId).then(data=>{if(current)setTopics(data.filter(t=>t.status==='active'));}).catch(err=>{if(current)setError(message(err));});return()=>{current=false;};},[campusId,verified]);
  const submit=async(topicOnly=false)=>{
    if(busy||uploading||!verified)return;
    setError('');
    if(newTopic&&!topicTitle.trim()) {setError('请输入话题名称');return;}
    if(!newTopic&&!topicId){setError('请选择话题');return;}
    if(!topicOnly&&(!title.trim()||!body.trim())){setError('请填写观点标题和正文');return;}
    setBusy(true);
    try {
      let target=topicId;
      if(newTopic){const result=await campusService.createTopic({campusId,title:topicTitle,description,category,visibility});target=result.id;setTopicId(target);setNewTopic(false);setTopics(prev=>[{id:target,title:topicTitle,description,category,visibility,status:'active',opinionCount:0},...prev]);}
      if(topicOnly){navigate('/campus/topics/'+target);return;}
      const result=await campusService.publish({topicId:target,title,body,mediaIds:images.map(image=>image.id)});navigate('/campus/opinions/'+result.id);
    }catch(err){setError(message(err));}finally{setBusy(false);}
  };
  return <AppLayout header={<MainHeader headline="说说你的校园观点" subtitle="一个真实的经历，也能开启一场有价值的讨论。"/>}>
    <div className={styles.form}><MembershipHint verified={verified}/><ErrorNotice>{error||membershipError}</ErrorNotice>
      <form onSubmit={e=>{e.preventDefault();void submit();}}>
        <label className={styles.check}><input type="checkbox" checked={newTopic} onChange={e=>setNewTopic(e.target.checked)} disabled={busy}/>发起一个新话题</label>
        {newTopic?<><label htmlFor="topic-title">话题名称</label><input id="topic-title" maxLength={100} value={topicTitle} onChange={e=>setTopicTitle(e.target.value)} placeholder="例如：图书馆是否应该延长开放时间？"/>
          <label htmlFor="topic-description">话题介绍</label><textarea id="topic-description" maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)}/>
          <label htmlFor="topic-category">分类</label><select id="topic-category" value={category} onChange={e=>setCategory(e.target.value)}>{CAMPUS_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select>
          <label htmlFor="topic-visibility">可见范围</label><select id="topic-visibility" value={visibility} onChange={e=>setVisibility(e.target.value)}><option value="public">公开，所有人可阅读</option><option value="campus">仅本校认证同学可阅读</option></select>
        </>:<><label htmlFor="topic-select">所属话题</label><select id="topic-select" value={topicId} onChange={e=>setTopicId(e.target.value)}><option value="">请选择一个话题</option>{topics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></>}
        <label htmlFor="opinion-title">观点标题</label><input id="opinion-title" maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="用一句话表达你的观点"/>
        <label htmlFor="opinion-body">正文</label><textarea id="opinion-body" style={{minHeight:260}} maxLength={20000} value={body} onChange={e=>setBody(e.target.value)} placeholder="分享你的经历、建议或疑问。支持 Markdown。"/><small>{body.length}/20000 字 · 昵称公开展示，学号和手机号不公开。</small>
        <label htmlFor="opinion-images">添加图片</label><input id="opinion-images" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={!verified||busy||uploading} onChange={e=>{void upload(e.target.files);e.target.value='';}}/><small>最多 9 张，每张不超过 5 MB。{uploading?'正在上传…':''}</small>
        {images.map(image=><div className={styles.actions} key={image.id}><span>{image.name}</span><button type="button" disabled={busy||uploading} onClick={()=>setImages(prev=>prev.filter(i=>i.id!==image.id))}>移除</button></div>)}
        <div className={styles.actions}><button className={styles.primary} disabled={!verified||loading||busy||uploading}>{busy?'正在发布…':'发布观点'}</button>{newTopic&&<button type="button" disabled={!verified||busy||uploading} onClick={()=>void submit(true)}>只创建话题</button>}<Link className={styles.button} to="/">返回校园广场</Link></div>
      </form>
    </div>
  </AppLayout>;
}
