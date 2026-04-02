import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from '../components/UserAvatar';

export default function HomePage() {
  const navigate = useNavigate();
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const [user, setUser]             = useState(null);
  const [recentPosts, setRecentPosts]     = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const init = async () => {
      // 유저 정보
      const userRes = await authFetch('/api/users/me');
      if (!userRes.ok) { navigate('/login'); return; }
      setUser(await userRes.json());

      // 홈 위젯 데이터
      const homeRes = await authFetch('/api/home');
      if (homeRes.ok) {
        const data = await homeRes.json();
        setRecentPosts(data.recentPosts ?? []);
        setRecentNotices(data.recentNotices ?? []);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

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

  if (!user || loading) return (
    <div className="flex items-center justify-center py-20 text-gray-400">로딩 중...</div>
  );

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── 환영 배너 ── */}
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
              <h3 className="font-bold text-gray-700">🔥 최근 게시글</h3>
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
