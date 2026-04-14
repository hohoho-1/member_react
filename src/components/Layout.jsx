import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, getTokenPayload, isAdmin } from '../utils/authFetch';
import { useEffect, useState, useRef } from 'react';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { useTheme } from '../context/ThemeContext';
import { usePageView } from '../hooks/usePageView';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const [myProfile, setMyProfile] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const isComposing = useRef(false);
  const { isDark, toggleTheme } = useTheme();

  usePageView(); // 페이지뷰 자동 기록

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
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">

          {/* 로고 */}
          <button onClick={() => navigate('/home')}
            className="text-lg font-bold text-blue-600 hover:text-blue-700 transition-colors shrink-0">
            🏠
          </button>

          {/* 메뉴 */}
          <nav className="flex items-center gap-0.5 shrink-0">
            {[
              { to: '/community', label: '커뮤니티', active: 'bg-blue-500' },
              { to: '/support',   label: '고객센터', active: 'bg-green-500' },
              { to: '/schedule',  label: '일정',     active: 'bg-teal-500' },
            { to: '/courses',   label: '강의',     active: 'bg-indigo-500',
              isMatch: (path) => path.startsWith('/courses') && !path.startsWith('/courses/admin') },
              ...(isLoggedIn ? [{ to: '/mypage', label: '마이페이지', active: 'bg-blue-500' }] : []),
              ...(isAdmin()  ? [{ to: '/admin',  label: '관리자',    active: 'bg-purple-500' }] : []),
            ].map((item) => (
              <Link key={item.to} to={item.to}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  (item.isMatch ? item.isMatch(location.pathname) : isActive(item.to))
                    ? `${item.active} text-white`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 검색창 */}
          <div className="flex-1 min-w-0 mx-2">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onCompositionStart={() => { isComposing.current = true; }}
              onCompositionEnd={() => { isComposing.current = false; }}
              onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
              placeholder="🔍 제목, 작성자로 검색"
              className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 transition-colors"
            />
          </div>

          {/* 우측: 다크모드 + 알림 + 프로필 + 로그인 */}
          <div className="flex items-center gap-1.5 shrink-0">
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
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <UserAvatar profileImageUrl={myProfile?.profileImageUrl} username={myProfile?.username ?? payload?.username} size={7} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden md:block max-w-[80px] truncate">
                    {myProfile?.username ?? payload?.username}
                  </span>
                </button>
                <button onClick={handleLogout}
                  className="px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login', { state: { from: location } })}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
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
