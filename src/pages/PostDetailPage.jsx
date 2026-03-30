import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import NotificationBell from '../components/NotificationBell';

// ─── 재귀 댓글 컴포넌트 ──────────────────────────────────────────────────────
function CommentItem({
  comment, depth = 0,
  postId, payload, isAdmin,
  editingCommentId, editingContent, setEditingCommentId, setEditingContent,
  replyingToId, setReplyingToId, replyInput, setReplyInput,
  onEdit, onDelete, onReply, onLike,
}) {
  const isMyComment = payload && comment.authorId === payload.userId;
  const canManage = isMyComment || isAdmin;
  const isEditing = editingCommentId === comment.id;
  const isReplying = replyingToId === comment.id;
  const indentPx = Math.min(depth, 4) * 20;

  return (
    <li style={{ marginLeft: indentPx }} className={`py-3 ${depth > 0 ? 'border-l-2 border-blue-100 pl-3' : ''}`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {depth > 0 && <span className="text-blue-400 text-xs">↳</span>}
            <span className="text-sm font-semibold text-gray-700">{comment.authorName}</span>
            <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
            {comment.updatedAt !== comment.createdAt && !comment.deleted && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
          </div>

          {isEditing ? (
            <div className="flex gap-2 mt-1">
              <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none resize-none" rows={2} />
              <div className="flex flex-col gap-1">
                <button onClick={() => onEdit(comment.id)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium">저장</button>
                <button onClick={() => { setEditingCommentId(null); setEditingContent(''); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs">취소</button>
              </div>
            </div>
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${comment.deleted ? 'text-gray-400 italic' : 'text-gray-600'}`}>{comment.content}</p>
          )}

          {isReplying && (
            <div className="flex gap-2 mt-2">
              <textarea value={replyInput} onChange={e => setReplyInput(e.target.value)}
                placeholder="답글을 입력하세요..." autoFocus
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none resize-none" rows={2} />
              <div className="flex flex-col gap-1">
                <button onClick={() => onReply(comment.id)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium">등록</button>
                <button onClick={() => { setReplyingToId(null); setReplyInput(''); }} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs">취소</button>
              </div>
            </div>
          )}
        </div>

        {!isEditing && !comment.deleted && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${comment.likedByMe ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-100'}`}>
              <span>{comment.likedByMe ? '❤️' : '🤍'}</span>
              {comment.likeCount > 0 && <span className="font-medium">{comment.likeCount}</span>}
            </button>
            {payload && (
              <button onClick={() => { setReplyingToId(isReplying ? null : comment.id); setReplyInput(''); }}
                className="px-2 py-1 text-xs text-green-500 hover:bg-green-50 rounded-lg transition-colors">답글</button>
            )}
            {canManage && isMyComment && (
              <button onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">수정</button>
            )}
            {canManage && (
              <button onClick={() => onDelete(comment.id)} className="px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">삭제</button>
            )}
          </div>
        )}
      </div>

      {comment.children?.length > 0 && (
        <ul className="mt-1 divide-y divide-gray-50">
          {comment.children.map(child => (
            <CommentItem key={child.id} comment={child} depth={depth + 1}
              postId={postId} payload={payload} isAdmin={isAdmin}
              editingCommentId={editingCommentId} editingContent={editingContent}
              setEditingCommentId={setEditingCommentId} setEditingContent={setEditingContent}
              replyingToId={replyingToId} setReplyingToId={setReplyingToId}
              replyInput={replyInput} setReplyInput={setReplyInput}
              onEdit={onEdit} onDelete={onDelete} onReply={onReply} onLike={onLike} />
          ))}
        </ul>
      )}
    </li>
  );
}

function countAllComments(comments) {
  let count = 0;
  for (const c of comments) {
    if (!c.deleted) count++;
    if (c.children?.length) count += countAllComments(c.children);
  }
  return count;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [files, setFiles] = useState([]);

  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyInput, setReplyInput] = useState('');
  const [commentError, setCommentError] = useState('');

  const [likeCount, setLikeCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin = payload?.role === 'ROLE_ADMIN';
  const isAuthor = post && payload && post.authorId === payload.userId;
  const canEdit = isAuthor || isAdmin;

  useEffect(() => { loadPost(); loadComments(); loadFiles(); }, [id]);

  const loadPost = async () => {
    setLoading(true);
    const res = await authFetch(`/api/posts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPost(data);
      setLikeCount(data.likeCount ?? 0);
      setLikedByMe(data.likedByMe ?? false);
    } else setErrorMsg('게시글을 불러올 수 없습니다.');
    setLoading(false);
  };

  const loadComments = async () => {
    const res = await authFetch(`/api/posts/${id}/comments`);
    if (res.ok) setComments((await res.json()).comments);
  };

  const loadFiles = async () => {
    const res = await authFetch(`/api/posts/${id}/files`);
    if (res.ok) setFiles(await res.json());
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    setCommentLoading(true); setCommentError('');
    const res = await authFetch(`/api/posts/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentInput.trim() }),
    });
    if (res.ok) { setCommentInput(''); loadComments(); }
    else { const d = await res.json(); setCommentError(d.message || '댓글 작성에 실패했습니다.'); }
    setCommentLoading(false);
  };

  const handleReply = async (parentId) => {
    if (!replyInput.trim()) return;
    setCommentError('');
    const res = await authFetch(`/api/posts/${id}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyInput.trim(), parentId }),
    });
    if (res.ok) { setReplyingToId(null); setReplyInput(''); loadComments(); }
    else { const d = await res.json(); setCommentError(d.message || '답글 작성에 실패했습니다.'); }
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    const res = await authFetch(`/api/posts/${id}/comments/${commentId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingContent.trim() }),
    });
    if (res.ok) { setEditingCommentId(null); setEditingContent(''); loadComments(); }
    else { const d = await res.json(); setCommentError(d.message || '댓글 수정에 실패했습니다.'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const res = await authFetch(`/api/posts/${id}/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) loadComments();
    else { const d = await res.json(); setCommentError(d.message || '댓글 삭제에 실패했습니다.'); }
  };

  const handleLikeComment = async (commentId) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    const res = await authFetch(`/api/posts/${id}/comments/${commentId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      const update = (list) => list.map(c => {
        if (c.id === commentId) return { ...c, likeCount: data.likeCount, likedByMe: data.liked };
        if (c.children?.length) return { ...c, children: update(c.children) };
        return c;
      });
      setComments(prev => update(prev));
    }
  };

  const handleToggleLike = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setLikeLoading(true);
    const res = await authFetch(`/api/posts/${id}/like`, { method: 'POST' });
    if (res.ok) { const d = await res.json(); setLikeCount(d.likeCount); setLikedByMe(d.liked); }
    setLikeLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?\n삭제된 글은 관리자 페이지에서 복구할 수 있습니다.')) return;
    const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) navigate('/board');
    else { const d = await res.json(); setErrorMsg(d.message || '삭제에 실패했습니다.'); }
  };

  const handleTogglePin = async () => {
    setPinLoading(true);
    const res = await authFetch(`/api/posts/${id}/pin`, { method: 'PATCH' });
    if (res.ok) { const d = await res.json(); setPost(prev => ({ ...prev, pinned: d.pinned })); }
    else { const d = await res.json(); alert(d.message || '핀 설정에 실패했습니다.'); }
    setPinLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;
  if (errorMsg) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{errorMsg}</p>
        <button onClick={() => navigate('/board')} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">목록으로</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-3xl mx-auto">

        {/* 상단 버튼 영역 */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/board')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            ← 목록으로
          </button>
          <div className="flex items-center gap-2">
            {isLoggedIn && <NotificationBell />}
            {isAdmin && post.category === 'NOTICE' && (
              <button onClick={handleTogglePin} disabled={pinLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  post.pinned ? 'bg-amber-400 hover:bg-amber-500 text-white' : 'bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600'
                }`}>
                {post.pinned ? '📌 고정 해제' : '📌 상단 고정'}
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={() => navigate(`/board/${id}/edit`)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">수정</button>
                <button onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">삭제</button>
              </>
            )}
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="bg-white rounded-2xl shadow p-8">
          <div className="mb-6">
            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${post.category === 'NOTICE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              {post.categoryName}
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">{post.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400 pb-6 border-b border-gray-100">
            <span>✍️ {post.authorName}</span>
            <span>📅 {new Date(post.createdAt).toLocaleString('ko-KR')}</span>
            {post.updatedAt !== post.createdAt && <span>✏️ 수정됨 {new Date(post.updatedAt).toLocaleString('ko-KR')}</span>}
            <span>👁️ {post.viewCount}</span>
          </div>
          <div className="pt-6 text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>

          {/* 좋아요 */}
          <div className="flex justify-center mt-8 pt-6 border-t border-gray-100">
            <button onClick={handleToggleLike} disabled={likeLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                likedByMe ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400'
              }`}>
              <span className="text-base">{likedByMe ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
          </div>

          {/* 첨부 파일 */}
          {files.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-600 mb-3">📎 첨부 파일 ({files.length})</p>
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file.id}>
                    {file.image ? (
                      <a href={`http://localhost:8080${file.downloadUrl}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 transition-colors">
                        <span>🖼️</span><span className="truncate">{file.originalName}</span>
                        <span className="text-xs text-gray-400 shrink-0">({(file.fileSize / 1024).toFixed(1)}KB)</span>
                      </a>
                    ) : (
                      <a href={`http://localhost:8080${file.downloadUrl}`} download={file.originalName}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors">
                        <span>📄</span><span className="truncate">{file.originalName}</span>
                        <span className="text-xs text-gray-400 shrink-0">({(file.fileSize / 1024).toFixed(1)}KB)</span>
                        <span className="text-xs text-blue-400 shrink-0">↓</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 댓글 영역 */}
        <div className="bg-white rounded-2xl shadow p-8 mt-4">
          <h2 className="text-base font-bold text-gray-700 mb-5">
            💬 댓글 <span className="text-blue-500">{countAllComments(comments)}</span>
          </h2>

          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">첫 번째 댓글을 남겨보세요!</p>
          ) : (
            <ul className="divide-y divide-gray-100 mb-6">
              {comments.map(comment => (
                <CommentItem key={comment.id} comment={comment} depth={0} postId={id}
                  payload={payload} isAdmin={isAdmin}
                  editingCommentId={editingCommentId} editingContent={editingContent}
                  setEditingCommentId={setEditingCommentId} setEditingContent={setEditingContent}
                  replyingToId={replyingToId} setReplyingToId={setReplyingToId}
                  replyInput={replyInput} setReplyInput={setReplyInput}
                  onEdit={handleEditComment} onDelete={handleDeleteComment}
                  onReply={handleReply} onLike={handleLikeComment} />
              ))}
            </ul>
          )}

          {commentError && <p className="text-sm text-red-500 mb-3">⚠️ {commentError}</p>}

          {isLoggedIn ? (
            <div className="flex gap-3 mt-2">
              <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                placeholder="댓글을 입력하세요... (Shift+Enter 줄바꿈)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none" rows={2} />
              <button onClick={handleSubmitComment} disabled={commentLoading || !commentInput.trim()}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white rounded-xl text-sm font-medium transition-colors self-end">
                {commentLoading ? '...' : '등록'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">
              댓글을 작성하려면{' '}
              <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline">로그인</button>이 필요합니다.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
