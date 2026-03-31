import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, getTokenPayload, isAdmin, logout } from '../utils/authFetch';
import { useEffect, useState } from 'react';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const [myProfile, setMyProfile] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      authFetch('/api/users/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMyProfile(d); });
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await authFetch('/api/users/logout', { method: 'POST' });
    logout();
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 네비게이션 바 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* 좌측: 로고 + 메뉴 */}
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/home')}
              className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0">
              🏠 홈
            </button>
            <nav className="flex items-center gap-1">
              <Link to="/board?category=NOTICE"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/board') && new URLSearchParams(location.search).get('category') === 'NOTICE'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                📢 공지사항
              </Link>
              <Link to="/board?category=FREE"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/board') && new URLSearchParams(location.search).get('category') === 'FREE'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}>
                💬 자유게시판
              </Link>
              {isLoggedIn && (
                <Link to="/mypage"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/mypage') ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  ⚙️ 마이페이지
                </Link>
              )}
              {isAdmin() && (
                <Link to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'bg-purple-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  🛠️ 관리자
                </Link>
              )}
            </nav>
          </div>

          {/* 우측: 프로필 + 알림 + 로그인/로그아웃 */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <NotificationBell showProfile={false} />
                <button onClick={() => navigate('/mypage')}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                  <UserAvatar profileImageUrl={myProfile?.profileImageUrl} username={myProfile?.username ?? payload?.username} size={7} />
                  <span className="text-sm font-medium text-gray-600 hidden sm:block">
                    {myProfile?.username ?? payload?.username}
                  </span>
                </button>
                <button onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login')}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                로그인
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 콘텐츠 영역 */}
      <main>
        {children}
      </main>
    </div>
  );
}
