import { useEffect, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from '../components/UserAvatar';
import { SkeletonPage } from '../components/SkeletonLoader';

export default function HomePage() {
  usePageTitle(); // 홈은 "GetSmart"만
  const navigate = useNavigate();
  const location = useLocation();
  const payload = getTokenPayload();
  const isAdmin = payload?.role === 'ROLE_ADMIN';

  const [user, setUser]                         = useState(null);
  const [recentPosts, setRecentPosts]           = useState([]);
  const [recentNotices, setRecentNotices]       = useState([]);
  const [faqPosts, setFaqPosts]                 = useState([]);
  const [popularPosts, setPopularPosts]         = useState([]);
  const [galleryPosts, setGalleryPosts]         = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [upcomingCourses, setUpcomingCourses]   = useState([]);
  const [loading, setLoading]                   = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const init = async () => {
      if (payload) {
        const userRes = await authFetch('/api/users/me');
        if (userRes.ok) setUser(await userRes.json());
      }
      const homeRes = await authFetch('/api/posts/home');
      if (homeRes.ok) {
        const data = await homeRes.json();
        setRecentPosts(data.recentPosts ?? []);
        setRecentNotices(data.recentNotices ?? []);
        setFaqPosts(data.faqPosts ?? []);
        setPopularPosts(data.popularPosts ?? []);
        setGalleryPosts(data.galleryPosts ?? []);
      }
      const now = new Date();
      const year = now.getFullYear(); const month = now.getMonth() + 1;
      const schedRes = await authFetch(`/api/schedules?year=${year}&month=${month}`);
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        const today = now.toISOString().slice(0, 10);
        setUpcomingSchedules(schedData.filter(s => s.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 5));
      }
      const courseRes = await fetch('/api/courses?size=4');
      if (courseRes.ok) { const courseData = await courseRes.json(); setUpcomingCourses(courseData.content ?? []); }
      setLoading(false);
    };
    init();
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000); const hour = Math.floor(diff / 3600000); const day = Math.floor(diff / 86400000);
    if (min < 1) return '방금 전'; if (min < 60) return `${min}분 전`; if (hour < 24) return `${hour}시간 전`;
    if (day < 7) return `${day}일 전`; return new Date(dateStr).toLocaleDateString('ko-KR');
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

  // 공통 카드 클래스
  const card = 'bg-white dark:bg-gray-800 rounded-2xl shadow p-6';
  const cardTitle = 'font-bold text-gray-700 dark:text-gray-100';
  const moreBtn = 'text-xs text-blue-400 hover:text-blue-600 transition-colors';
  const emptyTxt = 'text-sm text-gray-400 text-center py-6';
  const itemTitle = 'text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 truncate transition-colors';

  if (loading) return <SkeletonPage />;
  const isLoggedIn = !!payload;

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── 환영 배너 ── */}
        {isLoggedIn && user ? (
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl shadow p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <UserAvatar profileImageUrl={user.profileImageUrl} username={user.username} size={12} />
                <div className="min-w-0">
                  <p className="text-blue-100 text-xs sm:text-sm">안녕하세요 👋</p>
                  <p className="text-white text-lg sm:text-xl font-bold truncate">{user.username}님</p>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isAdmin ? 'bg-yellow-300 text-yellow-900' : 'bg-blue-200 text-blue-800'}`}>
                    {isAdmin ? '👑 관리자' : '일반회원'}
                  </span>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 ml-4">
                <button onClick={() => navigate('/community?scope=FREE')} className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">📋 게시판 바로가기</button>
                <button onClick={() => navigate('/mypage')} className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">👤 마이페이지</button>
              </div>
            </div>
            {/* 모바일 전용 버튼 행 */}
            <div className="flex gap-2 mt-4 sm:hidden">
              <button onClick={() => navigate('/community?scope=FREE')} className="flex-1 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-xs font-medium transition-colors">📋 게시판</button>
              <button onClick={() => navigate('/mypage')} className="flex-1 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-xs font-medium transition-colors">👤 마이페이지</button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-blue-400 rounded-2xl shadow p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-blue-100 text-xs sm:text-sm">환영합니다 👋</p>
                <p className="text-white text-lg sm:text-xl font-bold">커뮤니티에 오신 걸 환영해요!</p>
                <p className="text-blue-100 text-xs sm:text-sm mt-1">로그인하면 글쓰기, 좋아요, 북마크 등 더 많은 기능을 이용할 수 있어요.</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 ml-4">
                <button onClick={() => navigate('/login', { state: { from: location } })} className="px-4 py-2 bg-white text-blue-500 hover:bg-blue-50 rounded-xl text-sm font-bold transition-colors">🔐 로그인</button>
                <button onClick={() => navigate('/signup')} className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-sm font-medium transition-colors">✍️ 회원가입</button>
              </div>
            </div>
            {/* 모바일 전용 버튼 행 */}
            <div className="flex gap-2 mt-4 sm:hidden">
              <button onClick={() => navigate('/login', { state: { from: location } })} className="flex-1 py-2 bg-white text-blue-500 hover:bg-blue-50 rounded-xl text-xs font-bold transition-colors">🔐 로그인</button>
              <button onClick={() => navigate('/signup')} className="flex-1 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl text-xs font-medium transition-colors">✍️ 회원가입</button>
            </div>
          </div>
        )}

        {/* ── 빠른 이동 ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { emoji: '💬', label: '자유게시판', path: '/community?scope=FREE' },
            { emoji: '🖼️', label: '사진갤러리', path: '/community?scope=GALLERY' },
            { emoji: '❓', label: 'QnA',        path: '/support?scope=QNA' },
            { emoji: '📬', label: '건의사항',    path: '/support?scope=SUGGESTION' },
          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* ── 공지사항 ── */}
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>📢 공지사항</h3>
              <button onClick={() => navigate('/support?scope=NOTICE')} className={moreBtn}>더보기 →</button>
            </div>
            {recentNotices.length === 0 ? <p className={emptyTxt}>등록된 공지사항이 없습니다.</p> : (
              <ul className="space-y-3">
                {recentNotices.map(post => (
                  <li key={post.id} onClick={() => navigate(`/board/${post.id}?scope=NOTICE&returnTo=${encodeURIComponent('/support?scope=NOTICE')}`)} className="cursor-pointer group">
                    <div className="flex items-start gap-2">
                      {post.pinned && <span className="shrink-0 text-amber-400 text-xs font-bold mt-0.5">📌</span>}
                      <div className="flex-1 min-w-0">
                        <p className={itemTitle}>{post.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(post.createdAt)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── 최근 게시글 ── */}
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>🔔 최근 게시글</h3>
              <button onClick={() => navigate('/community?scope=FREE')} className={moreBtn}>더보기 →</button>
            </div>
            {recentPosts.length === 0 ? <p className={emptyTxt}>게시글이 없습니다.</p> : (
              <ul className="space-y-3">
                {recentPosts.map(post => {
                  const badge = boardBadge(post.boardCode);
                  return (
                    <li key={post.id} onClick={() => navigate(`/board/${post.id}?scope=${post.boardCode}&returnTo=${encodeURIComponent(`/${post.boardGroup?.toLowerCase() ?? 'community'}?scope=${post.boardCode}`)}`)} className="cursor-pointer group">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-0.5 ${badge.cls}`}>{badge.label}</span>
                        <div className="flex-1 min-w-0">
                          <p className={itemTitle}>{post.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 dark:text-gray-500">{post.authorName}</span>
                            <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</span>
                            {post.commentCount > 0 && <span className="text-xs text-blue-400">💬 {post.commentCount}</span>}
                            {post.likeCount > 0 && <span className="text-xs text-red-400">❤️ {post.likeCount}</span>}
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
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>❓ 자주 묻는 질문</h3>
              <button onClick={() => navigate('/support?scope=FAQ')} className={moreBtn}>더보기 →</button>
            </div>
            {faqPosts.length === 0 ? <p className={emptyTxt}>등록된 FAQ가 없습니다.</p> : (
              <ul className="space-y-2">
                {faqPosts.map(post => (
                  <li key={post.id} onClick={() => navigate(`/support?scope=FAQ&open=${post.id}`)} className="cursor-pointer group flex items-start gap-2 py-1">
                    <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">Q</span>
                    <p className={itemTitle}>{post.title}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── 인기글 ── */}
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>🔥 인기글 <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">최근 7일</span></h3>
            </div>
            {popularPosts.length === 0 ? <p className={emptyTxt}>인기글이 없습니다.</p> : (
              <ul className="space-y-2">
                {popularPosts.map((post, i) => {
                  const badge = boardBadge(post.boardCode);
                  return (
                    <li key={post.id} onClick={() => navigate(`/board/${post.id}?scope=${post.boardCode}&returnTo=${encodeURIComponent(`/${post.boardGroup?.toLowerCase() ?? 'community'}?scope=${post.boardCode}`)}`)} className="cursor-pointer group flex items-center gap-3 py-1.5">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{i + 1}</span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                      <p className={`flex-1 ${itemTitle}`}>{post.title}</p>
                      <div className="shrink-0 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
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

        {/* ── 다가오는 일정 ── */}
        <div className={card}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={cardTitle}>📅 다가오는 일정</h3>
            <button onClick={() => navigate('/schedule')} className={moreBtn}>전체보기 →</button>
          </div>
          {upcomingSchedules.length === 0 ? <p className={emptyTxt}>예정된 일정이 없습니다.</p> : (
            <ul className="space-y-2">
              {upcomingSchedules.map(s => {
                const today = new Date().toISOString().slice(0, 10);
                const isToday = s.startDate <= today && s.endDate >= today;
                return (
                  <li key={s.id} onClick={() => navigate(`/schedule?open=${s.id}`)} className="cursor-pointer group flex items-center gap-3 py-1.5 hover:opacity-80 transition-opacity">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: s.color ?? '#3B82F6' }} />
                    <div className="flex-1 min-w-0">
                      <p className={itemTitle}>
                        {s.visibility === 'PRIVATE' && <span className="mr-1">🔒</span>}
                        {s.visibility === 'MEMBER' && <span className="mr-1">👥</span>}
                        {s.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.startDate === s.endDate ? s.startDate : `${s.startDate} ~ ${s.endDate}`}</p>
                    </div>
                    {isToday && <span className="shrink-0 px-2 py-0.5 bg-teal-100 text-teal-600 text-xs font-semibold rounded-full">오늘</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── 갤러리 미리보기 ── */}
        {galleryPosts.length > 0 && (
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>🖼️ 갤러리</h3>
              <button onClick={() => navigate('/community?scope=GALLERY')} className={moreBtn}>더보기 →</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galleryPosts.map(post => (
                <div key={post.id} onClick={() => navigate(`/board/${post.id}?scope=GALLERY&returnTo=${encodeURIComponent('/community?scope=GALLERY')}`)}
                  className="cursor-pointer aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 hover:opacity-80 transition-opacity relative group">
                  {post.thumbnailUrl
                    ? <img src={`http://localhost:8080${post.thumbnailUrl}`} alt={post.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300">🖼️</div>
                  }
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 강의 위젯 ── */}
        {upcomingCourses.length > 0 && (
          <div className={card}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={cardTitle}>📚 강의</h3>
              <button onClick={() => navigate('/courses')} className={moreBtn}>더보기 →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingCourses.map(course => {
                const today = new Date().toISOString().slice(0, 10);
                const isRecruiting = course.registrationStartDate && course.registrationEndDate && today >= course.registrationStartDate && today <= course.registrationEndDate;
                return (
                  <div key={course.id} onClick={() => navigate(`/courses/${course.id}`)}
                    className="cursor-pointer rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all bg-white dark:bg-gray-700">

                    {/* 모바일: 가로형 (썸네일 좌 + 정보 우) */}
                    <div className="flex sm:hidden">
                      <div className="w-[38%] shrink-0 aspect-[4/3] bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
                        {course.thumbnailUrl
                          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                          : <span className="text-2xl">📚</span>}
                      </div>
                      <div className="flex-1 min-w-0 p-3 space-y-1.5">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">{course.title}</p>
                        {course.instructor && <p className="text-xs text-gray-400">👨‍🏫 {course.instructor}</p>}
                        {course.location && <p className="text-xs text-gray-400">📍 {course.location}</p>}
                        {(course.registrationStartDate || course.registrationEndDate) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium shrink-0">접수</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{course.registrationStartDate ?? '?'} ~ {course.registrationEndDate ?? '?'}</span>
                          </div>
                        )}
                        {(course.educationStartDate || course.educationEndDate) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium shrink-0">교육</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{course.educationStartDate ?? '?'} ~ {course.educationEndDate ?? '?'}</span>
                          </div>
                        )}
                        {isRecruiting && <span className="inline-block text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">🟢 접수중</span>}
                        {course.maxStudents && (
                          <p className={`text-[10px] font-medium ${course.enrolledCount >= course.maxStudents ? 'text-red-400' : 'text-gray-400'}`}>
                            👥 {course.enrolledCount ?? 0} / {course.maxStudents}명{course.enrolledCount >= course.maxStudents ? ' (마감)' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 데스크탑: 세로형 (기존 레이아웃) */}
                    <div className="hidden sm:block">
                      <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
                        {course.thumbnailUrl
                          ? <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-contain bg-gray-900" />
                          : <span className="text-3xl">📚</span>}
                      </div>
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{course.title}</p>
                        {course.instructor && <p className="text-[10px] text-gray-400">👨‍🏫 {course.instructor}</p>}
                        {course.location && <p className="text-[10px] text-gray-400">📍 {course.location}</p>}
                        {(course.registrationStartDate || course.registrationEndDate) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium shrink-0">접수</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{course.registrationStartDate ?? '?'} ~ {course.registrationEndDate ?? '?'}</span>
                          </div>
                        )}
                        {(course.educationStartDate || course.educationEndDate) && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium shrink-0">교육</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{course.educationStartDate ?? '?'} ~ {course.educationEndDate ?? '?'}</span>
                          </div>
                        )}
                        {isRecruiting && <span className="inline-block text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">🟢 접수중</span>}
                        {course.maxStudents && (
                          <p className={`text-[10px] font-medium ${course.enrolledCount >= course.maxStudents ? 'text-red-400' : 'text-gray-400'}`}>
                            👥 {course.enrolledCount ?? 0} / {course.maxStudents}명{course.enrolledCount >= course.maxStudents ? ' (마감)' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 관리자 바로가기 ── */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛠️</span>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-100">관리자 페이지</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">회원 관리, 게시글 관리, AI 인사이트</p>
              </div>
            </div>
            <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-colors">바로가기</button>
          </div>
        )}

      </div>
    </div>
  );
}
