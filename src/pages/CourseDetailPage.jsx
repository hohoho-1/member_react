import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch, isLoggedIn, isAdmin } from '../utils/authFetch';

const FILE_ICONS = { pdf:'📄', pptx:'📊', ppt:'📊', docx:'📝', doc:'📝', xlsx:'📊', xls:'📊', txt:'📃', zip:'🗜️', hwp:'📝', hwpx:'📝', mp4:'🎬', avi:'🎬', mov:'🎬' };
const getFileIcon = (name) => FILE_ICONS[name?.split('.').pop()?.toLowerCase()] || '📎';
const formatBytes = (b) => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [courseFiles, setCourseFiles] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    fetchCourse();
    if (isLoggedIn()) fetchMyEnrollment();
    // eslint-disable-next-line
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) setCourse(await res.json());
    // 교육자료 파일 목록
    const filesRes = await fetch(`/api/courses/${courseId}/files`);
    if (filesRes.ok) setCourseFiles(await filesRes.json());
    setLoading(false);
  };

  const fetchMyEnrollment = async () => {
    const res = await authFetch('/api/courses/my/enrollments');
    if (res.ok) {
      const data = await res.json();
      const found = data.find(e => String(e.courseId) === String(courseId));
      setEnrollment(found || null);
    }
  };

  const handleEnroll = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setEnrolling(true);
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || '수강 신청에 실패했습니다.');
    }
    setEnrolling(false);
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const res = await authFetch(`/api/courses/files/${fileId}/download`);
      if (!res.ok) { alert('다운로드에 실패했습니다.'); return; }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleCancelEnroll = async () => {
    if (!window.confirm('수강을 취소하시겠습니까?\n진도 및 학습 기록이 모두 삭제됩니다.')) return;
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'DELETE' });
    if (res.ok) {
      setEnrollment(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || '수강 취소에 실패했습니다.');
    }
  };

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;

  const lessonTypeIcon = (type) => {
    if (type === 'VIDEO') return '🎬';
    if (type === 'QUIZ') return '📝';
    return '📄';
  };

  const formatSeconds = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-gray-400">불러오는 중...</div>
  );
  if (!course) return (
    <div className="flex justify-center py-20 text-gray-400">강의를 찾을 수 없습니다.</div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/courses')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 mb-4 flex items-center gap-1 transition-colors">
        ← 강의 목록으로
      </button>

      {/* 2컬럼 레이아웃 */}
      <div className="flex gap-6 items-start">

        {/* 좌측: 썸네일 + 커리큘럼 + 교육자료 */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* 썸네일 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-contain bg-gray-900" />
              ) : (
                <span className="text-6xl">📚</span>
              )}
            </div>
          </div>

          {/* 커리큘럼 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">📋 커리큘럼</h2>
            {course.sections?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">등록된 강의 내용이 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {course.sections?.map((section, si) => (
                  <div key={section.id} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                        {si + 1}. {section.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{section.lessons?.length || 0}개</span>
                        <span>{openSections[section.id] ? '▲' : '▼'}</span>
                      </div>
                    </button>
                    {openSections[section.id] && (
                      <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {section.lessons?.map((lesson, li) => (
                          <div
                            key={lesson.id}
                            onClick={() => enrollment && navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                              ${enrollment
                                ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300'
                                : 'text-gray-400 dark:text-gray-500 cursor-default'
                              }`}>
                            <span className="text-base">{lessonTypeIcon(lesson.lessonType)}</span>
                            <span className="flex-1">{si + 1}-{li + 1}. {lesson.title}</span>
                            {lesson.durationSeconds && (
                              <span className="text-xs text-gray-400">{formatSeconds(lesson.durationSeconds)}</span>
                            )}
                            {!enrollment && <span className="text-xs">🔒</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 교육 자료 */}
          {courseFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">📎 교육 자료</h2>
              <div className="space-y-2">
                {courseFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <span className="text-lg shrink-0">{getFileIcon(file.originalName)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.originalName}</p>
                      <p className="text-xs text-gray-400">{formatBytes(file.fileSize)}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(file.id, file.originalName)}
                      className="shrink-0 px-3 py-1.5 text-xs border border-blue-200 dark:border-blue-700 text-blue-500 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 우측: 강의 정보 + 수강신청 (sticky) */}
        <div className="w-80 shrink-0">
          <div className="sticky top-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            {/* 제목 */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
              )}
            </div>

            {/* 레슨/섹션 요약 */}
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
              <span>📚 총 {totalLessons}개 레슨</span>
              <span>🗂️ {course.sections?.length || 0}개 섹션</span>
            </div>

            {/* 교육 정보 */}
            {(course.registrationStartDate || course.educationStartDate || course.location || course.instructor) && (
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
                {course.registrationStartDate && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-gray-400">📅 접수기간</span>
                    <span>{course.registrationStartDate} ~ {course.registrationEndDate || '-'}</span>
                  </div>
                )}
                {course.educationStartDate && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-gray-400">🎓 교육기간</span>
                    <span>{course.educationStartDate} ~ {course.educationEndDate || '-'}</span>
                  </div>
                )}
                {course.location && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-gray-400">📍 교육장소</span>
                    <span>{course.location}</span>
                  </div>
                )}
                {course.instructor && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-gray-400">👨‍🏫 강사</span>
                    <span>{course.instructor}</span>
                  </div>
                )}
              </div>
            )}

            {/* 수강 신청 / 진도율 */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
              {enrollment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">진도율</span>
                    <span className="font-semibold text-blue-600">{enrollment.progressRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progressRate}%` }}
                    />
                  </div>
                  {(enrollment.completed || enrollment.isCompleted) && (
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium mt-2">
                      🎓 수료 완료!
                      <button
                        onClick={() => navigate('/mypage?tab=certificates')}
                        className="text-xs text-blue-500 hover:underline">
                        수료증 보기
                      </button>
                    </div>
                  )}
                  {enrollment.pendingApproval && (
                    <div className="flex items-center gap-2 text-amber-600 text-sm font-medium mt-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                      ⏳ 수료 승인 대기 중입니다
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const firstLesson = course.sections?.[0]?.lessons?.[0];
                      if (firstLesson) navigate(`/courses/${courseId}/lessons/${firstLesson.id}`);
                    }}
                    className="w-full mt-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    {enrollment.progressRate > 0 ? '이어서 학습하기' : '학습 시작하기'}
                  </button>
                  <button
                    onClick={handleCancelEnroll}
                    className="w-full py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    수강 취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                  {enrolling ? '신청 중...' : '수강 신청하기'}
                </button>
              )}

              {isAdmin() && (
                <button
                  onClick={() => navigate('/courses/admin')}
                  className="w-full mt-2 py-2 border border-purple-300 dark:border-purple-600 text-purple-600 dark:text-purple-400 rounded-lg text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors">
                  🛠️ 강의 관리로 이동
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
