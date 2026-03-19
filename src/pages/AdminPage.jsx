import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, isAdmin } from '../utils/authFetch';

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    authFetch('/api/users/admin/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => { setUsers(data); setLoading(false); });
  }, [navigate]);

  const handleDelete = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 삭제하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) setUsers(users.filter(u => u.id !== id));
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const roleName = newRole === 'ROLE_ADMIN' ? '관리자' : '일반회원';
    if (!window.confirm(`권한을 '${roleName}'으로 변경하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(users.map(u => u.id === id ? updated : u));
    }
  };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(keyword.toLowerCase()) ||
    u.email.toLowerCase().includes(keyword.toLowerCase())
  );

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

        {/* 통계 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
          <p className="text-4xl font-bold text-blue-500">{users.length}</p>
          <p className="text-sm text-gray-400 mt-1">전체 회원 수</p>
        </div>

        {/* 회원 목록 */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-700">전체 회원 목록</span>
            <input
              type="text" placeholder="🔍 이름 또는 이메일 검색"
              value={keyword} onChange={e => setKeyword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-48"
            />
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-400">로딩 중...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['ID', '이름', '이메일', '구분', '관리'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">회원이 없습니다.</td></tr>
                ) : filtered.map(u => (
                  <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{u.id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-700">{u.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleRoleChange(u.id, u.role)}
                          className={`px-3 py-1 rounded-lg text-xs transition-colors ${u.role === 'ROLE_ADMIN' ? 'bg-pink-50 hover:bg-pink-100 text-pink-600' : 'bg-purple-50 hover:bg-purple-100 text-purple-600'}`}>
                          {u.role === 'ROLE_ADMIN' ? '→ 일반' : '→ 관리자'}
                        </button>
                        <button onClick={() => handleDelete(u.id, u.username)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs transition-colors">
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
