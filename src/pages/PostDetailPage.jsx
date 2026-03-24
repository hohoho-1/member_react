import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const isAdmin = payload?.role === 'ROLE_ADMIN';
  const isAuthor = post && payload && post.authorId === payload.userId;
  const canEdit = isAuthor || isAdmin;

  useEffect(() => {
    loadPost();
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

        {errorMsg && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-center">
            ⚠️ {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
