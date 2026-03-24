import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, isAdmin, getTokenPayload } from '../utils/authFetch';

// 탈퇴 회원 상세 모달
function DeletedUserModal({ user, onClose, onRestore, onPermanentDelete }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[400px] p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700">🗑️ 탈퇴 회원 상세</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
            {user.username[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-500">{user.username}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <span className="ml-auto px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-500">탈퇴</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">ID</span>
            <span className="font-medium text-gray-600">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">권한</span>
            <span className="font-medium text-gray-600">{user.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">가입일</span>
            <span className="font-medium text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">최종 로그인</span>
            <span className="font-medium text-gray-600">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">로그인 횟수</span>
            <span className="font-medium text-gray-600">{user.loginCount}회</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
            <span className="text-red-400">탈퇴일</span>
            <span className="font-medium text-red-400">{user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onRestore(user.id, user.username)}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            복구
          </button>
          <button onClick={() => onPermanentDelete(user.id, user.username)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            영구삭제
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 5;
const LOG_PAGE_SIZE = 15;

const ACTION_LABELS = {
  LOGIN:       { label: '로그인',   color: 'bg-blue-100 text-blue-700' },
  LOGOUT:      { label: '로그아웃', color: 'bg-gray-100 text-gray-600' },
  SIGNUP:      { label: '회원가입', color: 'bg-green-100 text-green-700' },
  WITHDRAW:    { label: '탈퇴',     color: 'bg-red-100 text-red-600' },
  ROLE_CHANGE: { label: '권한변경', color: 'bg-purple-100 text-purple-700' },
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 탭: 'active' | 'deleted' | 'logs' | 'deletedPosts'
  const tab = searchParams.get('tab') ?? 'active';

  // 회원 목록 상태
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  // 로그 상태
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [logTotalElements, setLogTotalElements] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logKeyword, setLogKeyword] = useState('');
  const [logAction, setLogAction] = useState('');

  // 삭제 게시글 상태
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedPostLoading, setDeletedPostLoading] = useState(false);
  const [deletedPostTotalPages, setDeletedPostTotalPages] = useState(0);
  const [deletedPostTotalElements, setDeletedPostTotalElements] = useState(0);
  const [deletedPostPage, setDeletedPostPage] = useState(0);
  const [deletedPostKeyword, setDeletedPostKeyword] = useState('');

  // 알림 상태
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);
  const keyword = searchParams.get('keyword') ?? '';
  const currentUserId = getTokenPayload()?.userId;

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    if (tab === 'logs') {
      setLogPage(0); setLogKeyword(''); setLogAction('');
      loadLogs(0, '', '');
    } else if (tab === 'deletedPosts') {
      setDeletedPostPage(0); setDeletedPostKeyword('');
      loadDeletedPosts(0, '');
    } else {
      loadUsers(currentPage, keyword, tab);
    }
  }, [searchParams.toString()]);

  const loadUsers = async (page, kw, currentTab) => {
    setLoading(true);
    const endpoint = currentTab === 'deleted'
      ? `/api/users/admin/users/deleted?page=${page}&size=${PAGE_SIZE}&keyword=${encodeURIComponent(kw)}`
      : `/api/users/admin/users?page=${page}&size=${PAGE_SIZE}&keyword=${encodeURIComponent(kw)}`;
    const res = await authFetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
    setLoading(false);
  };

  const loadDeletedPosts = async (page, kw) => {
    setDeletedPostLoading(true);
    const res = await authFetch(
      `/api/posts/deleted?page=${page}&size=10&keyword=${encodeURIComponent(kw)}`
    );
    if (res.ok) {
      const data = await res.json();
      setDeletedPosts(data.posts);
      setDeletedPostTotalPages(data.totalPages);
      setDeletedPostTotalElements(data.totalElements);
    }
    setDeletedPostLoading(false);
  };

  const handleRestorePost = async (id, title) => {
    if (!window.confirm(`'${title}' 게시글을 복구하시겠습니까?`)) return;
    const res = await authFetch(`/api/posts/${id}/restore`, { method: 'POST' });
    if (res.ok) {
      showSuccess(`게시글이 복구되었습니다.`);
      loadDeletedPosts(deletedPostPage, deletedPostKeyword);
    } else {
      const data = await res.json();
      showError(data.message || '복구에 실패했습니다.');
    }
  };

  const handlePermanentDeletePost = async (id, title) => {
    if (!window.confirm(`'${title}' 게시글을 완전히 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`)) return;
    const res = await authFetch(`/api/posts/${id}/permanent`, { method: 'DELETE' });
    if (res.ok) {
      showSuccess(`게시글이 영구 삭제되었습니다.`);
      const newPage = deletedPosts.length === 1 && deletedPostPage > 0 ? deletedPostPage - 1 : deletedPostPage;
      setDeletedPostPage(newPage);
      loadDeletedPosts(newPage, deletedPostKeyword);
    } else {
      showError('영구 삭제에 실패했습니다.');
    }
  };

  const loadLogs = async (page, kw, action) => {
    setLogLoading(true);
    const res = await authFetch(
      `/api/users/admin/logs?page=${page}&size=${LOG_PAGE_SIZE}&keyword=${encodeURIComponent(kw)}&action=${action}`
    );
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogTotalPages(data.totalPages);
      setLogTotalElements(data.totalElements);
    }
    setLogLoading(false);
  };

  const switchTab = (newTab) => setSearchParams({ tab: newTab });

  const goToPage = (page) => {
    const params = { tab };
    if (page + 1 > 1) params.page = String(page + 1);
    if (keyword) params.keyword = keyword;
    setSearchParams(params);
  };

  const handleKeywordChange = (e) => {
    const kw = e.target.value;
    const params = { tab };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

  const handleRestore = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 복구하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}/restore`, { method: 'POST' });
    if (res.ok) {
      setSelectedUser(null);
      showSuccess(`'${username}' 회원이 복구되었습니다.`);
      const newPage = users.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      loadUsers(newPage, keyword, tab);
      if (newPage !== currentPage) goToPage(newPage);
    } else {
      const data = await res.json();
      showError(data.message || '복구에 실패했습니다.');
    }
  };

  const handlePermanentDelete = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 완전히 삭제합니다.\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedUser(null);
      showSuccess(`'${username}' 회원이 영구 삭제되었습니다.`);
      const newPage = users.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      loadUsers(newPage, keyword, tab);
      if (newPage !== currentPage) goToPage(newPage);
    } else {
      showError('영구 삭제에 실패했습니다.');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('모든 활동 로그를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    const res = await authFetch('/api/users/admin/logs', { method: 'DELETE' });
    if (res.ok) {
      showSuccess('활동 로그가 모두 삭제되었습니다.');
      setLogPage(0);
      loadLogs(0, logKeyword, logAction);
    } else {
      showError('로그 삭제에 실패했습니다.');
    }
  };

  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 3000); };
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <DeletedUserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">🛠️ 관리자 페이지</h2>
          <button onClick={() => navigate('/home')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            ← 홈으로
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            ✅ {successMsg}
          </div>
        )}

        {/* 회원 수 카드 (로그/삭제게시글 탭 제외) */}
        {tab !== 'logs' && tab !== 'deletedPosts' && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
            <p className="text-4xl font-bold text-blue-500">{totalElements}</p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'deleted' ? '탈퇴 회원 수' : '활성 회원 수'}
            </p>
          </div>
        )}

        {/* 탭 버튼 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          <button onClick={() => switchTab('active')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            👥 활성 회원
          </button>
          <button onClick={() => switchTab('deleted')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'deleted' ? 'bg-red-400 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🗑️ 탈퇴 회원
          </button>
          <button onClick={() => switchTab('logs')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'logs' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📋 활동 로그
          </button>
          <button onClick={() => switchTab('deletedPosts')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'deletedPosts' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📝 삭제 게시글
          </button>
        </div>

        {/* ── 활동 로그 탭 ── */}
        {tab === 'logs' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-100 gap-3">
              <span className="font-semibold text-gray-700">
                활동 로그
                <span className="ml-2 text-sm text-gray-400">({logTotalElements}건)</span>
              </span>
              <div className="flex gap-2 flex-wrap">
                <select value={logAction}
                  onChange={e => { const v = e.target.value; setLogAction(v); setLogPage(0); loadLogs(0, logKeyword, v); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400">
                  <option value="">전체 액션</option>
                  <option value="LOGIN">로그인</option>
                  <option value="LOGOUT">로그아웃</option>
                  <option value="SIGNUP">회원가입</option>
                  <option value="WITHDRAW">탈퇴</option>
                  <option value="ROLE_CHANGE">권한변경</option>
                </select>
                <input type="text" placeholder="🔍 이름 또는 이메일"
                  value={logKeyword}
                  onChange={e => { const v = e.target.value; setLogKeyword(v); setLogPage(0); loadLogs(0, v, logAction); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400 w-44"
                />
                <button onClick={handleClearLogs}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm font-medium transition-colors">
                  전체삭제
                </button>
              </div>
            </div>

            {logLoading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">활동 로그가 없습니다.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['시각', '이름', '이메일', '액션', '상세', 'IP'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const info = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-600' };
                        return (
                          <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{log.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                                {info.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{log.detail}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => { const p = logPage - 1; setLogPage(p); loadLogs(p, logKeyword, logAction); }}
                    disabled={logPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {Array.from({ length: logTotalPages }, (_, i) => i).map(num => (
                    <button key={num} onClick={() => { setLogPage(num); loadLogs(num, logKeyword, logAction); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === logPage ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => { const p = logPage + 1; setLogPage(p); loadLogs(p, logKeyword, logAction); }}
                    disabled={logPage >= logTotalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 삭제 게시글 탭 ── */}
        {tab === 'deletedPosts' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-100 gap-3">
              <span className="font-semibold text-gray-700">
                삭제된 게시글
                <span className="ml-2 text-sm text-gray-400">({deletedPostTotalElements}건)</span>
              </span>
              <input type="text" placeholder="🔍 제목 또는 작성자"
                value={deletedPostKeyword}
                onChange={e => { const v = e.target.value; setDeletedPostKeyword(v); setDeletedPostPage(0); loadDeletedPosts(0, v); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 w-48"
              />
            </div>

            {deletedPostLoading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : deletedPosts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">삭제된 게시글이 없습니다.</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['번호', '카테고리', '제목', '작성자', '삭제일', '관리'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deletedPosts.map(post => (
                      <tr key={post.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-400">{post.id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.category === 'NOTICE' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
                          }`}>
                            {post.categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{post.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{post.authorName}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleRestorePost(post.id, post.title)}
                              className="px-3 py-1 rounded-lg text-xs bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                              복구
                            </button>
                            <button onClick={() => handlePermanentDeletePost(post.id, post.title)}
                              className="px-3 py-1 rounded-lg text-xs bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                              영구삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => { const p = deletedPostPage - 1; setDeletedPostPage(p); loadDeletedPosts(p, deletedPostKeyword); }}
                    disabled={deletedPostPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {Array.from({ length: deletedPostTotalPages }, (_, i) => i).map(num => (
                    <button key={num} onClick={() => { setDeletedPostPage(num); loadDeletedPosts(num, deletedPostKeyword); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === deletedPostPage ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => { const p = deletedPostPage + 1; setDeletedPostPage(p); loadDeletedPosts(p, deletedPostKeyword); }}
                    disabled={deletedPostPage >= deletedPostTotalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 활성/탈퇴 회원 탭 ── */}
        {tab !== 'logs' && tab !== 'deletedPosts' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-700">
                {tab === 'deleted' ? '탈퇴 회원 목록' : '전체 회원 목록'}
                <span className="ml-2 text-sm text-gray-400">({currentPage + 1} / {totalPages || 1} 페이지)</span>
              </span>
              <input type="text" placeholder="🔍 이름 또는 이메일 검색"
                value={keyword} onChange={handleKeywordChange}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-48"
              />
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {(tab === 'deleted'
                        ? ['ID', '이름', '이메일', '탈퇴일', '관리']
                        : ['ID', '이름', '이메일', '권한', '가입일']
                      ).map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-10 text-gray-400">
                        {tab === 'deleted' ? '탈퇴 회원이 없습니다.' : '회원이 없습니다.'}
                      </td></tr>
                    ) : tab === 'deleted' ? (
                      users.map(u => (
                        <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedUser(u)}>
                          <td className="px-4 py-3 text-sm text-gray-400">{u.id}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-400">{u.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleRestore(u.id, u.username)}
                                className="px-3 py-1 rounded-lg text-xs transition-colors bg-green-50 hover:bg-green-100 text-green-600">
                                복구
                              </button>
                              <button onClick={() => handlePermanentDelete(u.id, u.username)}
                                className="px-3 py-1 rounded-lg text-xs transition-colors bg-red-50 hover:bg-red-100 text-red-600">
                                영구삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      users.map(u => {
                        const isMe = u.id === currentUserId;
                        return (
                          <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/admin/users/${u.id}?from=${currentPage + 1}${keyword ? '&keyword=' + encodeURIComponent(keyword) : ''}`)}>
                            <td className="px-4 py-3 text-sm text-gray-400">{u.id}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600 hover:underline">
                              {u.username}{isMe && <span className="ml-1 text-xs text-blue-400">(나)</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {pageNumbers.map(num => (
                    <button key={num} onClick={() => goToPage(num)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
