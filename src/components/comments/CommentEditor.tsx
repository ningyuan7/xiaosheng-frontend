import {useAuth} from "@/context/AuthContext";
import {useLocation, useNavigate} from "react-router-dom";
import {useState} from "react";
import {commentService} from "@/services/commentService";
import type {Comment} from "@/types/comment";
import styles from "./CommentEditor.module.css";

type CommentEditorProps = {
    postId: string;
    parentId?: string|null;
    placeholder?:string;
    compact?: boolean;
    onSubmit:(comment: Comment)=>void;
    onCancel?:()=>void;
};
const CommentEditor =({
    postId,
    parentId,
    placeholder = "说点什么...",
    compact = false,
    onSubmit,
    onCancel

}: CommentEditorProps)=>{
    const{ tokens} =useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const mustLogin = ()=>{
        navigate("/login",{state:{from:location.pathname}});
    };
    if(!tokens?.accessToken){
        return (
            <div className={`${styles.loginTip}${compact?styles.compact:""}`}>
                <button type="button" onClick = {mustLogin}>
                    登陆后参加评论
                </button>
            </div>
        );
    }
    const accessToken = tokens.accessToken;
    const submit = async()=>{
        const text = content.trim();
        if(!text||submitting) return;
        setSubmitting(true);
        setError(null);
        try{
            const comment = await commentService.create(
                {
                    postId, content: text, parentId: parentId ?? null
                },
                accessToken
            );
            // 数据返回后：清空输入框，评论自动插入列表，按钮马上恢复为“发布”
            setContent("");
            onSubmit(comment);
            setSuccess(true);
            window.setTimeout(() => setSuccess(false), 2000);
        }catch(err){
            setError(err instanceof Error ?err.message:"发布失败");
        }finally{
            setSubmitting(false);
        }
    };
    return (
        <div className={`${styles.editor} ${compact ? styles.compact : ""}`}>
      <textarea
          className={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
          rows={compact ? 2 : 3}
      />
            <div className={styles.controls}>
                {onCancel ? (
                    <button type="button" className={styles.cancel} onClick={onCancel}>
                        取消
                    </button>
                ) : null}
                <button
                    type="button"
                    className={styles.submit}
                    onClick={submit}
                    disabled={!content.trim() || submitting}
                >
                    {submitting ? "发布中…" : "发布"}
                </button>
            </div>
            {error ? <div className={styles.error}>{error}</div> : null}
            {success ? <div className={styles.successToast}>发布成功</div> : null}
        </div>
    );

};
export default CommentEditor;
