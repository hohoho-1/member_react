import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 댓글 상태
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [commentError, setCommentError] = useState('');

  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin = payload?.role === 'ROLE_ADMIN';
  const isAuthor = post && payload && post.authorId === payload.userId;
  const canEdit = isAuthor || isAdmin;

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    const res = await authFetch(`/api/posts/${id}`);
    if (res.ok) {
      setPost(await res.json());
    } else {
      setErrorMsg('게시글을 불러올 수 없습니다.');
    }
    setLoading(false);
  };

  const loadComments = async () => {
    const res = await authFetch(`/api/posts/${id}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    setCommentLoading(true);
    setCommentError('');
    const res = await authFetch(`/api/posts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentInput.trim() }),
    });
    if (res.ok) {
      setCommentInput('');
      loadComments();
    } else {
      const data = await res.json();
      setCommentError(data.message || '댓글 작성에 실패했습니다.');
    }
    setCommentLoading(false);
  };

  const handleEditComment = async (commentId) => {
    if (!editingContent.trim()) return;
    const res = await authFetch(`/api/posts/${id}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editingContent.trim() }),
    });
    if (res.ok) {
      setEditingCommentId(null);
      setEditingContent('');
      loadComments();
    } else {
      const data = await res.json();
      setCommentError(data.message || '댓글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const res = await authFetch(`/api/posts/${id}/comments/${commentId}`, { method: 'DELETE' });
    if (res.ok) {
      loadComments();
    } else {
      const data = await res.json();
      setCommentError(data.message || '댓글 삭제에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?\n삭제된 글은 관리자 페이지에서 복구할 수 있습니다.')) return;
    const res = await authFetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      navigate('/board');
    } else {
      const data = await res.json();
      setErrorMsg(data.message || '삭제에 실패했습니다.');
    }
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
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate('/board')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            ← 목록으로
          </button>
          {canEdit && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/board/${id}/edit`)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                수정
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                삭제
              </button>
            </div>
          )}
        </div>

        {/* 게시글 본문 */}
        <div className="bg-white rounded-2xl shadow p-8">
          {/* 카테고리 + 제목 */}
          <div className="mb-6">
            <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${
              post.category === 'NOTICE' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {post.categoryName}
            </span>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">{post.title}</h1>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-gray-400 pb-6 border-b border-gray-100">
            <span>✍️ {post.authorName}</span>
            <span>📅 {new Date(post.createdAt).toLocaleString('ko-KR')}</span>
            {post.updatedAt !== post.createdAt && (
              <span>✏️ 수정됨 {new Date(post.updatedAt).toLocaleString('ko-KR')}</span>
            )}
            <span>👁️ {post.viewCount}</span>
          </div>

          {/* 본문 */}
          <div className="pt-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="bg-white rounded-2xl shadow p-8 mt-4">
          <h2 className="text-base font-bold text-gray-700 mb-5">
            💬 댓글 <span className="text-blue-500">{comments.length}</span>
          </h2>

          {/* 댓글 목록 */}
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">첫 번째 댓글을 남겨보세요!</p>
          ) : (
            <ul className="divide-y divide-gray-100 mb-6">
              {comments.map(comment => {
                const isMyComment = payload && comment.authorId === payload.userId;
                const canManage = isMyComment || isAdmin;
                const isEditing = editingCommentId === comment.id;
                return (
                  <li key={comment.id} className="py-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-700">{comment.authorName}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleString('ko-KR')}
                          </span>
                          {comment.updatedAt !== comment.createdAt && (
                            <span className="text-xs text-gray-400">(수정됨)</span>
                          )}
                        </div>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <textarea
                              value={editingContent}
                              onChange={e => setEditingContent(e.target.value)}
                              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
                              rows={2}
                            />
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleEditComment(comment.id)}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors">
                                저장
                              </button>
                              <button onClick={() => { setEditingCommentId(null); setEditingContent(''); }}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs transition-colors">
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                        )}
                      </div>
                      {canManage && !isEditing && (
                        <div className="flex gap-1 shrink-0">
                          {isMyComment && (
                            <button onClick={() => { setEditingCommentId(comment.id); setEditingContent(comment.content); }}
                              className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              수정
                            </button>
                          )}
                          <button onClick={() => handleDeleteComment(comment.id)}
                            className="px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* 댓글 에러 */}
          {commentError && (
            <p className="text-sm text-red-500 mb-3">⚠️ {commentError}</p>
          )}

          {/* 댓글 작성 */}
          {isLoggedIn ? (
            <div className="flex gap-3 mt-2">
              <textarea
                value={commentInput}
                onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); }
                }}
                placeholder="댓글을 입력하세요... (Shift+Enter 줄바꿈)"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
                rows={2}
              />
              <button onClick={handleSubmitComment}
                disabled={commentLoading || !commentInput.trim()}
                className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-200 text-white rounded-xl text-sm font-medium transition-colors self-end">
                {commentLoading ? '...' : '등록'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-3">
              댓글을 작성하려면{' '}
              <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline">로그인</button>
              이 필요합니다.
            </p>
          )}
        </div>

        {errorMsg && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
