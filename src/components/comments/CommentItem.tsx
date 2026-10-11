import { useAuth } from "@/context/AuthContext";
import { TrashIcon } from "@/components/icons/Icon";
import type { Comment } from "@/types/comment";
import styles from "./CommentItem.module.css";

// 某条一级评论下的回复分页状态
export type ReplyBucket = {
  items: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
  loaded: boolean;
  loading: boolean;
};

export const emptyReplyBucket = (): ReplyBucket => ({
  items: [],
  nextCursor: null,
  hasMore: false,
  loaded: false,
  loading: false
});

type CommentItemProps = {
  comment: Comment;
  isReply?: boolean;
  replyBucket?: ReplyBucket;
  onReply?: (comment: Comment) => void;
  onToggleReplies?: (root: Comment) => void;
  onLoadMoreReplies?: (root: Comment) => void;
  onDelete?: (comment: Comment) => void;
};

const formatTime = (ts?: number | null): string => {
  if (!ts) return "";
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const CommentItem = ({
  comment,
  isReply = false,
  replyBucket,
  onReply,
  onToggleReplies,
  onLoadMoreReplies,
  onDelete
}: CommentItemProps) => {
  const { user } = useAuth();
  const isMine = !!user && String(user.id) === String(comment.userId);

  return (
    <div className={`${styles.item} ${isReply ? styles.reply : ""}`}>
      <div className={styles.avatarWrap}>
        {comment.avatar ? (
          <img className={styles.avatar} src={comment.avatar} alt={comment.nickname} />
        ) : (
          <span className={styles.avatarFallback}>{comment.nickname.slice(0, 1)}</span>
        )}
      </div>

      <div className={styles.main}>
        <div className={styles.meta}>
          <span className={styles.nickname}>{comment.nickname}</span>
          {isReply && comment.replyNickname ? (
            <span className={styles.replyTo}>回复 @{comment.replyNickname}</span>
          ) : null}
          <span className={styles.time}>{formatTime(comment.createdAt)}</span>
        </div>

        <p className={styles.content}>{comment.content}</p>

        <div className={styles.actions}>
          {onReply ? (
            <button type="button" className={styles.actionBtn} onClick={() => onReply(comment)}>
              回复
            </button>
          ) : null}
          {isMine && onDelete ? (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onDelete(comment)}
              aria-label="删除评论"
            >
              <TrashIcon width={14} height={14} />
              删除
            </button>
          ) : null}
        </div>

        {!isReply && replyBucket ? (
          <div className={styles.replies}>
            {!replyBucket.loaded ? (
              <button
                type="button"
                className={styles.toggleBtn}
                onClick={() => onToggleReplies?.(comment)}
                disabled={replyBucket.loading}
              >
                {replyBucket.loading
                  ? "加载中…"
                  : `查看回复${comment.replyCount ? ` (${comment.replyCount})` : ""}`}
              </button>
            ) : (
              <>
                {replyBucket.items.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    isReply
                    onReply={onReply}
                    onDelete={onDelete}
                  />
                ))}
                {replyBucket.hasMore ? (
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => onLoadMoreReplies?.(comment)}
                    disabled={replyBucket.loading}
                  >
                    {replyBucket.loading ? "加载中…" : "加载更多回复"}
                  </button>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CommentItem;
