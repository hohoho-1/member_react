import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, getTokenPayload, isAdmin } from '../utils/authFetch';
import { useEffect, useState, useRef } from 'react';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const [myProfile, setMyProfile] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const isComposing = useRef(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    if (isLoggedIn) {
      authFetch('/api/users/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMyProfile(d); });
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await authFetch('/api/users/logout', { method: 'POST' });
    // 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 로그인이 필요한 페이지(마이페이지, 관리자)였으면 홈으로, 아니면 현재 페이지 유지(새로고침)
    const privatePaths = ['/mypage', '/admin'];
    const isPrivate = privatePaths.some(p => location.pathname.startsWith(p));
    if (isPrivate) {
      navigate('/home', { replace: true });
    } else {
      // 현재 페이지에서 상태만 갱신 (새로고침)
      window.location.reload();
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    navigate(`/search?keyword=${encodeURIComponent(searchInput.trim())}`);
    setSearchInput('');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* 상단 네비게이션 바 */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* 좌측: 로고 + 메뉴 */}
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/home')}
              className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0">
              🏠 홈
            </button>
            <nav className="flex items-center gap-1">
              <Link to="/community"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/community') ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                💬 커뮤니티
              </Link>
              <Link to="/support"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/support') ? 'bg-green-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                🎧 고객센터
              </Link>
              <Link to="/schedule"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/schedule') ? 'bg-teal-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                📅 일정
              </Link>
              {isLoggedIn && (
                <Link to="/mypage"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/mypage') ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                  ⚙️ 마이페이지
                </Link>
              )}
              {isAdmin() && (
                <Link to="/admin"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/admin') ? 'bg-purple-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                  🛠️ 관리자
                </Link>
              )}
            </nav>
          </div>

          {/* 중앙: 검색창 */}
          <div className="flex items-center gap-1 flex-1 max-w-xs mx-4">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onCompositionStart={() => { isComposing.current = true; }}
              onCompositionEnd={() => { isComposing.current = false; }}
              onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
              placeholder="🔍 통합검색"
              className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 transition-colors"
            />
          </div>

          {/* 우측: 다크모드 토글 + 프로필 + 알림 + 로그인/로그아웃 */}
          <div className="flex items-center gap-2">
            {/* 다크모드 토글 */}
            <button
              onClick={toggleTheme}
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base">
              {isDark ? '☀️' : '🌙'}
            </button>

            {isLoggedIn ? (
              <>
                <NotificationBell showProfile={false} />
                <button onClick={() => navigate('/mypage')}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <UserAvatar profileImageUrl={myProfile?.profileImageUrl} username={myProfile?.username ?? payload?.username} size={7} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 hidden sm:block">
                    {myProfile?.username ?? payload?.username}
                  </span>
                </button>
                <button onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login', { state: { from: location } })}
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
