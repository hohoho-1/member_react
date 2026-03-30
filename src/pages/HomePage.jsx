import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, logout, isAdmin } from '../utils/authFetch';
import NotificationBell from '../components/NotificationBell';

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    authFetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setUser(data); else navigate('/login'); })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = async () => {
    await authFetch('/api/users/logout', { method: 'POST' });
    logout();
  };

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-96 text-center">
        <div className="flex justify-end mb-2">
          <NotificationBell />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-4">🏠 홈</h2>
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <p className="text-gray-700">안녕하세요, <span className="font-bold text-blue-500">{user.username}</span>님!</p>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
            {user.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
          </span>
        </div>
        <div className="space-y-2">
          <button onClick={() => navigate('/mypage')}
            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors">
            ⚙️ 마이페이지
          </button>
          <button onClick={() => navigate('/board')}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
            📋 게시판
          </button>
          {isAdmin() && (
            <button onClick={() => navigate('/admin')}
              className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors">
              🛠️ 관리자 페이지
            </button>
          )}
          <button onClick={handleLogout}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors">
            🚪 로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
