import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, isAdmin } from '../utils/authFetch';

export default function CourseListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const isComposing = useRef(false);

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, [page, keyword]);

  const fetchCourses = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, size: 12, keyword });
    const res = await fetch(`/api/courses?${params}`);
    if (res.ok) {
      const data = await res.json();
      setCourses(data.content);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const formatDuration = (seconds) => {  // eslint-disable-line no-unused-vars
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📚 강의 목록</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">원하는 강의를 찾아 학습을 시작하세요</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => navigate('/courses/admin')}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
            🛠️ 강의 관리
          </button>
        )}
      </div>

      {/* 검색창 */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; }}
          onKeyDown={e => { if (e.key === 'Enter' && !isComposing.current) handleSearch(); }}
          placeholder="강의 검색..."
          className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blue-400"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
          검색
        </button>
      </div>

      {/* 강의 목록 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="text-gray-400 dark:text-gray-500">불러오는 중...</div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <div>등록된 강의가 없습니다</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => {
            const today = new Date().toISOString().slice(0, 10);
            const isRecruiting = course.registrationStartDate && course.registrationEndDate
              && today >= course.registrationStartDate && today <= course.registrationEndDate;
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col">
                {/* 썸네일 - 고정 비율 */}
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden shrink-0">
                  {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-contain bg-gray-900" />
                  ) : (
                    <span className="text-4xl">📚</span>
                  )}
                </div>
                {/* 내용 */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start gap-1.5 mb-1">
                    {isRecruiting && (
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium mt-0.5">접수중</span>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                  {course.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-auto space-y-0.5 pt-2 border-t border-gray-50 dark:border-gray-700">
                    {course.educationStartDate && (
                      <p className="text-xs text-gray-400">🎓 {course.educationStartDate} ~ {course.educationEndDate || '-'}</p>
                    )}
                    {course.instructor && (
                      <p className="text-xs text-gray-400">👨‍🏫 {course.instructor}</p>
                    )}
                    {course.location && (
                      <p className="text-xs text-gray-400">📍 {course.location}</p>
                    )}
                    {!course.educationStartDate && !course.instructor && !course.location && (
                      <p className="text-xs text-gray-300 dark:text-gray-600">{new Date(course.createdAt).toLocaleDateString()}</p>
                    )}
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
            <button
              key={i}
              onClick={() => setPage(i)}
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
