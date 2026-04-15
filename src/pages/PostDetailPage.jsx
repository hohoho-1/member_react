import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from '../components/UserAvatar';
import { SkeletonPage } from '../components/SkeletonLoader';

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
            <UserAvatar profileImageUrl={comment.authorProfileImageUrl} username={comment.authorName} size={6} />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{comment.authorName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
            {comment.updatedAt !== comment.createdAt && !comment.deleted && (
              <span className="text-xs text-gray-400">(수정됨)</span>
            )}
          </div>

          {isEditing ? (
            <div className="flex gap-2 mt-1">
              <textarea value={editingContent} onChange={e => setEditingContent(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none resize-none" rows={2} />
              <div className="flex flex-col gap-1">
                <button onClick={() => onEdit(comment.id)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium">저장</button>
                <button onClick={() => { setEditingCommentId(null); setEditingContent(''); }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs">취소</button>
              </div>
            </div>
          ) : (
            <p className={`text-sm whitespace-pre-wrap ${comment.deleted ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-600 dark:text-gray-300'}`}>{comment.content}</p>
          )}

          {isReplying && (
            <div className="flex gap-2 mt-2">
              <textarea value={replyInput} onChange={e => setReplyInput(e.target.value)}
                placeholder="답글을 입력하세요..." autoFocus
                className="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none resize-none" rows={2} />
              <div className="flex flex-col gap-1">
                <button onClick={() => onReply(comment.id)} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium">등록</button>
                <button onClick={() => { setReplyingToId(null); setReplyInput(''); }} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs">취소</button>
              </div>
            </div>
          )}
        </div>

        {!isEditing && !comment.deleted && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${comment.likedByMe ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
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

// ─── FAQ 아코디언 컴포넌트 ──────────────────────────────────────────────────
function FaqAccordion({ title, content }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-green-300 shadow-sm' : 'border-gray-200'}`}>
      <button
        onClick={() => setOpen(v => !v)}
                className={`w-full flex items-start justify-between gap-3 px-5 py-4 text-left transition-colors ${open ? 'bg-green-50 dark:bg-green-950' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">Q</span>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-relaxed">{title}</span>
        </div>
        <span className={`shrink-0 text-green-500 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-white dark:bg-gray-800 border-t border-green-100 dark:border-green-900">
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-xs font-bold flex items-center justify-center">A</span>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{content}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 답변 아이템 컴포넌트 ────────────────────────────────────────────────────
function AnswerItem({ answer, isAdmin, onEdit, onDelete, colorScheme = 'amber' }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);

  const colors = {
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-500',
      inputBorder: 'border-amber-300 dark:border-amber-700',
      saveBg: 'bg-amber-500 hover:bg-amber-600',
      editText: 'text-amber-600 dark:text-amber-400', editHover: 'hover:bg-amber-100 dark:hover:bg-amber-900',
    },
    teal: {
      bg: 'bg-teal-50 dark:bg-teal-950', border: 'border-teal-200 dark:border-teal-800',
      badge: 'bg-teal-500',
      inputBorder: 'border-teal-300 dark:border-teal-700',
      saveBg: 'bg-teal-500 hover:bg-teal-600',
      editText: 'text-teal-600 dark:text-teal-400', editHover: 'hover:bg-teal-100 dark:hover:bg-teal-900',
    },
  };
  const c = colors[colorScheme] ?? colors.amber;

  const handleSave = () => {
    if (!editContent.trim()) return;
    onEdit(answer.id, editContent.trim());
    setIsEditing(false);
  };

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`px-2 py-0.5 ${c.badge} text-white text-xs font-bold rounded-full`}>관리자 답변</span>
            <UserAvatar profileImageUrl={answer.authorProfileImageUrl} username={answer.authorName} size={6} />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{answer.authorName}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(answer.createdAt).toLocaleString('ko-KR')}</span>
            {answer.updatedAt !== answer.createdAt && <span className="text-xs text-gray-400 dark:text-gray-500">(수정됨)</span>}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                className={`flex-1 px-3 py-2 border ${c.inputBorder} rounded-lg text-sm focus:outline-none resize-none bg-white dark:bg-gray-800`} rows={4} />
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={handleSave} className={`px-3 py-1 ${c.saveBg} text-white rounded-lg text-xs font-medium`}>저장</button>
                <button onClick={() => { setIsEditing(false); setEditContent(answer.content); }}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-xs">취소</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{answer.content}</p>
          )}
        </div>
        {isAdmin && !isEditing && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => { setIsEditing(true); setEditContent(answer.content); }}
              className={`px-2 py-1 text-xs ${c.editText} ${c.editHover} rounded-lg transition-colors`}>수정</button>
            <button onClick={() => onDelete(answer.id)}
              className="px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">삭제</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const boardScope   = searchParams.get('scope') ?? searchParams.get('category') ?? 'ALL';
  const boardKeyword = searchParams.get('keyword') ?? '';
  const boardSort    = searchParams.get('sort') ?? 'latest';
  const returnTo     = decodeURIComponent(searchParams.get('returnTo') ?? '/community');

  const [post, setPost]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [files, setFiles]     = useState([]);

  // 댓글
  const [comments, setComments]               = useState([]);
  const [commentInput, setCommentInput]       = useState('');
  const [commentLoading, setCommentLoading]   = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent]   = useState('');
  const [replyingToId, setReplyingToId]       = useState(null);
  const [replyInput, setReplyInput]           = useState('');
  const [commentError, setCommentError]       = useState('');

  // 답변 (QnA / SUGGESTION)
  const [answers, setAnswers]           = useState([]);
  const [answerInput, setAnswerInput]   = useState('');
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError]   = useState('');

  const [likeCount, setLikeCount]         = useState(0);
  const [likedByMe, setLikedByMe]         = useState(false);
  const [likeLoading, setLikeLoading]     = useState(false);
  const [bookmarkedByMe, setBookmarkedByMe] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [pinLoading, setPinLoading]       = useState(false);
  const [adjacent, setAdjacent]           = useState({ prev: null, next: null });

  const payload    = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin    = payload?.role === 'ROLE_ADMIN';
  const isAuthor   = post && payload && post.authorId === payload.userId;
  const canEdit    = isAuthor || isAdmin;
  const isQnA        = post?.boardCode === 'QNA';
  const isFAQ        = post?.boardCode === 'FAQ';
  const isSuggestion = post?.boardCode === 'SUGGESTION';
  const allowComment    = post?.boardAllowComment ?? true;
  const allowAttachment = post?.boardAllowAttachment ?? true;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPost(); loadComments(); loadFiles(); }, [id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAdjacent(); }, [id, boardScope, boardKeyword, boardSort]);

  const loadPost = async () => {
    setLoading(true);
    const res = await authFetch(`/api/posts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setPost(data);
      setLikeCount(data.likeCount ?? 0);
      setLikedByMe(data.likedByMe ?? false);
      setBookmarkedByMe(data.bookmarkedByMe ?? false);
      if (data.boardCode === 'FAQ' && !isAdmin) { navigate('/support?scope=FAQ', { replace: true }); return; }
      if (data.boardCode === 'QNA' || data.boardCode === 'SUGGESTION') loadAnswers();
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

  const loadAdjacent = async () => {
    const params = new URLSearchParams({ scope: boardScope, keyword: boardKeyword, sort: boardSort });
    const res = await authFetch(`/api/posts/${id}/adjacent?${params}`);
    if (res.ok) setAdjacent(await res.json());
  };

  // ── 답변 ──────────────────────────────────────────────────────────────────
  const loadAnswers = async () => {
    const res = await authFetch(`/api/posts/${id}/answers`);
    if (res.ok) setAnswers((await res.json()).answers);
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim()) return;
    setAnswerLoading(true); setAnswerError('');
    try {
      const res = await authFetch(`/api/posts/${id}/answers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: answerInput.trim() }),
      });
      if (res.ok) { setAnswerInput(''); await loadAnswers(); }
      else { const d = await res.json(); setAnswerError(d.message || '답변 작성에 실패했습니다.'); }
    } catch { setAnswerError('네트워크 오류가 발생했습니다.'); }
    setAnswerLoading(false);
  };

  const handleEditAnswer = async (answerId, content) => {
    setAnswerError('');
    const res = await authFetch(`/api/posts/${id}/answers/${answerId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) loadAnswers();
    else { const d = await res.json(); setAnswerError(d.message || '답변 수정에 실패했습니다.'); }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm('답변을 삭제하시겠습니까?')) return;
    const res = await authFetch(`/api/posts/${id}/answers/${answerId}`, { method: 'DELETE' });
    if (res.ok) loadAnswers();
    else { const d = await res.json(); setAnswerError(d.message || '답변 삭제에 실패했습니다.'); }
  };

  // ── 댓글 ──────────────────────────────────────────────────────────────────
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
    if (!isLoggedIn) { navigate('/login', { state: { from: location } }); return; }
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
    if (!isLoggedIn) { navigate('/login', { state: { from: location } }); return; }
    setLikeLoading(true);
    const res = await authFetch(`/api/posts/${id}/like`, { method: 'POST' });
    if (res.ok) { const d = await res.json(); setLikeCount(d.likeCount); setLikedByMe(d.liked); }
    setLikeLoading(false);
  };

  const handleToggleBookmark = async () => {
    if (!isLoggedIn) { navigate('/login', { state: { from: location } }); return; }
    setBookmarkLoading(true);
    const res = await authFetch(`/api/users/me/bookmarks/${id}`, { method: 'POST' });
    if (res.ok) { const d = await res.json(); setBookmarkedByMe(d.bookmarked); }
    setBookmarkLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?\n삭제된 글은 관리자 페이지에서 복구할 수 있습니다.')) return;
    const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) navigate(returnTo);
    else { const d = await res.json(); setErrorMsg(d.message || '삭제에 실패했습니다.'); }
  };

  const handleTogglePin = async () => {
    setPinLoading(true);
    const res = await authFetch(`/api/posts/${id}/pin`, { method: 'PATCH' });
    if (res.ok) { const d = await res.json(); setPost(prev => ({ ...prev, pinned: d.pinned })); }
    else { const d = await res.json(); alert(d.message || '핀 설정에 실패했습니다.'); }
    setPinLoading(false);
  };

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');       // 라디오 선택값
  const [reportCustom, setReportCustom] = useState('');       // 직접 입력값
  const [reporting, setReporting] = useState(false);

  const reportFinalReason = reportReason === '__custom__' ? reportCustom : reportReason;

  const handleReport = async () => {
    if (!reportFinalReason.trim()) { alert('신고 사유를 입력해주세요.'); return; }
    setReporting(true);
    const res = await authFetch(`/api/reports/posts/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportFinalReason.trim() }),
    });
    setReporting(false);
    if (res.ok) {
      alert('신고가 접수되었습니다.');
      setReportModalOpen(false);
      setReportReason('');
      setReportCustom('');
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.message || '신고에 실패했습니다.');
    }
  };

  if (loading) return <SkeletonPage />;
  if (errorMsg) return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{errorMsg}</p>
        <button onClick={() => navigate('/board')} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">목록으로</button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">

        {/* 상단 버튼 영역 */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(returnTo)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
            ← 목록으로
          </button>
          <div className="flex items-center gap-2">
            {/* 신고 버튼 - 본인 글·관리자 제외, 로그인 필요 */}
            {isLoggedIn && !isAuthor && !isAdmin && !isFAQ && (
              <button onClick={() => setReportModalOpen(true)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200">
                🚨 신고
              </button>
            )}
            {isAdmin && post.boardAdminOnly && (
              <button onClick={handleTogglePin} disabled={pinLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  post.pinned ? 'bg-amber-400 hover:bg-amber-500 text-white' : 'bg-gray-100 hover:bg-amber-100 text-gray-500 hover:text-amber-600'
                }`}>
                {post.pinned ? '📌 고정 해제' : '📌 상단 고정'}
              </button>
            )}
            {canEdit && (
              <>
                <button onClick={() => navigate(`/board/${id}/edit?boardCode=${post?.boardCode ?? ''}&returnTo=${encodeURIComponent(returnTo)}`)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">수정</button>
                <button onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">삭제</button>
              </>
            )}
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8">
          <div className="mb-6">
            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
              post.boardCode === 'NOTICE'     ? 'bg-red-100 text-red-600' :
              post.boardCode === 'GALLERY'    ? 'bg-purple-100 text-purple-600' :
              post.boardCode === 'QNA'        ? 'bg-amber-100 text-amber-700' :
              post.boardCode === 'FAQ'        ? 'bg-green-100 text-green-700' :
              post.boardCode === 'SUGGESTION' ? 'bg-teal-100 text-teal-700' :
              'bg-blue-100 text-blue-600'
            }`}>
              {post.boardName}
            </span>
            {/* QnA 답변 상태 뱃지 */}
            {isQnA && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                answers.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {answers.length > 0 ? `✅ 답변완료 (${answers.length})` : '⏳ 답변대기'}
              </span>
            )}
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-3">{post.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500 pb-6 border-b border-gray-100 dark:border-gray-700 flex-wrap">
            <span>✍️ {post.authorName}</span>
            <span>📅 {new Date(post.createdAt).toLocaleString('ko-KR')}</span>
            {post.updatedAt !== post.createdAt && (
              <span>
                ✏️ 수정됨 {new Date(post.updatedAt).toLocaleString('ko-KR')}
                {post.lastModifiedBy && post.lastModifiedById !== post.authorId && (
                  <span className="ml-1 text-orange-400">(수정자: {post.lastModifiedBy})</span>
                )}
              </span>
            )}
            <span>👁️ {post.viewCount}</span>
          </div>

          {/* FAQ는 본문 숨기고 아코디언만 표시 */}
          {!isFAQ && (
            <div className="pt-6 text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.content}</div>
          )}

          {/* 좋아요 + 북마크 (FAQ 제외) */}
          {!isFAQ && (
            <div className="flex justify-center items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              <button onClick={handleToggleLike} disabled={likeLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  likedByMe ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-400'
                }`}>
                <span className="text-base">{likedByMe ? '❤️' : '🤍'}</span>
                <span>{likeCount}</span>
              </button>
              <button onClick={handleToggleBookmark} disabled={bookmarkLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  bookmarkedByMe ? 'bg-amber-400 text-white hover:bg-amber-500 shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-500'
                }`}>
                <span className="text-base">🔖</span>
                <span>{bookmarkedByMe ? '북마크 해제' : '북마크'}</span>
              </button>
            </div>
          )}

          {/* 이전/다음 글 */}
          {(adjacent.prev || adjacent.next) && (
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
              <div className="flex flex-col divide-y divide-gray-100 text-sm">
                {adjacent.prev && (
                  <button
                    onClick={() => navigate(`/board/${adjacent.prev.id}?scope=${boardScope}&keyword=${encodeURIComponent(boardKeyword)}&sort=${boardSort}&returnTo=${encodeURIComponent(returnTo)}`)}
                    className="flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors group">
                    <span className="text-gray-400 dark:text-gray-500 shrink-0">▲ 이전 글</span>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 truncate transition-colors">{adjacent.prev.title}</span>
                  </button>
                )}
                {adjacent.next && (
                  <button
                    onClick={() => navigate(`/board/${adjacent.next.id}?scope=${boardScope}&keyword=${encodeURIComponent(boardKeyword)}&sort=${boardSort}&returnTo=${encodeURIComponent(returnTo)}`)}
                    className="flex items-center gap-3 py-2.5 text-left hover:bg-gray-50 rounded-lg px-2 transition-colors group">
                    <span className="text-gray-400 dark:text-gray-500 shrink-0">▼ 다음 글</span>
                    <span className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 truncate transition-colors">{adjacent.next.title}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 첨부 파일 */}
          {allowAttachment && files.length > 0 && (() => {
            const imageFiles = files.filter(f => f.image);
            const docFiles   = files.filter(f => !f.image);
            return (
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
                {imageFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-3">🖼️ 이미지 ({imageFiles.length})</p>
                    <div className="space-y-3">
                      {imageFiles.map(file => (
                        <div key={file.id} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                          <img src={`http://localhost:8080${file.downloadUrl}`} alt={file.originalName}
                            className="w-full max-h-[600px] object-contain bg-white" />
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-xs text-gray-400 truncate">{file.originalName} ({(file.fileSize / 1024).toFixed(1)}KB)</span>
                            <a href={`http://localhost:8080${file.downloadUrl}/download`}
                              className="text-xs text-blue-500 hover:text-blue-700 hover:underline shrink-0 ml-2">↓ 다운로드</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {docFiles.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-3">📎 첨부 파일 ({docFiles.length})</p>
                    <div className="space-y-2">
                      {docFiles.map(file => (
                        <a key={file.id} href={`http://localhost:8080${file.downloadUrl}/download`}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors">
                          <span>📄</span>
                          <span className="truncate flex-1">{file.originalName}</span>
                          <span className="text-xs text-gray-400 shrink-0">({(file.fileSize / 1024).toFixed(1)}KB)</span>
                          <span className="text-xs text-blue-400 shrink-0">↓ 다운로드</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── FAQ 아코디언 뷰 ─────────────────────────────────────────────── */}
        {isFAQ && (
          <div className="bg-white rounded-2xl shadow p-8 mt-4 border-l-4 border-green-400">
            <h2 className="text-base font-bold text-gray-700 mb-5">❓ FAQ</h2>
            <FaqAccordion title={post.title} content={post.content} />
          </div>
        )}

        {/* ── QnA 답변 섹션 ───────────────────────────────────────────────── */}
        {isQnA && (
          <div className="bg-white rounded-2xl shadow p-8 mt-4 border-l-4 border-amber-400">
            <h2 className="text-base font-bold text-gray-700 mb-5">
              💡 답변 <span className="text-amber-500">{answers.length}</span>
            </h2>
            {answers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 bg-amber-50 dark:bg-amber-950 rounded-xl">아직 등록된 답변이 없습니다.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {answers.map(answer => (
                  <AnswerItem key={answer.id} answer={answer} isAdmin={isAdmin}
                    onEdit={handleEditAnswer} onDelete={handleDeleteAnswer} colorScheme="amber" />
                ))}
              </div>
            )}
            {answerError && <p className="text-sm text-red-500 mb-3">⚠️ {answerError}</p>}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-2">관리자 답변 작성</p>
                <div className="flex gap-3">
                  <textarea value={answerInput} onChange={e => setAnswerInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer(); } }}
                    placeholder="답변을 입력하세요... (Shift+Enter 줄바꿈)"
                    className="flex-1 px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none bg-amber-50 dark:bg-amber-950" rows={3} />
                  <button onClick={handleSubmitAnswer} disabled={answerLoading || !answerInput.trim()}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 text-white rounded-xl text-sm font-medium transition-colors self-end">
                    {answerLoading ? '...' : '등록'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 건의사항 답변 섹션 ──────────────────────────────────────────── */}
        {isSuggestion && (
          <div className="bg-white rounded-2xl shadow p-8 mt-4 border-l-4 border-teal-400">
            <h2 className="text-base font-bold text-gray-700 mb-5">
              💬 답변 <span className="text-teal-500">{answers.length}</span>
            </h2>
            {answers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 bg-teal-50 dark:bg-teal-950 rounded-xl">아직 등록된 답변이 없습니다.</p>
            ) : (
              <div className="space-y-4 mb-6">
                {answers.map(answer => (
                  <AnswerItem key={answer.id} answer={answer} isAdmin={isAdmin}
                    onEdit={handleEditAnswer} onDelete={handleDeleteAnswer} colorScheme="teal" />
                ))}
              </div>
            )}
            {answerError && <p className="text-sm text-red-500 mb-3">⚠️ {answerError}</p>}
            {isAdmin && (
              <div className="mt-4 pt-4 border-t border-teal-100">
                <p className="text-xs text-teal-600 font-medium mb-2">관리자 답변 작성</p>
                <div className="flex gap-3">
                  <textarea value={answerInput} onChange={e => setAnswerInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer(); } }}
                    placeholder="답변을 입력하세요... (Shift+Enter 줄바꿈)"
                    className="flex-1 px-4 py-3 border border-teal-200 dark:border-teal-700 rounded-xl text-sm focus:outline-none focus:border-teal-400 resize-none bg-teal-50 dark:bg-teal-950" rows={3} />
                  <button onClick={handleSubmitAnswer} disabled={answerLoading || !answerInput.trim()}
                    className="px-5 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-200 text-white rounded-xl text-sm font-medium transition-colors self-end">
                    {answerLoading ? '...' : '등록'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 댓글 영역 (FAQ 제외, allowComment인 경우만) ────────────────────────────────────── */}
        {!isFAQ && allowComment && (
          <div className="bg-white rounded-2xl shadow p-8 mt-4">
            <h2 className="text-base font-bold text-gray-700 dark:text-gray-100 mb-5">💬 댓글 <span className="text-blue-500">{countAllComments(comments)}</span></h2>

            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">첫 번째 댓글을 남겨보세요!</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 mb-6">
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
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none" rows={2} />
                <button onClick={handleSubmitComment} disabled={commentLoading || !commentInput.trim()}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white rounded-xl text-sm font-medium transition-colors self-end">
                  {commentLoading ? '...' : '등록'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">
                댓글을 작성하려면{' '}
                <button onClick={() => navigate('/login', { state: { from: location } })} className="text-blue-500 hover:underline">로그인</button>이 필요합니다.
              </p>
            )}
          </div>
        )}

      </div>

      {/* 신고 모달 */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">🚨 게시글 신고</h3>
            <p className="text-xs text-gray-400 mb-4">신고 내용은 관리자가 검토 후 처리합니다.</p>
            <div className="space-y-2 mb-4">
              {['스팸/광고', '욕설/혐오', '음란물', '개인정보 노출', '불법 정보'].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="reason" value={r}
                    checked={reportReason === r}
                    onChange={e => setReportReason(e.target.value)}
                    className="accent-red-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                </label>
              ))}
              {/* 기타 - 직접 입력 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="reason" value="__custom__"
                  checked={reportReason === '__custom__'}
                  onChange={() => setReportReason('__custom__')}
                  className="accent-red-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">기타</span>
              </label>
              {reportReason === '__custom__' && (
                <input
                  type="text"
                  placeholder="신고 사유를 직접 입력해주세요."
                  value={reportCustom}
                  onChange={e => setReportCustom(e.target.value)}
                  autoFocus
                  className="w-full mt-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setReportModalOpen(false); setReportReason(''); setReportCustom(''); }}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={handleReport} disabled={reporting || !reportReason.trim()}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors">
                {reporting ? '신고 중...' : '신고하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
