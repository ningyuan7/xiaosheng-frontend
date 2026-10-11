import {apiFetch} from "./apiClient";
import type{Comment,CommentCreateRequest,CommentPageResponse}from "@/types/comment";
const COMMENTS_PREFIX = "/api/v1/comments";

const buildCursorQuery = (limit:number,cursor?:string|null)=>{
    const params = new URLSearchParams({limit:String(limit)});
    if(cursor !=null){
        params.set("cursor",String(cursor));
    }
    return params.toString();
};

export const commentService = {
    // 发表评论/回复（需鉴权）
    create:(payload:CommentCreateRequest,accessToken:string)=>
        apiFetch<Comment>(COMMENTS_PREFIX,{
            method:"POST",
            body: payload,
            accessToken
        }),


    // 一级评论分页，最新在前
    roots: (postId: string, limit = 20, cursor?: string | null) =>
        apiFetch<CommentPageResponse>(
            `${COMMENTS_PREFIX}/post/${postId}?${buildCursorQuery(limit, cursor)}`
        ),

    // 某条一级评论下的回复，按时间正序
    replies: (postId: string, rootId: string, limit = 20, cursor?: string | null) =>
        apiFetch<CommentPageResponse>(
            `${COMMENTS_PREFIX}/post/${postId}/replies?rootId=${rootId}&${buildCursorQuery(limit, cursor)}`
        ),

    // 评论总数
    count: (postId: string) =>
        apiFetch<number>(`${COMMENTS_PREFIX}/post/${postId}/count`),

    // 删除自己的评论（需鉴权）
    remove: (commentId: string, accessToken: string) =>
        apiFetch<boolean>(`${COMMENTS_PREFIX}/${commentId}`, {
            method: "DELETE",
            accessToken
        })
};

