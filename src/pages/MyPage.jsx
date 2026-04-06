import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, logout } from '../utils/authFetch';

const TABS = [
  { key: 'info',      label: '⚙️ 내 정보' },
  { key: 'posts',     label: '📝 내 글' },
  { key: 'comments',  label: '💬 내 댓글' },
  { key: 'bookmarks', label: '🔖 북마크' },
  { key: 'answers',   label: '📬 받은 답변' },
];

// 게시판 코드별 뱃지 색상
const getBadgeClass = (code) => {
  const map = {
    NOTICE:     'bg-red-100 text-red-500',
    FAQ:        'bg-green-100 text-green-600',
    QNA:        'bg-amber-100 text-amber-600',
    SUGGESTION: 'bg-teal-100 text-teal-600',
    GALLERY:    'bg-purple-100 text-purple-500',
  };
  return map[code] ?? 'bg-blue-100 text-blue-500';
};

const Pagination = ({ page, totalPages, onPageChange }) => (
  <div className="flex justify-center gap-1 mt-4 pb-4">
    <button onClick={() => onPageChange(page - 1)} disabled={page === 0}
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">‹</button>
    {Array.from({ length: totalPages }, (_, i) => i).map(n => (
      <button key={n} onClick={() => onPageChange(n)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${n === page ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
        {n + 1}
      </button>
    ))}
    <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed">›</button>
  </div>
);

export default function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'info');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [deleteMsg, setDeleteMsg] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);

  const [myPosts, setMyPosts] = useState([]);
  const [myPostsPage, setMyPostsPage] = useState(0);
  const [myPostsTotalPages, setMyPostsTotalPages] = useState(0);
  const [myPostsLoading, setMyPostsLoading] = useState(false);

  const [myComments, setMyComments] = useState([]);
  const [myCommentsPage, setMyCommentsPage] = useState(0);
  const [myCommentsTotalPages, setMyCommentsTotalPages] = useState(0);
  const [myCommentsLoading, setMyCommentsLoading] = useState(false);

  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarksPage, setBookmarksPage] = useState(0);
  const [bookmarksTotalPages, setBookmarksTotalPages] = useState(0);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);

  const [myAnswers, setMyAnswers] = useState([]);
  const [myAnswersPage, setMyAnswersPage] = useState(0);
  const [myAnswersTotalPages, setMyAnswersTotalPages] = useState(0);
  const [myAnswersLoading, setMyAnswersLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) { setUser(data); setForm(f => ({ ...f, username: data.username, email: data.email })); }
        else navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (tab === 'posts')     loadMyPosts(0);
    if (tab === 'comments')  loadMyComments(0);
    if (tab === 'bookmarks') loadBookmarks(0);
    if (tab === 'answers')   loadMyAnswers(0);
  }, [tab]);

  const loadMyPosts = async (page) => {
    setMyPostsLoading(true);
    const res = await authFetch(`/api/users/me/posts?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setMyPosts(d.posts); setMyPostsTotalPages(d.totalPages); setMyPostsPage(page); }
    setMyPostsLoading(false);
  };

  const loadMyComments = async (page) => {
    setMyCommentsLoading(true);
    const res = await authFetch(`/api/users/me/comments?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setMyComments(d.comments); setMyCommentsTotalPages(d.totalPages); setMyCommentsPage(page); }
    setMyCommentsLoading(false);
  };

  const loadBookmarks = async (page) => {
    setBookmarksLoading(true);
    const res = await authFetch(`/api/users/me/bookmarks?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setBookmarks(d.posts); setBookmarksTotalPages(d.totalPages); setBookmarksPage(page); }
    setBookmarksLoading(false);
  };

  const loadMyAnswers = async (page) => {
    setMyAnswersLoading(true);
    const res = await authFetch(`/api/users/me/answers?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setMyAnswers(d.answers); setMyAnswersTotalPages(d.totalPages); setMyAnswersPage(page); }
    setMyAnswersLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await authFetch('/api/users/me', { method: 'PUT', body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        setUpdateMsg({ text: '정보가 수정되었습니다!', type: 'success' });
        setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
      } else {
        setUpdateMsg({ text: data.message || '수정에 실패했습니다.', type: 'error' });
      }
    } catch {
      setUpdateMsg({ text: '서버 오류가 발생했습니다.', type: 'error' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) { setDeleteMsg('비밀번호를 입력해주세요.'); return; }
    if (!window.confirm('정말로 탈퇴하시겠습니까?')) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch('/api/users/me', { method: 'DELETE', body: JSON.stringify({ password: deletePassword }) });
      const data = await res.json();
      if (res.ok) { logout(); }
      else setDeleteMsg(data.message || '탈퇴에 실패했습니다.');
    } catch {
      setDeleteMsg('서버 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await authFetch('/api/users/me/profile-image', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, profileImageUrl: data.profileImageUrl }));
        setImgError(false);
      } else {
        const d = await res.json();
        alert(d.message || '이미지 업로드에 실패했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setProfileUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteProfileImage = async () => {
    if (!window.confirm('프로필 이미지를 삭제하시겠습니까?')) return;
    const res = await authFetch('/api/users/me/profile-image', { method: 'DELETE' });
    if (res.ok) setUser(prev => ({ ...prev, profileImageUrl: null }));
  };

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">

        <h2 className="text-2xl font-bold text-gray-700 mb-6">⚙️ 마이페이지</h2>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4 flex items-center gap-4">
          <div className="relative group shrink-0">
            {user.profileImageUrl && !imgError ? (
              <img
                src={`http://localhost:8080${user.profileImageUrl}`}
                alt="프로필"
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-500">
                {user.username[0]}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={profileUploading}
              className="absolute inset-0 rounded-full bg-black/40 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {profileUploading ? '...' : '변경'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
          </div>

          <div className="flex-1">
            <p className="font-semibold text-gray-700">{user.username}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
            <p className="text-xs text-gray-300 mt-0.5">{user.role === 'ROLE_ADMIN' ? '👑 관리자' : '일반 회원'}</p>
          </div>

          {user.profileImageUrl && (
            <button onClick={handleDeleteProfileImage}
              className="text-xs text-red-400 hover:text-red-600 shrink-0">
              이미지 삭제
            </button>
          )}
        </div>

        {/* 탭 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 내 정보 탭 ── */}
        {tab === 'info' && (
          <div className="bg-white rounded-2xl shadow p-8">
            <form onSubmit={handleUpdate} className="space-y-3">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">회원정보 수정</p>
              {[
                { label: '이름', name: 'username', type: 'text' },
                { label: '이메일', name: 'email', type: 'email' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
              ))}
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide pt-2">비밀번호 변경 (선택)</p>
              {[
                { label: '현재 비밀번호', name: 'currentPassword' },
                { label: '새 비밀번호', name: 'newPassword' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <input type="password" value={form[f.name]}
                    onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
              ))}
              {updateMsg.text && (
                <div className={`text-sm text-center px-3 py-2 rounded-lg ${updateMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {updateMsg.text}
                </div>
              )}
              <button type="submit" disabled={updateLoading}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors">
                {updateLoading ? '수정 중...' : '정보 수정'}
              </button>
            </form>

            <hr className="my-6 border-gray-200" />

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs text-red-600 mb-3">⚠️ 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</p>
              <input type="password" placeholder="현재 비밀번호 입력" value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 mb-2" />
              {deleteMsg && <p className="text-xs text-red-600 mb-2">{deleteMsg}</p>}
              <button onClick={handleDelete} disabled={deleteLoading}
                className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors">
                {deleteLoading ? '처리 중...' : '회원 탈퇴'}
              </button>
            </div>
          </div>
        )}

        {/* ── 내 글 탭 ── */}
        {tab === 'posts' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {myPostsLoading ? (
              <div className="text-center py-12 text-gray-400">로딩 중...</div>
            ) : myPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">작성한 글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myPosts.map(post => (
                  <div key={post.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${post.id}?returnTo=${encodeURIComponent('/mypage?tab=posts')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>
                        {post.boardName}
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">{post.title}</span>
                      {(post.boardType === 'QNA' || post.boardCode === 'SUGGESTION') && (
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                        </span>
                      )}
                      {post.commentCount > 0 && <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>👁️ {post.viewCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myPostsTotalPages > 1 && <Pagination page={myPostsPage} totalPages={myPostsTotalPages} onPageChange={loadMyPosts} />}
          </div>
        )}

        {/* ── 내 댓글 탭 ── */}
        {tab === 'comments' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {myCommentsLoading ? (
              <div className="text-center py-12 text-gray-400">로딩 중...</div>
            ) : myComments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">작성한 댓글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myComments.map(comment => (
                  <div key={comment.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${comment.postId}?returnTo=${encodeURIComponent('/mypage?tab=comments')}`)}>
                    <p className="text-sm text-gray-700 mb-1 truncate">{comment.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>📝 게시글 #{comment.postId}</span>
                      <span>📅 {new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myCommentsTotalPages > 1 && <Pagination page={myCommentsPage} totalPages={myCommentsTotalPages} onPageChange={loadMyComments} />}
          </div>
        )}

        {/* ── 북마크 탭 ── */}
        {tab === 'bookmarks' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {bookmarksLoading ? (
              <div className="text-center py-12 text-gray-400">로딩 중...</div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">북마크한 게시글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bookmarks.map(post => (
                  <div key={post.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${post.id}?returnTo=${encodeURIComponent('/mypage?tab=bookmarks')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>
                        {post.boardName}
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">{post.title}</span>
                      {(post.boardType === 'QNA' || post.boardCode === 'SUGGESTION') && (
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                        </span>
                      )}
                      {post.commentCount > 0 && <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>✍️ {post.authorName}</span>
                      <span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>👁️ {post.viewCount}</span>
                      {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bookmarksTotalPages > 1 && <Pagination page={bookmarksPage} totalPages={bookmarksTotalPages} onPageChange={loadBookmarks} />}
          </div>
        )}

        {/* ── 받은 답변 탭 ── */}
        {tab === 'answers' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {myAnswersLoading ? (
              <div className="text-center py-12 text-gray-400">로딩 중...</div>
            ) : myAnswers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-3">📭</p>
                <p>받은 답변이 없습니다.</p>
                <p className="text-xs text-gray-300 mt-1">QnA 또는 건의사항 게시글에 관리자 답변이 달리면 여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {myAnswers.map(answer => (
                  <div key={answer.answerId}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${answer.postId}?returnTo=${encodeURIComponent('/mypage?tab=answers')}`)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(answer.boardCode)}`}>
                        {answer.boardName}
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">{answer.postTitle}</span>
                      <span className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">✅ 답변완료</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1.5 pl-0.5">{answer.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>💬 {answer.authorName}</span>
                      <span>📅 {new Date(answer.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myAnswersTotalPages > 1 && <Pagination page={myAnswersPage} totalPages={myAnswersTotalPages} onPageChange={loadMyAnswers} />}
          </div>
        )}

      </div>
    </div>
  );
}
