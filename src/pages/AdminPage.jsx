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

        {/* 아바타 + 이름/이메일 */}
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

        {/* 상세 정보 */}
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

        {/* 액션 버튼 */}
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

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 탭: 'active' | 'deleted'
  const tab = searchParams.get('tab') ?? 'active';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null); // 모달용

  // URL 파라미터에서 읽을 때: URL의 page=2 → 내부 0-based index=1로 변환
  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);
  const keyword = searchParams.get('keyword') ?? '';

  const currentUserId = getTokenPayload()?.userId;

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    loadUsers(currentPage, keyword, tab);
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

  const switchTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const goToPage = (page) => {
    const params = { tab };
    // 내부 0-based → URL 1-based로 변환, 1페이지는 파라미터 생략
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

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <DeletedUserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
      <div className="max-w-3xl mx-auto">
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

        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <p className="text-4xl font-bold text-blue-500">{totalElements}</p>
          <p className="text-sm text-gray-400 mt-1">
            {tab === 'deleted' ? '탈퇴 회원 수' : '활성 회원 수'}
          </p>
        </div>

        {/* 탭 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          <button
            onClick={() => switchTab('active')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            👥 활성 회원
          </button>
          <button
            onClick={() => switchTab('deleted')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'deleted' ? 'bg-red-400 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🗑️ 탈퇴 회원
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-700">
              {tab === 'deleted' ? '탈퇴 회원 목록' : '전체 회원 목록'}
              <span className="ml-2 text-sm text-gray-400">({currentPage + 1} / {totalPages || 1} 페이지)</span>
            </span>
            <input
              type="text" placeholder="🔍 이름 또는 이메일 검색"
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
                    {tab === 'deleted'
                      ? ['ID', '이름', '이메일', '탈퇴일', '관리'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))
                      : ['ID', '이름', '이메일', '권한', '가입일'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))
                    }
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
                        <td className="px-4 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600">{u.username}</td>
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
                            {u.username}
                            {isMe && <span className="ml-1 text-xs text-blue-400">(나)</span>}
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
      </div>
    </div>
  );
}
