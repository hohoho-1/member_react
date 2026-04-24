import { useState, useEffect, useRef } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { authFetch, isAdmin, isLoggedIn } from '../utils/authFetch';
import { SkeletonCourseGrid } from '../components/SkeletonLoader';
import CourseThumbnail from '../components/CourseThumbnail';

export default function CourseListPage() {
  usePageTitle('강의 목록');
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  // 스크롤 위치 복원
  useEffect(() => {
    const saved = sessionStorage.getItem('courseListScroll');
    if (saved) { window.scrollTo(0, parseInt(saved)); sessionStorage.removeItem('courseListScroll'); }
  }, []);

  // 강의 카드 클릭 시 스크롤 위치 저장
  const handleCourseClick = (courseId) => {
    sessionStorage.setItem('courseListScroll', String(window.scrollY));
    navigate(`/courses/${courseId}`);
  };
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [likeMap, setLikeMap] = useState({});       // { courseId: { liked, likeCount } }
  const [enrollMap, setEnrollMap] = useState({});   // { courseId: { progressRate, completed, pendingApproval } }
  const isComposing = useRef(false);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, keyword, recruitingOnly, dateFrom, dateTo, sort]);

  // 로그인 시 내 수강 목록 1회 로드
  useEffect(() => {
    if (isLoggedIn()) fetchMyEnrollments();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 12, keyword, sort });
    if (recruitingOnly) params.set('recruitingOnly', 'true');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo',   dateTo);
    const res = await authFetch(`/api/courses?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCourses(data.content);
      setTotalPages(data.totalPages);
      const map = {};
      data.content.forEach(c => {
        map[c.id] = { liked: c.likedByMe ?? false, likeCount: c.likeCount ?? 0 };
      });
      setLikeMap(map);
    }
    setLoading(false);
  };

  const fetchMyEnrollments = async () => {
    const res = await authFetch('/api/courses/my/enrollments');
    if (res.ok) {
      const data = await res.json();
      const map = {};
      data.forEach(e => {
        map[e.courseId] = {
          progressRate: e.progressRate ?? 0,
          completed: e.completed || e.isCompleted,
          pendingApproval: e.pendingApproval,
        };
      });
      setEnrollMap(map);
    }
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(0);
  };

  const handleLike = async (e, courseId) => {
    e.stopPropagation(); // 카드 클릭(상세 이동) 방지
    if (!isLoggedIn()) { navigate('/login'); return; }
    const res = await authFetch(`/api/courses/${courseId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLikeMap(prev => ({ ...prev, [courseId]: { liked: data.liked, likeCount: data.likeCount } }));
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 강의 목록</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">원하는 강의를 찾아 학습을 시작하세요</p>
        </div>
        {isAdmin() && (
          <button onClick={() => navigate('/courses/admin')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
            🛠️ 강의 관리
          </button>
        )}
      </div>

      {/* 검색 + 필터 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-6 space-y-3">
        {/* 키워드 검색 */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onCompositionStart={() => { isComposing.current = true; }}
            onCompositionEnd={() => { isComposing.current = false; }}
            onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
            placeholder="강의명, 설명 검색..."
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400"
          />
          <button onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            검색
          </button>
        </div>

        {/* 기간 검색 */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">기간</span>
          <input type="date" value={dateFrom} onChange={e => handleFilterChange(setDateFrom, e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400" />
          <span className="text-xs text-gray-400">~</span>
          <input type="date" value={dateTo} onChange={e => handleFilterChange(setDateTo, e.target.value)}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { handleFilterChange(setDateFrom, ''); handleFilterChange(setDateTo, ''); }}
              className="text-xs text-gray-400 hover:text-red-400 transition-colors">✕ 초기화</button>
          )}
          <p className="text-[11px] text-gray-400">접수기간·교육기간 중 하나라도 해당하면 포함</p>
        </div>

        {/* 필터 버튼 + 정렬 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange(setRecruitingOnly, !recruitingOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                recruitingOnly
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400'
              }`}>
              🟢 신청중만 보기
            </button>
          </div>
          <div className="flex gap-1">
            {[
              { key: 'latest',    label: '최신순' },
              { key: 'viewCount', label: '조회순' },
              { key: 'likeCount', label: '좋아요순' },
            ].map(s => (
              <button key={s.key}
                onClick={() => handleFilterChange(setSort, s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  sort === s.key
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 강의 목록 */}
      {loading ? (
        <SkeletonCourseGrid count={6} />
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <div>검색 결과가 없습니다</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {courses.map(course => {
            const enroll = enrollMap[course.id];

            // 강의 상태 플래그 계산
            const getCourseStatus = () => {
              const regStart = course.registrationStartDate;
              const regEnd   = course.registrationEndDate;
              const eduStart = course.educationStartDate;
              const eduEnd   = course.educationEndDate;
              if (eduEnd   && today > eduEnd)   return { label: '종료',   cls: 'bg-gray-500/80' };
              if (eduStart && today >= eduStart) return { label: '진행중', cls: 'bg-blue-500/90' };
              if (regStart && regEnd && today >= regStart && today <= regEnd)
                                                return { label: '접수중', cls: 'bg-green-500/90' };
              if (regStart && today < regStart) return { label: '준비중', cls: 'bg-amber-500/90' };
              return null;
            };
            const courseStatus = getCourseStatus();
            const ThumbnailOverlay = ({ compact = false }) => (
              <>
                {/* 좌상단: 강의 상태 플래그 */}
                {courseStatus && (
                  <div className={`absolute top-2 left-2 px-2 py-0.5 ${courseStatus.cls} text-white ${compact ? 'text-[9px]' : 'text-[10px]'} font-bold rounded-sm tracking-wide shadow`}>
                    {courseStatus.label}
                  </div>
                )}
                {/* 좌상단 아래: 수강중 / 수료완료 배지 */}
                {enroll && !enroll.completed && (
                  <div className={`absolute ${courseStatus ? (compact ? 'top-6' : 'top-7') : 'top-2'} left-2 px-2 py-0.5 bg-blue-500/90 text-white ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold rounded-full`}>
                    수강중
                  </div>
                )}
                {enroll?.completed && (
                  <div className={`absolute ${courseStatus ? (compact ? 'top-6' : 'top-7') : 'top-2'} left-2 px-2 py-0.5 bg-emerald-500/90 text-white ${compact ? 'text-[9px]' : 'text-[10px]'} font-semibold rounded-full`}>
                    🎓 수료
                  </div>
                )}
                {/* 우상단: 좋아요 버튼 */}
                <button
                  onClick={e => handleLike(e, course.id)}
                  className={`absolute top-2 right-2 ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-base'} rounded-full flex items-center justify-center shadow-md transition-all ${
                    likeMap[course.id]?.liked
                      ? 'bg-white text-red-500 scale-110'
                      : 'bg-black/30 text-white hover:bg-white hover:text-red-400'
                  }`}>
                  {likeMap[course.id]?.liked ? '❤️' : '🤍'}
                </button>
                {/* 하단: 수강 진도바 + % */}
                {enroll && !enroll.completed && (
                  <div className="absolute bottom-0 left-0 right-0">
                    <div className="relative h-1.5 bg-black/30">
                      <div className="h-full bg-blue-400 transition-all" style={{ width: `${enroll.progressRate}%` }} />
                      {enroll.progressRate > 0 && (
                        <span className="absolute right-1 -top-4 text-[9px] font-bold text-white drop-shadow">
                          {enroll.progressRate}%
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            );

            // 하단 메타 정보 (날짜, 강사, 좋아요 등)
            const MetaInfo = ({ compact = false }) => (
              <div className={`space-y-0.5 ${compact ? '' : 'pt-2 border-t border-gray-50 dark:border-gray-700'}`}>
                {course.registrationStartDate && (
                  <p className="text-[10px] sm:text-xs text-gray-400">📋 {course.registrationStartDate} ~ {course.registrationEndDate || '-'}</p>
                )}
                {course.educationStartDate && (
                  <p className="text-[10px] sm:text-xs text-gray-400">🎓 {course.educationStartDate} ~ {course.educationEndDate || '-'}</p>
                )}
                {course.instructor && (
                  <p className="text-[10px] sm:text-xs text-gray-400">👨‍🏫 {course.instructor}</p>
                )}
                {course.location && (
                  <p className="text-[10px] sm:text-xs text-gray-400">📍 {course.location}</p>
                )}
                {course.maxStudents && (
                  <p className={`text-[10px] sm:text-xs font-medium ${
                    course.enrolledCount >= course.maxStudents
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}>
                    👥 {course.enrolledCount ?? 0} / {course.maxStudents}명
                    {course.enrolledCount >= course.maxStudents && ' (마감)'}
                  </p>
                )}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-gray-300 dark:text-gray-600">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {course.reviewCount > 0 && (
                      <span className="text-[10px] text-yellow-500">⭐ {course.avgRating?.toFixed(1)}</span>
                    )}
                    {(likeMap[course.id]?.likeCount > 0) && (
                      <span className="text-[10px] text-red-400">❤️ {likeMap[course.id].likeCount}</span>
                    )}
                    {course.viewCount > 0 && (
                      <span className="text-[10px] text-gray-400">👁 {course.viewCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <div key={course.id} onClick={() => handleCourseClick(course.id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">

                {/* ── 모바일: 가로형 (썸네일 좌 + 정보 우) ── */}
                <div className="flex sm:hidden">
                  <div className="relative w-[38%] shrink-0 aspect-[4/3] overflow-hidden">
                    <CourseThumbnail
                      thumbnailUrl={course.thumbnailUrl}
                      title={course.title}
                      category={course.category}
                      imgClassName="w-full h-full object-cover"
                    />
                    <ThumbnailOverlay compact={true} />
                  </div>
                  <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start gap-1 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">{course.title}</h3>
                      </div>
                      {course.description && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">{course.description}</p>
                      )}
                    </div>
                    <MetaInfo compact={true} />
                  </div>
                </div>

                {/* ── 데스크탑: 세로형 (기존 레이아웃) ── */}
                <div className="hidden sm:flex flex-col h-full">
                  <div className="relative aspect-video overflow-hidden shrink-0">
                    <CourseThumbnail
                      thumbnailUrl={course.thumbnailUrl}
                      title={course.title}
                      category={course.category}
                      imgClassName="w-full h-full object-contain bg-gray-900"
                    />
                    <ThumbnailOverlay compact={false} />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start gap-1.5 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">{course.title}</h3>
                    </div>
                    {course.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{course.description}</p>
                    )}
                    <div className="mt-auto">
                      <MetaInfo compact={false} />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-8">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                page === i
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
