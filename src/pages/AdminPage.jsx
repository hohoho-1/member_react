import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, isAdmin, getTokenPayload } from '../utils/authFetch';

const PAGE_SIZE = 5;

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') ?? '0'));
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');

  const currentUserId = getTokenPayload()?.userId;
  const isFirstRender = useRef(true);

  const fetchUsers = async (page, search) => {
    setLoading(true);
    // URL 파라미터 업데이트
    const params = {};
    if (page > 0) params.page = String(page);
    if (search) params.keyword = search;
    setSearchParams(params, { replace: true });

    const res = await authFetch(`/api/users/admin/users?page=${page}&size=${PAGE_SIZE}&keyword=${encodeURIComponent(search)}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setCurrentPage(data.currentPage);
    }
    setLoading(false);
  };

  // 최초 로드: URL 파라미터에서 page, keyword 읽어서 시작
  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    const page = parseInt(searchParams.get('page') ?? '0');
    const kw = searchParams.get('keyword') ?? '';
    fetchUsers(page, kw);
  }, []);

  // 검색어 변경 시 디바운스 (첫 렌더링 제외)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const timer = setTimeout(() => fetchUsers(0, keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const handleDelete = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 삭제하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const newPage = users.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      fetchUsers(newPage, keyword);
    } else {
      const data = await res.json();
      showError(data.message || '삭제에 실패했습니다.');
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const roleName = newRole === 'ROLE_ADMIN' ? '관리자' : '일반회원';
    if (!window.confirm(`권한을 '${roleName}'으로 변경하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) fetchUsers(currentPage, keyword);
    else {
      const data = await res.json();
      showError(data.message || '권한 변경에 실패했습니다.');
    }
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  const adminCount = users.filter(u => u.role === 'ROLE_ADMIN').length;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-100 p-10">
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

        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <p className="text-4xl font-bold text-blue-500">{totalElements}</p>
          <p className="text-sm text-gray-400 mt-1">전체 회원 수</p>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-700">
              전체 회원 목록
              <span className="ml-2 text-sm text-gray-400">({currentPage + 1} / {totalPages} 페이지)</span>
            </span>
            <input
              type="text" placeholder="🔍 이름 또는 이메일 검색"
              value={keyword} onChange={e => setKeyword(e.target.value)}
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
                    {['ID', '이름', '이메일', '구분', '관리'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-400">회원이 없습니다.</td></tr>
                  ) : users.map(u => {
                    const isMe = u.id === currentUserId;
                    const isLastAdmin = u.role === 'ROLE_ADMIN' && adminCount <= 1;
                    const canChangeRole = !isMe && !isLastAdmin;
                    return (
                      <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">{u.id}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}?from=${currentPage}${keyword ? '&keyword=' + encodeURIComponent(keyword) : ''}`)}
                            className="hover:text-blue-500 hover:underline transition-colors text-left">
                            {u.username}
                            {isMe && <span className="ml-1 text-xs text-blue-400">(나)</span>}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => canChangeRole && handleRoleChange(u.id, u.role)} disabled={!canChangeRole}
                              title={isMe ? '자신의 권한은 변경할 수 없습니다' : isLastAdmin ? '마지막 관리자는 강등할 수 없습니다' : ''}
                              className={`px-3 py-1 rounded-lg text-xs transition-colors ${!canChangeRole ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : u.role === 'ROLE_ADMIN' ? 'bg-pink-50 hover:bg-pink-100 text-pink-600' : 'bg-purple-50 hover:bg-purple-100 text-purple-600'}`}>
                              {u.role === 'ROLE_ADMIN' ? '→ 일반' : '→ 관리자'}
                            </button>
                            <button onClick={() => !isMe && handleDelete(u.id, u.username)} disabled={isMe}
                              title={isMe ? '자신은 삭제할 수 없습니다' : ''}
                              className={`px-3 py-1 rounded-lg text-xs transition-colors ${isMe ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                <button onClick={() => fetchUsers(currentPage - 1, keyword)} disabled={currentPage === 0}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                {pageNumbers.map(num => (
                  <button key={num} onClick={() => fetchUsers(num, keyword)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {num + 1}
                  </button>
                ))}
                <button onClick={() => fetchUsers(currentPage + 1, keyword)} disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
