import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch, getTokenPayload, isAdmin } from '../utils/authFetch';
import { useEffect, useState, useRef } from 'react';
import NotificationBell from './NotificationBell';
import UserAvatar from './UserAvatar';
import { useTheme } from '../context/ThemeContext';
import { usePageView } from '../hooks/usePageView';

// ── 쪽지 뱃지 버튼 ─────────────────────────────────────────────────────────
function MessageBell() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const res = await authFetch('/api/messages/unread-count');
      if (res.ok) { const d = await res.json(); setUnread(d.count ?? 0); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);

    const handleRead = () => fetchUnread();
    window.addEventListener('message-read', handleRead);

    return () => { clearInterval(interval); window.removeEventListener('message-read', handleRead); };
  }, []);

  return (
    <button onClick={() => navigate('/messages')}
      title="쪽지함"
      className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base">
      ✉️
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isLoggedIn = !!payload;
  const [myProfile, setMyProfile] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isComposing = useRef(false);
  const { isDark, toggleTheme } = useTheme();

  usePageView();

  // 페이지 이동 시 모바일 메뉴 닫기
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isLoggedIn) {
      authFetch('/api/users/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMyProfile(d); });
    }
  }, [isLoggedIn]);

  const handleLogout = async () => {
    await authFetch('/api/users/logout', { method: 'POST' });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    const privatePaths = ['/mypage', '/admin'];
    const isPrivate = privatePaths.some(p => location.pathname.startsWith(p));
    if (isPrivate) {
      navigate('/home', { replace: true });
    } else {
      window.location.reload();
    }
  };

  const handleSearch = () => {
    if (!searchInput.trim()) return;
    navigate(`/search?keyword=${encodeURIComponent(searchInput.trim())}`);
    setSearchInput('');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const navItems = [
    { to: '/community', label: '커뮤니티', active: 'bg-blue-500' },
    { to: '/support',   label: '고객센터', active: 'bg-green-500' },
    { to: '/schedule',  label: '일정',     active: 'bg-teal-500' },
    { to: '/courses',   label: '강의',     active: 'bg-indigo-500',
      isMatch: (path) => path.startsWith('/courses') && !path.startsWith('/courses/admin') },
    ...(isLoggedIn ? [{ to: '/mypage', label: '마이페이지', active: 'bg-blue-500' }] : []),
    ...(isAdmin()  ? [{ to: '/admin',  label: '관리자',    active: 'bg-purple-500' }] : []),
  ];

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

          {/* 데스크탑 메뉴 */}
          <nav className="hidden md:flex items-center gap-0.5 shrink-0">
            {navItems.map((item) => (
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

          {/* 데스크탑 검색창 */}
          <div className="hidden md:flex flex-1 min-w-0 mx-2">
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

          {/* 우측 아이콘들 (공통) */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {/* 다크모드 토글 */}
            <button
              onClick={toggleTheme}
              title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-base">
              {isDark ? '☀️' : '🌙'}
            </button>

            {isLoggedIn ? (
              <>
                <MessageBell />
                <NotificationBell showProfile={false} />
                {/* 프로필 - 데스크탑만 이름 표시 */}
                <button onClick={() => navigate('/mypage')}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <UserAvatar profileImageUrl={myProfile?.profileImageUrl} username={myProfile?.username ?? payload?.username} size={7} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 hidden md:block max-w-[80px] truncate">
                    {myProfile?.username ?? payload?.username}
                  </span>
                </button>
                {/* 로그아웃 - 데스크탑만 표시 */}
                <button onClick={handleLogout}
                  className="hidden md:block px-2.5 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap">
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/login', { state: { from: location } })}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
                로그인
              </button>
            )}

            {/* 햄버거 버튼 - 모바일만 표시 */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="메뉴">
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 space-y-1">

            {/* 모바일 검색창 */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; }}
                onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
                placeholder="🔍 검색"
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">
                검색
              </button>
            </div>

            {/* 모바일 메뉴 항목 */}
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (item.isMatch ? item.isMatch(location.pathname) : isActive(item.to))
                    ? `${item.active} text-white`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                {item.label}
              </Link>
            ))}

            {/* 모바일 로그아웃 */}
            {isLoggedIn && (
              <button onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                로그아웃
              </button>
            )}
          </div>
        )}
      </header>

      {/* 콘텐츠 영역 */}
      <main>
        {children}
      </main>
    </div>
  );
}
