import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, logout } from '../utils/authFetch';
import NotificationBell from '../components/NotificationBell';

const TABS = [
  { key: 'info', label: '⚙️ 내 정보' },
  { key: 'posts', label: '📝 내 글' },
  { key: 'comments', label: '💬 내 댓글' },
];

export default function MyPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [deleteMsg, setDeleteMsg] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 내 글
  const [myPosts, setMyPosts] = useState([]);
  const [myPostsPage, setMyPostsPage] = useState(0);
  const [myPostsTotalPages, setMyPostsTotalPages] = useState(0);
  const [myPostsLoading, setMyPostsLoading] = useState(false);

  // 내 댓글
  const [myComments, setMyComments] = useState([]);
  const [myCommentsPage, setMyCommentsPage] = useState(0);
  const [myCommentsTotalPages, setMyCommentsTotalPages] = useState(0);
  const [myCommentsLoading, setMyCommentsLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) { setUser(data); setForm(f => ({ ...f, username: data.username, email: data.email })); }
        else navigate('/login');
      });
  }, [navigate]);

  useEffect(() => {
    if (tab === 'posts') loadMyPosts(0);
    if (tab === 'comments') loadMyComments(0);
  }, [tab]);

  const loadMyPosts = async (page) => {
    setMyPostsLoading(true);
    const res = await authFetch(`/api/users/me/posts?page=${page}&size=10`);
    if (res.ok) {
      const data = await res.json();
      setMyPosts(data.posts);
      setMyPostsTotalPages(data.totalPages);
      setMyPostsPage(page);
    }
    setMyPostsLoading(false);
  };

  const loadMyComments = async (page) => {
    setMyCommentsLoading(true);
    const res = await authFetch(`/api/users/me/comments?page=${page}&size=10`);
    if (res.ok) {
      const data = await res.json();
      setMyComments(data.comments);
      setMyCommentsTotalPages(data.totalPages);
      setMyCommentsPage(page);
    }
    setMyCommentsLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
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
      const res = await authFetch('/api/users/me', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) { logout(); }
      else setDeleteMsg(data.message || '탈퇴에 실패했습니다.');
    } catch {
      setDeleteMsg('서버 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
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

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">⚙️ 마이페이지</h2>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => navigate('/home')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
              ← 홈으로
            </button>
          </div>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-500">
            {user.username[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-700">{user.username}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
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
              {[{ label: '이름', name: 'username', type: 'text' }, { label: '이메일', name: 'email', type: 'email' }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
              ))}
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide pt-2">비밀번호 변경 (선택)</p>
              {[{ label: '현재 비밀번호', name: 'currentPassword', ph: '현재 비밀번호' }, { label: '새 비밀번호', name: 'newPassword', ph: '새 비밀번호' }].map(f => (
                <div key={f.name}>
                  <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
                  <input type="password" placeholder={f.ph} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
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

            {/* 회원 탈퇴 */}
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
                  <div key={post.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${post.id}`)}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${post.category === 'NOTICE' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        {post.categoryName}
                      </span>
                      <span className="text-sm font-medium text-gray-700 truncate">{post.title}</span>
                      {post.commentCount > 0 && (
                        <span className="text-xs text-blue-400 shrink-0">💬 {post.commentCount}</span>
                      )}
                    </div>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                      <span>👁️ {post.viewCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myPostsTotalPages > 1 && (
              <Pagination page={myPostsPage} totalPages={myPostsTotalPages} onPageChange={loadMyPosts} />
            )}
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
                  <div key={comment.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/board/${comment.postId}`)}>
                    <p className="text-sm text-gray-700 mb-1 truncate">{comment.content}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span>📝 게시글 #{comment.postId}</span>
                      <span>📅 {new Date(comment.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {myCommentsTotalPages > 1 && (
              <Pagination page={myCommentsPage} totalPages={myCommentsTotalPages} onPageChange={loadMyComments} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
