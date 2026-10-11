import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { commentService } from "@/services/commentService";
import { CommentIcon } from "@/components/icons/Icon";
import CommentEditor from "./CommentEditor";
import CommentItem, { emptyReplyBucket, type ReplyBucket } from "./CommentItem";
import type { Comment, CommentPageResponse } from "@/types/comment";
import styles from "./CommentSection.module.css";

type CommentSectionProps = {
  postId: string;
};

const PAGE_SIZE = 20;

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { tokens } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [count, setCount] = useState(0);
  const [roots, setRoots] = useState<Comment[]>([]);
  const [rootCursor, setRootCursor] = useState<string | null>(null);
  const [hasMoreRoots, setHasMoreRoots] = useState(false);
  const [replyMap, setReplyMap] = useState<Record<string, ReplyBucket>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 正在回复的目标；回复框统一渲染在所属一级评论下方
  const [replyTarget, setReplyTarget] = useState<{
    comment: Comment;
    rootId: string;
  } | null>(null);

  const mustLogin = () => {
    navigate("/login", { state: { from: location.pathname } });
  };

  const applyRootPage = (page: CommentPageResponse) => {
    setRoots((prev) => [...prev, ...page.items]);
    setRootCursor(page.nextCursor);
    setHasMoreRoots(page.hasMore);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [countResp, page] = await Promise.all([
          commentService.count(postId),
          commentService.roots(postId, PAGE_SIZE)
        ]);
        if (cancelled) return;
        setCount(countResp ?? 0);
        applyRootPage(page);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "评论加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const loadMoreRoots = async () => {
    if (loadingMore || !hasMoreRoots || rootCursor == null) return;
    setLoadingMore(true);
    try {
      applyRootPage(await commentService.roots(postId, PAGE_SIZE, rootCursor));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreated = (comment: Comment) => {
    setCount((c) => c + 1);
    setRoots((prev) => [comment, ...prev]);
    setReplyTarget(null);
  };

  const handleReplyCreated = (rootId: string, comment: Comment) => {
    setCount((c) => c + 1);
    setRoots((prev) =>
      prev.map((r) =>
        r.id === rootId ? { ...r, replyCount: (r.replyCount ?? 0) + 1 } : r
      )
    );
    setReplyMap((prev) => {
      const key = String(rootId);
      const bucket = prev[key];
      // 回复列表尚未展开时不缓存，展开时会从后端拉取
      if (!bucket?.loaded) return prev;
      return { ...prev, [key]: { ...bucket, items: [...bucket.items, comment] } };
    });
    setReplyTarget(null);
  };

  const toggleReplies = async (root: Comment) => {
    const key = String(root.id);
    const bucket = replyMap[key];
    if (bucket?.loaded || bucket?.loading) return;
    setReplyMap((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyReplyBucket()), loading: true }
    }));
    try {
      const page = await commentService.replies(postId, root.id, PAGE_SIZE);
      setReplyMap((prev) => ({
        ...prev,
        [key]: {
          items: page.items,
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          loaded: true,
          loading: false
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复加载失败");
      setReplyMap((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? emptyReplyBucket()), loading: false }
      }));
    }
  };

  const loadMoreReplies = async (root: Comment) => {
    const key = String(root.id);
    const bucket = replyMap[key];
    if (!bucket?.loaded || bucket.loading || !bucket.hasMore || bucket.nextCursor == null) {
      return;
    }
    setReplyMap((prev) => ({ ...prev, [key]: { ...bucket, loading: true } }));
    try {
      const page = await commentService.replies(postId, root.id, PAGE_SIZE, bucket.nextCursor);
      setReplyMap((prev) => ({
        ...prev,
        [key]: {
          items: [...(prev[key]?.items ?? []), ...page.items],
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          loaded: true,
          loading: false
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "回复加载失败");
      setReplyMap((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? emptyReplyBucket()), loading: false }
      }));
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!tokens?.accessToken) {
      mustLogin();
      return;
    }
    const accessToken = tokens.accessToken;
    try {
      const ok = await commentService.remove(comment.id, accessToken);
      if (!ok) return;

      if (comment.rootId === "0") {
        setRoots((prev) => prev.filter((r) => r.id !== comment.id));
        setReplyMap((prev) => {
          const next = { ...prev };
          delete next[String(comment.id)];
          return next;
        });
      } else {
        const rootId = comment.rootId;
        setReplyMap((prev) => {
          const key = String(rootId);
          const bucket = prev[key];
          if (!bucket) return prev;
          return {
            ...prev,
            [key]: { ...bucket, items: bucket.items.filter((c) => c.id !== comment.id) }
          };
        });
        setRoots((prev) =>
          prev.map((r) =>
            r.id === rootId ? { ...r, replyCount: Math.max(0, (r.replyCount ?? 0) - 1) } : r
          )
        );
      }

      // 删除后重新拉取总数，保证与后端级联删除一致
      const latest = await commentService.count(postId).catch(() => null);
      if (latest != null) setCount(latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <section className={styles._section}>
      <div className={styles._head}>
        <CommentIcon width={20} height={20} />
        <h3 className={styles.title}>评论</h3>
        <span className={styles.count}>{count}</span>
      </div>

      <CommentEditor postId={postId} onSubmit={handleCreated} />

      {error ? <div className={styles.error}>{error}</div> : null}

      {loading ? (
        <div className={styles.empty}>加载中…</div>
      ) : roots.length === 0 ? (
        <div className={styles.empty}>还没有评论，来抢沙发</div>
      ) : (
        <ul className={styles.list}>
          {roots.map((root) => {
            const bucket = replyMap[String(root.id)] ?? emptyReplyBucket();
            return (
              <li key={root.id} className={styles.rootItem}>
                <CommentItem
                  comment={root}
                  replyBucket={bucket}
                  onReply={(comment) =>
                    setReplyTarget({
                      comment,
                      rootId: comment.rootId && comment.rootId !== "0" ? comment.rootId : root.id
                    })
                  }
                  onToggleReplies={toggleReplies}
                  onLoadMoreReplies={loadMoreReplies}
                  onDelete={handleDelete}
                />
                {replyTarget?.rootId === root.id ? (
                  <div className={styles.inlineEditor}>
                    <CommentEditor
                      postId={postId}
                      parentId={replyTarget.comment.id}
                      placeholder={`回复 @${replyTarget.comment.nickname}`}
                      compact
                      onSubmit={(comment) => handleReplyCreated(root.id, comment)}
                      onCancel={() => setReplyTarget(null)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {hasMoreRoots ? (
        <button
          type="button"
          className={styles.loadMore}
          onClick={loadMoreRoots}
          disabled={loadingMore}
        >
          {loadingMore ? "加载中…" : "加载更多"}
        </button>
      ) : null}
    </section>
  );
};

export default CommentSection;
