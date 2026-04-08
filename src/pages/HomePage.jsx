import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from '../components/UserAvatar';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const [user, setUser]             = useState(null);
  const [recentPosts, setRecentPosts]     = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [faqPosts, setFaqPosts]           = useState([]);
  const [popularPosts, setPopularPosts]   = useState([]);
  const [galleryPosts, setGalleryPosts]   = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [loading, setLoading]       = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      // 유저 정보 (로그인 상태일 때만)
      if (payload) {
        const userRes = await authFetch('/api/users/me');
        if (userRes.ok) setUser(await userRes.json());
      }

      // 홈 위젯 데이터 (비로그인도 가능)
      const homeRes = await authFetch('/api/posts/home');
      if (homeRes.ok) {
        const data = await homeRes.json();
        setRecentPosts(data.recentPosts ?? []);
        setRecentNotices(data.recentNotices ?? []);
        setFaqPosts(data.faqPosts ?? []);
        setPopularPosts(data.popularPosts ?? []);
        setGalleryPosts(data.galleryPosts ?? []);
      }

      // 이번 달 + 다음달 일정 (오늘 이후만 필터)
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const schedRes = await authFetch(`/api/schedules?year=${year}&month=${month}`);
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const today = now.toISOString().slice(0, 10);
        const filtered = schedData
          .filter(s => s.endDate >= today)
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .slice(0, 5);
        setUpcomingSchedules(filtered);
      }
      setLoading(false);
    };
    init();
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min  = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day  = Math.floor(diff / 86400000);
    if (min < 1)   return '방금 전';
    if (min < 60)  return `${min}분 전`;
    if (hour < 24) return `${hour}시간 전`;
    if (day < 7)   return `${day}일 전`;
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const boardBadge = (code) => {
    const map = {
      FREE:       { label: '자유',   cls: 'bg-blue-100 text-blue-600' },
      GALLERY:    { label: '갤러리', cls: 'bg-purple-100 text-purple-600' },
      QNA:        { label: 'QnA',    cls: 'bg-amber-100 text-amber-700' },
      SUGGESTION: { label: '건의',   cls: 'bg-teal-100 text-teal-700' },
    };
    return map[code] ?? { label: code, cls: 'bg-gray-100 text-gray-600' };
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">로딩 중...</div>
  );

  const isLoggedIn = !!payload;

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── 환영 배너 ── */}
        {isLoggedIn && user ? (
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl shadow p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar profileImageUrl={user.profileImageUrl} username={user.username} size={14} />
              <div>
                <p className="text-blue-100 text-sm">안녕하세요 👋</p>
                <p className="text-white text-xl font-bold">{user.username}님</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isAdmin ? 'bg-yellow-300 text-yellow-900' : 'bg-blue-200 text-blue-800'
                }`}>
                  {isAdmin ? '👑 관리자' : '일반회원'}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2">
              <button onClick={() => navigate('/community?scope=FREE')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">
                📋 게시판 바로가기
              </button>
              <button onClick={() => navigate('/mypage')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">
                👤 마이페이지
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl shadow p-6 flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">환영합니다 👋</p>
              <p className="text-white text-xl font-bold">커뮤니티에 오신 걸 환영해요!</p>
              <p className="text-blue-100 text-sm mt-1">로그인하면 글쓰기, 좋아요, 북마크 등 더 많은 기능을 이용할 수 있어요.</p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 ml-4">
              <button onClick={() => navigate('/login', { state: { from: location } })}
                className="px-4 py-2 bg-white text-blue-500 hover:bg-blue-50 rounded-xl text-sm font-bold transition-colors">
                🔐 로그인
              </button>
              <button onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">
                ✍️ 회원가입
              </button>
            </div>
          </div>
        )}

        {/* ── 빠른 이동 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '💬', label: '자유게시판',  path: '/community?scope=FREE' },
            { emoji: '🖼️', label: '사진갤러리',  path: '/community?scope=GALLERY' },
            { emoji: '❓', label: 'QnA',         path: '/support?scope=QNA' },
            { emoji: '📬', label: '건의사항',     path: '/support?scope=SUGGESTION' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="bg-white rounded-2xl shadow p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-semibold text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* ── 최근 공지사항 ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">📢 공지사항</h3>
              <button onClick={() => navigate('/support?scope=NOTICE')}
                className="text-xs text-blue-400 hover:text-blue-600">더보기 →</button>
            </div>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">등록된 공지사항이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {recentNotices.map(post => (
                  <li key={post.id}
                    onClick={() => navigate(`/board/${post.id}?scope=NOTICE&returnTo=${encodeURIComponent('/support?scope=NOTICE')}`)}
                    className="cursor-pointer group">
                    <div className="flex items-start gap-2">
                      {post.pinned && <span className="shrink-0 text-amber-400 text-xs font-bold mt-0.5">📌</span>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── 최근 게시글 ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">🔔 최근 게시글</h3>
              <button onClick={() => navigate('/community?scope=FREE')}
                className="text-xs text-blue-400 hover:text-blue-600">더보기 →</button>
            </div>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">게시글이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {recentPosts.map(post => {
                  const badge = boardBadge(post.boardCode);
                  return (
                    <li key={post.id}
                      onClick={() => navigate(`/board/${post.id}?scope=${post.boardCode}&returnTo=${encodeURIComponent(`/${post.boardGroup?.toLowerCase() ?? 'community'}?scope=${post.boardCode}`)}`)}
                      className="cursor-pointer group">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                            {post.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{post.authorName}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{timeAgo(post.createdAt)}</span>
                            {post.commentCount > 0 && (
                              <span className="text-xs text-blue-400">💬 {post.commentCount}</span>
                            )}
                            {post.likeCount > 0 && (
                              <span className="text-xs text-red-400">❤️ {post.likeCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* ── FAQ ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">❓ 자주 묻는 질문</h3>
              <button onClick={() => navigate('/support?scope=FAQ')}
                className="text-xs text-blue-400 hover:text-blue-600">더보기 →</button>
            </div>
            {faqPosts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">등록된 FAQ가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {faqPosts.map(post => (
                  <li key={post.id}
                    onClick={() => navigate(`/support?scope=FAQ&open=${post.id}`)}
                    className="cursor-pointer group flex items-start gap-2 py-1">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">Q</span>
                    <p className="text-sm text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                      {post.title}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── 인기글 ── */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">🔥 인기글 <span className="text-xs font-normal text-gray-400 ml-1">최근 7일</span></h3>
            </div>
            {popularPosts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">인기글이 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {popularPosts.map((post, i) => {
                  const badge = boardBadge(post.boardCode);
                  return (
                    <li key={post.id}
                      onClick={() => navigate(`/board/${post.id}?scope=${post.boardCode}&returnTo=${encodeURIComponent(`/${post.boardGroup?.toLowerCase() ?? 'community'}?scope=${post.boardCode}`)}`)}
                      className="cursor-pointer group flex items-center gap-3 py-1.5">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-400 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                      <p className="flex-1 text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate transition-colors">
                        {post.title}
                      </p>
                      <div className="shrink-0 flex items-center gap-2 text-xs text-gray-400">
                        {post.viewCount > 0 && <span>👁️ {post.viewCount}</span>}
                        {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── 일정 위젯 ── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700 dark:text-gray-100">📅 다가오는 일정</h3>
            <button onClick={() => navigate('/schedule')}
              className="text-xs text-blue-400 hover:text-blue-600">전체보기 →</button>
          </div>
          {upcomingSchedules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">예정된 일정이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {upcomingSchedules.map(s => {
                const today = new Date().toISOString().slice(0, 10);
                const isToday = s.startDate <= today && s.endDate >= today;
                return (
                  <li key={s.id}
                    onClick={() => navigate('/schedule')}
                    className="cursor-pointer group flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity">
                    {/* 색상 바 */}
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: s.color ?? '#3B82F6' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-blue-600 transition-colors">
                        {s.visibility === 'PRIVATE' && <span className="mr-1">🔒</span>}
                        {s.visibility === 'MEMBER'  && <span className="mr-1">👥</span>}
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.startDate === s.endDate ? s.startDate : `${s.startDate} ~ ${s.endDate}`}
                      </p>
                    </div>
                    {isToday && (
                      <span className="shrink-0 px-2 py-0.5 bg-teal-100 text-teal-600 text-xs font-semibold rounded-full">
                        오늘
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── 갤러리 미리보기 ── */}
        {galleryPosts.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">🖼️ 갤러리</h3>
              <button onClick={() => navigate('/community?scope=GALLERY')}
                className="text-xs text-blue-400 hover:text-blue-600">더보기 →</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {galleryPosts.map(post => (
                <div key={post.id}
                  onClick={() => navigate(`/board/${post.id}?scope=GALLERY&returnTo=${encodeURIComponent('/community?scope=GALLERY')}`)}
                  className="cursor-pointer aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity relative group">
                  {post.thumbnailUrl ? (
                    <img
                      src={`http://localhost:8080${post.thumbnailUrl}`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🖼️</div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 관리자 바로가기 ── */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div>
                <p className="font-semibold text-gray-700">관리자 페이지</p>
                <p className="text-xs text-gray-400">회원 관리, 게시글 관리, AI 인사이트</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">
              바로가기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
