import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, logout } from '../utils/authFetch';
import { SkeletonMyPage, SkeletonMyPageList, SkeletonCourseGrid } from '../components/SkeletonLoader';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

const TABS = [
  { key: 'posts',        label: '📝 내 글' },
  { key: 'comments',     label: '💬 내 댓글' },
  { key: 'bookmarks',    label: '🔖 북마크' },
  { key: 'likes',        label: '❤️ 좋아요' },
  { key: 'answers',      label: '📬 받은 답변' },
  { key: 'courses',      label: '📚 수강 현황' },
  { key: 'courseLikes',  label: '❤️ 강의 좋아요' },
  { key: 'certificates', label: '🎓 수료증' },
];

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
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed">‹</button>
    {Array.from({ length: totalPages }, (_, i) => i).map(n => (
      <button key={n} onClick={() => onPageChange(n)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${n === page ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
        {n + 1}
      </button>
    ))}
    <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}
      className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed">›</button>
  </div>
);

// 탭 콘텐츠 공통 행 hover 클래스
const rowCls = 'px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors';

export default function MyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'posts');

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [deleteMsg, setDeleteMsg] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileUploading, setProfileUploading] = useState(false);
  const [infoPanel, setInfoPanel] = useState(null);

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

  const [myLikes, setMyLikes] = useState([]);
  const [myLikesPage, setMyLikesPage] = useState(0);
  const [myLikesTotalPages, setMyLikesTotalPages] = useState(0);
  const [myLikesLoading, setMyLikesLoading] = useState(false);

  const [myCourseLikes, setMyCourseLikes] = useState([]);
  const [myCourseLikesLoading, setMyCourseLikesLoading] = useState(false);

  const [myAnswers, setMyAnswers] = useState([]);
  const [myAnswersPage, setMyAnswersPage] = useState(0);
  const [myAnswersTotalPages, setMyAnswersTotalPages] = useState(0);
  const [myAnswersLoading, setMyAnswersLoading] = useState(false);

  const [myEnrollments, setMyEnrollments] = useState([]);
  const [myEnrollmentsLoading, setMyEnrollmentsLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [cancelTarget, setCancelTarget] = useState(null);
  const { confirmProps, confirm } = useConfirm();
  const [myCertificates, setMyCertificates] = useState([]);
  const [myCertificatesLoading, setMyCertificatesLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me').then(res => res.ok ? res.json() : null).then(data => {
      if (data) { setUser(data); setForm(f => ({ ...f, username: data.username, email: data.email })); }
      else navigate('/login');
    });
    authFetch('/api/messages/unread-count').then(res => res.ok ? res.json() : null).then(data => {
      if (data != null) setUnreadMessages(data);
    });
  }, [navigate]);

  useEffect(() => {
    if (tab === 'posts')        loadMyPosts(0);
    if (tab === 'comments')     loadMyComments(0);
    if (tab === 'bookmarks')    loadBookmarks(0);
    if (tab === 'likes')        loadMyLikes(0);
    if (tab === 'answers')      loadMyAnswers(0);
    if (tab === 'courses')      loadMyEnrollments();
    if (tab === 'courseLikes')  loadMyCourseLikes();
    if (tab === 'certificates') { loadMyCertificates(); loadMyEnrollments(); }
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
  const loadMyLikes = async (page) => {
    setMyLikesLoading(true);
    const res = await authFetch(`/api/users/me/likes?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setMyLikes(d.posts); setMyLikesTotalPages(d.totalPages); setMyLikesPage(page); }
    setMyLikesLoading(false);
  };
  const loadMyAnswers = async (page) => {
    setMyAnswersLoading(true);
    const res = await authFetch(`/api/users/me/answers?page=${page}&size=10`);
    if (res.ok) { const d = await res.json(); setMyAnswers(d.answers); setMyAnswersTotalPages(d.totalPages); setMyAnswersPage(page); }
    setMyAnswersLoading(false);
  };
  const loadMyEnrollments = async () => {
    setMyEnrollmentsLoading(true);
    const res = await authFetch('/api/courses/my/enrollments');
    if (res.ok) setMyEnrollments(await res.json());
    setMyEnrollmentsLoading(false);
  };
  const loadMyCourseLikes = async () => {
    setMyCourseLikesLoading(true);
    const res = await authFetch('/api/courses/my/likes');
    if (res.ok) setMyCourseLikes(await res.json());
    setMyCourseLikesLoading(false);
  };
  const loadMyCertificates = async () => {
    setMyCertificatesLoading(true);
    const res = await authFetch('/api/courses/my/certificates');
    if (res.ok) setMyCertificates(await res.json());
    setMyCertificatesLoading(false);
  };

  const handleCancelEnrollment = async (courseId, courseTitle) => {
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'DELETE' });
    if (res.ok) setMyEnrollments(prev => prev.filter(e => e.courseId !== courseId));
    else alert('수강 취소에 실패했습니다.');
    setCancelTarget(null);
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
    } catch { setUpdateMsg({ text: '서버 오류가 발생했습니다.', type: 'error' }); }
    finally { setUpdateLoading(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { setDeleteMsg('비밀번호를 입력해주세요.'); return; }
    const ok = await confirm({ title: '회원 탈퇴', message: '정말로 탈퇴하시겠습니까?\n모든 정보가 삭제되며 복구할 수 없습니다.', confirmText: '탈퇴', confirmColor: 'red' });
    if (!ok) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch('/api/users/me', { method: 'DELETE', body: JSON.stringify({ password: deletePassword }) });
      const data = await res.json();
      if (res.ok) { logout(true); } else setDeleteMsg(data.message || '탈퇴에 실패했습니다.');
    } catch { setDeleteMsg('서버 오류가 발생했습니다.'); }
    finally { setDeleteLoading(false); }
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setProfileUploading(true);
    const formData = new FormData(); formData.append('image', file);
    try {
      const res = await authFetch('/api/users/me/profile-image', { method: 'POST', body: formData });
      if (res.ok) { const data = await res.json(); setUser(prev => ({ ...prev, profileImageUrl: data.profileImageUrl })); setImgError(false); }
      else { const d = await res.json(); alert(d.message || '이미지 업로드에 실패했습니다.'); }
    } catch { alert('서버 오류가 발생했습니다.'); }
    finally { setProfileUploading(false); e.target.value = ''; }
  };

  const handleDeleteProfileImage = async () => {
    const ok = await confirm({ title: '프로필 이미지 삭제', message: '프로필 이미지를 삭제하시겠습니까?', confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch('/api/users/me/profile-image', { method: 'DELETE' });
    if (res.ok) setUser(prev => ({ ...prev, profileImageUrl: null }));
  };

  if (!user) return <SkeletonMyPage />;

  return (
    <>
    <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100 mb-6">👤 마이페이지</h2>

        {/* ── 프로필 카드 ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow mb-4">
          <div className="flex items-center gap-4 p-5">
            {/* 아바타 */}
            <div className="relative group shrink-0">
              {user.profileImageUrl && !imgError ? (
                <img src={`http://localhost:8080${user.profileImageUrl}`} alt="프로필"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-100" onError={() => setImgError(true)} />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-500">
                  {user.username[0]}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} disabled={profileUploading}
                className="absolute inset-0 rounded-full bg-black/40 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {profileUploading ? '...' : '변경'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileImageChange} />
            </div>

            {/* 유저 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{user.username}</p>
                <span className="text-xs text-gray-400 dark:text-gray-500">{user.role === 'ROLE_ADMIN' ? '👑 관리자' : '일반 회원'}</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">📅 가입일 {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">🕐 최종 로그인 {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">🔑 로그인 {user.loginCount ?? 0}회</span>
              </div>
            </div>

            {/* 우측 버튼들 */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => navigate('/messages')}
                className="relative px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
                📩 쪽지함
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </button>
              {user.profileImageUrl && !imgError && (
                <button onClick={handleDeleteProfileImage}
                  className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950">
                  사진 삭제
                </button>
              )}
              <button onClick={() => setInfoPanel(infoPanel === 'edit' ? null : 'edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  infoPanel === 'edit' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                ✏️ 정보 수정
              </button>
              <button onClick={() => setInfoPanel(infoPanel === 'withdraw' ? null : 'withdraw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  infoPanel === 'withdraw' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 dark:text-gray-500 hover:text-red-400'
                }`}>
                회원탈퇴
              </button>
            </div>
          </div>

          {/* 정보 수정 패널 */}
          {infoPanel === 'edit' && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-5">
              <form onSubmit={handleUpdate} className="space-y-3 max-w-md">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-3">회원정보 수정</p>
                {[{ label: '이름', name: 'username', type: 'text' }, { label: '이메일', name: 'email', type: 'email' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                    <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400" />
                  </div>
                ))}
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide pt-1">비밀번호 변경 (선택)</p>
                {[{ label: '현재 비밀번호', name: 'currentPassword' }, { label: '새 비밀번호', name: 'newPassword' }].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                    <input type="password" value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400" />
                  </div>
                ))}
                {updateMsg.text && (
                  <div className={`text-sm text-center px-3 py-2 rounded-lg ${
                    updateMsg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>{updateMsg.text}</div>
                )}
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={updateLoading}
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                    {updateLoading ? '수정 중...' : '저장'}
                  </button>
                  <button type="button" onClick={() => setInfoPanel(null)}
                    className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 회원탈퇴 패널 */}
          {infoPanel === 'withdraw' && (
            <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-5">
              <div className="max-w-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-xs text-red-600 dark:text-red-400 mb-3">⚠️ 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</p>
                <input type="password" placeholder="현재 비밀번호 입력" value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-red-200 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:border-red-400 mb-2" />
                {deleteMsg && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{deleteMsg}</p>}
                <div className="flex gap-2">
                  <button onClick={handleDelete} disabled={deleteLoading}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium transition-colors">
                    {deleteLoading ? '처리 중...' : '탈퇴 확인'}
                  </button>
                  <button onClick={() => setInfoPanel(null)}
                    className="px-5 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 탭 ── */}
        <div className="flex mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 내 글 ── */}
        {tab === 'posts' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myPostsLoading ? <SkeletonMyPageList count={6} /> : myPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">작성한 글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myPosts.map(post => (
                  <div key={post.id} className={rowCls} onClick={() => navigate(`/board/${post.id}?returnTo=${encodeURIComponent('/mypage?tab=posts')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>{post.boardName}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{post.title}</span>
                      {(post.boardType === 'QNA' || post.boardCode === 'SUGGESTION') && (
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'}`}>
                          {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                        </span>
                      )}
                      {post.commentCount > 0 && <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
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

        {/* ── 내 댓글 ── */}
        {tab === 'comments' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myCommentsLoading ? <SkeletonMyPageList count={6} /> : myComments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">작성한 댓글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myComments.map(comment => (
                  <div key={comment.id} className={rowCls} onClick={() => navigate(`/board/${comment.postId}?returnTo=${encodeURIComponent('/mypage?tab=comments')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(comment.boardCode)}`}>{comment.boardName || '게시판'}</span>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{comment.postTitle}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate mb-1 pl-0.5">{comment.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>📅 {new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myCommentsTotalPages > 1 && <Pagination page={myCommentsPage} totalPages={myCommentsTotalPages} onPageChange={loadMyComments} />}
          </div>
        )}

        {/* ── 북마크 ── */}
        {tab === 'bookmarks' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {bookmarksLoading ? <SkeletonMyPageList count={6} /> : bookmarks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">북마크한 게시글이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {bookmarks.map(post => (
                  <div key={post.id} className={rowCls} onClick={() => navigate(`/board/${post.id}?returnTo=${encodeURIComponent('/mypage?tab=bookmarks')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>{post.boardName}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{post.title}</span>
                      {(post.boardType === 'QNA' || post.boardCode === 'SUGGESTION') && (
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded ${post.answerCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-600 text-gray-400'}`}>
                          {post.answerCount > 0 ? '✅ 답변' : '⏳ 대기'}
                        </span>
                      )}
                      {post.commentCount > 0 && <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
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

        {/* ── 좋아요 ── */}
        {tab === 'likes' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myLikesLoading ? <SkeletonMyPageList count={6} /> : myLikes.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-3">🤍</p><p>좋아요한 게시글이 없습니다.</p></div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myLikes.map(post => (
                  <div key={post.id} className={rowCls} onClick={() => navigate(`/board/${post.id}?returnTo=${encodeURIComponent('/mypage?tab=likes')}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(post.boardCode)}`}>{post.boardName}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{post.title}</span>
                      {post.commentCount > 0 && <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>✍️ {post.authorName}</span><span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>👁️ {post.viewCount}</span><span className="text-red-400">❤️ {post.likeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myLikesTotalPages > 1 && <Pagination page={myLikesPage} totalPages={myLikesTotalPages} onPageChange={loadMyLikes} />}
          </div>
        )}

        {/* ── 받은 답변 ── */}
        {tab === 'answers' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myAnswersLoading ? <SkeletonMyPageList count={4} /> : myAnswers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-3">📭</p><p>받은 답변이 없습니다.</p>
                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">QnA 또는 건의사항 게시글에 관리자 답변이 달리면 여기에 표시됩니다.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myAnswers.map(answer => (
                  <div key={answer.answerId} className={rowCls} onClick={() => navigate(`/board/${answer.postId}?returnTo=${encodeURIComponent('/mypage?tab=answers')}`)}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(answer.boardCode)}`}>{answer.boardName}</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{answer.postTitle}</span>
                      <span className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">✅ 답변완료</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1.5 pl-0.5">{answer.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>💬 {answer.authorName}</span><span>📅 {new Date(answer.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myAnswersTotalPages > 1 && <Pagination page={myAnswersPage} totalPages={myAnswersTotalPages} onPageChange={loadMyAnswers} />}
          </div>
        )}

        {/* ── 수강 현황 ── */}
        {tab === 'courses' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myEnrollmentsLoading ? <SkeletonMyPageList count={4} /> : myEnrollments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-3">📭</p><p>수강 중인 강의가 없습니다.</p>
                <button onClick={() => navigate('/courses')} className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">강의 둘러보기</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myEnrollments.map(e => (
                  <div key={e.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => navigate(`/courses/${e.courseId}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {e.courseThumbnailUrl ? <img src={e.courseThumbnailUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📚</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{e.courseTitle}</span>
                          {(e.completed || e.isCompleted) && <span className="shrink-0 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">🎓 수료완료</span>}
                          {e.pendingApproval && <span className="shrink-0 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">⏳ 수료대기</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${e.progressRate}%` }} />
                          </div>
                          <span className="text-xs text-blue-600 font-semibold shrink-0">{e.progressRate}%</span>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          <span>📅 {new Date(e.enrolledAt).toLocaleDateString('ko-KR')}</span>
                          <span>⏱️ {Math.floor(e.totalStudySeconds / 60)}분 학습</span>
                        </div>
                      </div>
                      <button onClick={ev => { ev.stopPropagation(); setCancelTarget({ courseId: e.courseId, courseTitle: e.courseTitle }); }}
                        className="shrink-0 px-2.5 py-1 text-xs border border-red-200 text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                        취소
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 강의 좋아요 ── */}
        {tab === 'courseLikes' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
            {myCourseLikesLoading ? <SkeletonCourseGrid count={3} /> : myCourseLikes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-3">🤍</p><p>좋아요한 강의가 없습니다.</p>
                <button onClick={() => navigate('/courses')} className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">강의 둘러보기</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {myCourseLikes.map(course => (
                  <div key={course.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onClick={() => navigate(`/courses/${course.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📚</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{course.title}</span>
                          {course.isPublished === false && <span className="shrink-0 text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-400 rounded-full">비공개</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {course.instructor && <span>👨‍🏫 {course.instructor}</span>}
                          {course.educationStartDate && <span>📅 {course.educationStartDate} ~ {course.educationEndDate}</span>}
                          <span className="text-rose-400">❤️ {course.likeCount}</span>
                          <span>👁️ {course.viewCount}</span>
                        </div>
                      </div>
                      <button onClick={ev => { ev.stopPropagation(); navigate(`/courses/${course.id}`); }}
                        className="shrink-0 px-3 py-1.5 text-xs border border-blue-200 text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                        강의 보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 수료증 ── */}
        {tab === 'certificates' && (() => {
          const grouped = myCertificates.reduce((acc, cert) => {
            const key = String(cert.courseId);
            if (!acc[key]) acc[key] = [];
            acc[key].push(cert);
            return acc;
          }, {});
          Object.values(grouped).forEach(list => list.sort((a, b) => new Date(a.issuedAt) - new Date(b.issuedAt)));
          const sortedGroups = Object.values(grouped).sort((a, b) => new Date(b[b.length - 1].issuedAt) - new Date(a[a.length - 1].issuedAt));

          return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
              {myCertificatesLoading ? <SkeletonMyPageList count={3} /> : myCertificates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-3xl mb-3">🎓</p><p>아직 발급된 수료증이 없습니다.</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">강의를 100% 완료하면 관리자 승인 후 발급됩니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {sortedGroups.map(certList => {
                    const latest = certList[certList.length - 1];
                    const isMulti = certList.length > 1;
                    const activeEnrollment = myEnrollments.find(e => String(e.courseId) === String(latest.courseId) && !e.completed && !e.isCompleted);
                    return (
                      <div key={latest.courseId} className="px-5 py-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl shrink-0">🎓</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{latest.courseTitle}</p>
                              {isMulti && <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-medium">총 {certList.length}회 수료</span>}
                              {activeEnrollment && <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium">📖 재수강 중</span>}
                            </div>
                            <button onClick={() => navigate(`/courses/${latest.courseId}`)} className="text-xs text-gray-400 hover:text-blue-500 transition-colors mt-0.5">강의 바로가기 →</button>
                          </div>
                        </div>
                        <div style={{ paddingLeft: '52px' }} className="space-y-2">
                          {certList.map((cert, idx) => (
                            <div key={cert.id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl ${
                              idx === certList.length - 1 ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600'
                            }`}>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${idx === certList.length - 1 ? 'bg-yellow-200 text-yellow-700' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>
                                  {certList.length === 1 ? '수료' : `${idx + 1}회차`}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">📅 {new Date(cert.issuedAt).toLocaleDateString('ko-KR')} 발급</span>
                                <span className="text-xs text-gray-400 hidden sm:block">⏱️ {Math.floor(cert.totalStudySeconds / 60)}분</span>
                                <span className="text-xs text-gray-300 dark:text-gray-600 font-mono hidden md:block">{cert.code.slice(0, 8)}...</span>
                              </div>
                              <button onClick={() => { navigate('/mypage?tab=certificates', { replace: true }); setTimeout(() => navigate(`/courses/certificates/verify/${cert.code}`), 0); }}
                                className={`shrink-0 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                                  idx === certList.length - 1 ? 'border-indigo-200 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950' : 'border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}>
                                검증
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>

    <ConfirmModal {...confirmProps} />
    <ConfirmModal
      isOpen={!!cancelTarget}
      title="수강 취소"
      message={cancelTarget ? `'${cancelTarget.courseTitle}' 수강을 취소하시겠습니까?\n진도 및 학습 기록이 모두 삭제됩니다.` : ''}
      confirmText="수강 취소"
      confirmColor="red"
      onConfirm={() => handleCancelEnrollment(cancelTarget.courseId, cancelTarget.courseTitle)}
      onCancel={() => setCancelTarget(null)}
    />
    </>
  );
}
