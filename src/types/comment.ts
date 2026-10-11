// 与后端 CommentResponse 保持一致
export type Comment = {
    id: string;
    postId: string;
    rootId: string;
    parentId: string;
    replyUserId?: string | null;
    replyNickname?: string | null;
    userId: string;
    nickname: string;
    avatar?: string | null;
    content: string;
    createdAt?: number | null; // epoch 毫秒
    replyCount?: number | null; // 仅一级评论有值
};

// 与后端 CommentPageResponse 保持一致
export type CommentPageResponse = {
    items: Comment[];
    nextCursor: string | null;
    hasMore: boolean;
};

export type CommentCreateRequest = {
    postId: string;
    content: string;
    parentId?: string | null; // 为空表示一级评论
};

