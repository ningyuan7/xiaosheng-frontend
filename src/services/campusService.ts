import { apiFetch } from './apiClient';

export const CAMPUS_CATEGORIES = ['校园日常', '学习交流', '食堂生活', '校园活动', '求助互助', '实习就业'];
export type Campus = { id: string; name: string };
export type Membership = { isAdmin: boolean; verification: { campusId?: string; studentNo?: string; evidence?: string; status?: string; reviewNote?: string } };
export type Topic = { id: string; campusId?: string; title: string; description: string; category: string; visibility: string; status: string; following?: boolean; opinionCount: number; heat?: number; participants?: number };
export type Opinion = { id: string; topicId: string; topicTitle: string; campusId: string; title: string; body: string; images?: string[]; authorId: string; authorName: string; authorAvatar?: string; createdAt: number; likeCount: number; commentCount: number; favoriteCount: number; liked: boolean | number; faved: boolean | number };
export type CampusComment = { id: string; postId: string; parentId: string; rootId: string; authorId: string; authorName: string; replyName?: string; content: string; createdAt: number };
export type Notice = { id: string; type: string; message: string; href: string; isRead: boolean | number; createdAt: number };
export type VerificationRequest = { userId: string; campusName: string; nickname: string; studentNo: string; evidence: string; createdAt: number };
export type Report = { id: string; targetType: 'topic'|'opinion'|'comment'; targetId: string; reason: string; preview: string; createdAt: number };
export type Audit = { id: string; actorId: string; action: string; targetType: string; targetId: string; note: string; createdAt: number };
export type AdminContent = { id: string; targetType: 'topic'|'opinion'; title: string; preview: string; status: string };
export type Page<T> = { items: T[]; hasMore: boolean; nextCursor?: string|null };
const prefix = '/api/v1/campus';
const get = <T>(path: string) => apiFetch<T>(prefix + path);
const write = <T = void>(path: string, method: string, body?: unknown) => apiFetch<T>(prefix + path, { method, body });
const query = (values: Record<string, string|number|undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
};
export const campusService = {
  campuses: () => get<Campus[]>('/campuses'),
  me: () => get<Membership>('/me'),
  verify: (body: { campusId: string; studentNo: string; evidence: string }) => write('/verification', 'POST', body),
  topics: (campusId = '1', category = '') => get<Topic[]>(`/topics?${query({campusId,category})}`),
  topic: (id: string) => get<Topic>(`/topics/${id}`),
  createTopic: (body: {campusId: string; title: string; description: string; category: string; visibility: string}) => write<{id: string}>('/topics', 'POST', body),
  follow: (id: string, enabled: boolean) => write(`/topics/${id}/follow?enabled=${enabled}`, 'PUT'),
  hot: (campusId = '1') => get<{items: Topic[]; generatedAt: number; windowHours: number}>(`/hot?campusId=${campusId}`),
  feed: (options: {campusId?: string; topicId?: string; mode?: string; query?: string; page?: number}) => get<Page<Opinion>>(`/opinions?${query({campusId:'1', ...options})}`),
  publish: (body: {topicId: string; title: string; body: string; mediaIds?: string[]}) => write<{id: string; topicId: string}>('/opinions', 'POST', body),
  uploadImage: async (campusId: string, file: File) => {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size<1 || file.size>5*1024*1024) throw new Error('图片仅支持 JPG、PNG、WebP，且不超过 5 MB');
    const signed = await write<{id: string; putUrl: string; contentType: string}>('/media/presign','POST',{campusId,contentType:file.type,size:file.size});
    const uploaded = await fetch(signed.putUrl,{method:'PUT',headers:{'Content-Type':signed.contentType},body:file,credentials:'omit'});
    if(!uploaded.ok)throw new Error('图片上传失败，请检查网络后重试');
    await write(`/media/${signed.id}/confirm`,'POST');
    return signed.id;
  },
  opinion: (id: string) => get<Opinion>(`/opinions/${id}`),
  deleteOpinion: (id: string) => write(`/opinions/${id}`, 'DELETE'),
  editOpinion: (id: string, title: string, body: string) => write(`/opinions/${id}`,'PATCH',{title,body}),
  react: (id: string, type: 'like'|'fav', enabled: boolean) => write<{changed: boolean; enabled: boolean; count: number}>(`/opinions/${id}/reactions/${type}?enabled=${enabled}`, 'PUT'),
  comments: (id: string, cursor?: string) => get<Page<CampusComment>>(`/opinions/${id}/comments?${query({cursor})}`),
  comment: (id: string, content: string, parentId?: string) => write<CampusComment>(`/opinions/${id}/comments`, 'POST', {content,parentId}),
  deleteComment: (id: string) => write(`/comments/${id}`, 'DELETE'),
  notices: (page = 1) => get<Page<Notice> & {unread: number}>(`/notifications?page=${page}`),
  readNotices: (id?: string) => write(`/notifications/read?${query({id})}`, 'PUT'),
  report: (targetType: string, targetId: string, reason: string) => write('/reports', 'POST', {targetType,targetId,reason}),
  verifications: () => get<VerificationRequest[]>('/admin/verifications'),
  reviewVerification: (id: string, decision: string, note: string) => write(`/admin/verifications/${id}`, 'PUT', {decision,note}),
  reports: () => get<Report[]>('/admin/reports'),
  reviewReport: (id: string, decision: string, note: string) => write(`/admin/reports/${id}`, 'PUT', {decision,note}),
  moderate: (type: string, id: string, decision: string, note: string) => write(`/admin/content/${type}/${id}`, 'PUT', {decision,note}),
  adminContent: () => get<AdminContent[]>('/admin/content'),
  logs: () => get<Audit[]>('/admin/logs')
};
