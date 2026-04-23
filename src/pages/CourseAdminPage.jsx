import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import ConfirmModal from '../components/ConfirmModal';
import { useToastContext } from '../context/ToastContext';
import { useConfirm } from '../hooks/useConfirm';

export default function CourseAdminPage() {
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [searchParams] = useSearchParams();
  const highlightCourseId = searchParams.get('courseId'); // 알림에서 진입한 강의 ID
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', thumbnailUrl: '', isPublished: false,
    registrationStartDate: '', registrationEndDate: '',
    educationStartDate: '', educationEndDate: '',
    location: '', instructor: ''
  });
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);    // 선택된 파일 (아직 미업로드)
  const [thumbnailPreview, setThumbnailPreview] = useState(''); // 브라우저 미리보기 URL
  const thumbnailInputRef = useRef(null);

  // 수강자 현황 모달
  const [enrollModal, setEnrollModal] = useState(null); // { courseId, courseTitle }
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null); // 수강자 상세 모달
  const { confirmProps, confirm } = useConfirm();

  const openEnrollModal = async (course) => {
    setEnrollModal({ courseId: course.id, courseTitle: course.title });
    setSelectedEnrollment(null);
    setEnrollLoading(true);
    const res = await authFetch(`/api/courses/${course.id}/enrollments?size=100`);
    if (res.ok) {
      const data = await res.json();
      setEnrollments(data.content ?? []);
    }
    setEnrollLoading(false);
  };

  const handleAdminCancelEnrollment = async (enrollment) => {
    const ok = await confirm({
      title: '수강 삭제',
      message: `'${enrollment.username}' 수강자를 삭제하시겠습니까?\n진도 및 학습 기록이 모두 삭제됩니다.`,
      confirmText: '삭제',
      confirmColor: 'red',
    });
    if (!ok) return;
    const res = await authFetch(`/api/courses/admin/enrollments/${enrollment.id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedEnrollment(null);
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id));
      // 수료 대기 상태였다면 pendingCount도 감소
      if (enrollment.pendingApproval && enrollModal) {
        setCourses(prev => prev.map(c =>
          c.id === enrollModal.courseId
            ? { ...c, pendingCount: Math.max(0, (c.pendingCount || 1) - 1) }
            : c
        ));
      }
    } else {
      error('수강 취소에 실패했습니다.');
    }
  };

  const handleAdminApproveCompletion = async (enrollment) => {
    const ok = await confirm({
      title: '수료 승인',
      message: `'${enrollment.username}' 수강자의 수료를 승인하시겠습니까?`,
      confirmText: '승인',
      confirmColor: 'blue',
    });
    if (!ok) return;
    const res = await authFetch(`/api/courses/admin/enrollments/${enrollment.id}/approve`, { method: 'POST' });
    if (res.ok) {
      const updated = await res.json();
      setEnrollments(prev => prev.map(e => e.id === updated.id ? updated : e));
      // 상세 모달에서 승인한 경우만 상세 모달 업데이트
      setSelectedEnrollment(prev => prev?.id === updated.id ? updated : prev);
      // 강의 카드 pendingCount 업데이트
      if (enrollModal) {
        setCourses(prev => prev.map(c =>
          c.id === enrollModal.courseId
            ? { ...c, pendingCount: Math.max(0, (c.pendingCount || 1) - 1) }
            : c
        ));
      }
      // URL에서 courseId 파라미터 제거 (하이라이트 해제)
      navigate('/courses/admin', { replace: true });
    } else {
      error('수료 승인에 실패했습니다.');
    }
  };

  const isEnrollCompleted = (e) => e.completed || e.isCompleted;
  const isEnrollPending = (e) => e.pendingApproval;

  const formatStudyTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  useEffect(() => { fetchCourses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCourses = async () => {
    setLoading(true);
    const res = await authFetch('/api/courses/admin/all?size=100');
    if (res.ok) {
      const data = await res.json();
      setCourses(data.content);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setEditCourse(null);
    setForm({
      title: '', description: '', thumbnailUrl: '', isPublished: false,
      registrationStartDate: '', registrationEndDate: '',
      educationStartDate: '', educationEndDate: '',
      location: '', instructor: ''
    });
    setThumbnailFile(null);
    setThumbnailPreview('');
    setShowForm(true);
  };

  const openEdit = (course) => {
    setEditCourse(course);
    setForm({
      title: course.title,
      description: course.description || '',
      thumbnailUrl: course.thumbnailUrl || '',
      isPublished: course.isPublished,
      registrationStartDate: course.registrationStartDate || '',
      registrationEndDate:   course.registrationEndDate || '',
      educationStartDate:    course.educationStartDate || '',
      educationEndDate:      course.educationEndDate || '',
      location:   course.location || '',
      instructor: course.instructor || ''
    });
    setThumbnailFile(null);
    setThumbnailPreview(course.thumbnailUrl || '');
    setShowForm(true);
  };

  // 파일 선택 시 → 브라우저 미리보기만 (서버 업로드 X)
  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
    setForm(f => ({ ...f, thumbnailUrl: '' })); // URL 입력 초기화
    e.target.value = '';
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setForm(f => ({ ...f, thumbnailUrl: '' }));
  };

  // 저장 시 → 강의 저장 후 파일 업로드 (있을 경우)
  const handleSave = async () => {
    if (!form.title.trim()) { error('강의명을 입력하세요.'); return; }
    setSaving(true);
    try {
      const method = editCourse ? 'PUT' : 'POST';
      const url = editCourse ? `/api/courses/${editCourse.id}` : '/api/courses';
      const res = await authFetch(url, { method, body: JSON.stringify(form) });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        error(err.message || '저장에 실패했습니다.');
        return;
      }

      const saved = await res.json();
      const savedId = saved?.id ?? editCourse?.id;

      if (!savedId) {
        error('강의 ID를 가져오지 못했습니다. 다시 시도해주세요.');
        return;
      }

      // 파일이 선택된 경우 → 저장된 강의 ID로 썸네일 업로드 후 URL 반영
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append('image', thumbnailFile);
        const thumbRes = await authFetch(`/api/courses/${savedId}/thumbnail`, {
          method: 'POST', body: formData
        });
        if (thumbRes.ok) {
          const { thumbnailUrl } = await thumbRes.json();
          // 썸네일 URL을 강의 정보에 반영 (2차 PUT)
          await authFetch(`/api/courses/${savedId}`, {
            method: 'PUT',
            body: JSON.stringify({ ...form, thumbnailUrl })
          });
        } else {
          const err = await thumbRes.json().catch(() => ({}));
          error('강의는 저장됐지만 썸네일 업로드에 실패했습니다: ' + (err.message || '알 수 없는 오류'));
        }
      }

      setShowForm(false);
      setThumbnailFile(null);
      setThumbnailPreview('');
      fetchCourses();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (courseId) => {
    const ok = await confirm({
      title: '강의 삭제',
      message: '강의를 삭제하시겠습니까?\n섹션과 레슨도 모두 삭제됩니다.',
      confirmText: '삭제',
      confirmColor: 'red',
    });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}`, { method: 'DELETE' });
    if (res.ok) fetchCourses();
    else error('삭제에 실패했습니다.');
  };

  const togglePublish = async (course) => {
    const res = await authFetch(`/api/courses/${course.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: course.title,
        description: course.description || '',
        thumbnailUrl: course.thumbnailUrl || '',
        isPublished: !course.isPublished,
        registrationStartDate: course.registrationStartDate || null,
        registrationEndDate:   course.registrationEndDate   || null,
        educationStartDate:    course.educationStartDate    || null,
        educationEndDate:      course.educationEndDate      || null,
        location:   course.location   || '',
        instructor: course.instructor || '',
      })
    });
    if (res.ok) fetchCourses();
    else error('공개 상태 변경에 실패했습니다.');
  };

  // 현재 미리보기 소스 결정 (파일 선택 > URL 입력 순)
  const previewSrc = thumbnailPreview || form.thumbnailUrl;

  return (
    <>
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🛠️ 강의 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">강의를 등록하고 커리큘럼을 구성하세요</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/courses')}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            목록 보기
          </button>
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            + 강의 추가
          </button>
        </div>
      </div>

      {/* 강의 목록 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <div>등록된 강의가 없습니다</div>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id}
              className={`rounded-xl border p-4 transition-all ${
                String(course.id) === String(highlightCourseId)
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-500'
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
              }`}>
              {/* 상단: 썸네일 + 제목/날짜 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-10 sm:w-16 sm:h-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
                  {course.thumbnailUrl
                    ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-contain bg-gray-900" />
                    : <span className="text-xl">📚</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{course.title}</span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                      course.isPublished
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {course.isPublished ? '공개' : '비공개'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{new Date(course.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              {/* 하단: 버튼들 */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button onClick={() => navigate(`/courses/admin/${course.id}/curriculum`)}
                  className="px-3 py-1.5 text-xs border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  커리큘럼
                </button>
                <button onClick={() => openEnrollModal(course)}
                  className="px-3 py-1.5 text-xs border border-teal-300 dark:border-teal-600 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors flex items-center gap-1">
                  수강자
                  {course.pendingCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                      {course.pendingCount}
                    </span>
                  )}
                </button>
                <button onClick={() => togglePublish(course)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    course.isPublished
                      ? 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400'
                      : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400'
                  }`}>
                  {course.isPublished ? '비공개로' : '공개로'}
                </button>
                <button onClick={() => openEdit(course)}
                  className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  편집
                </button>
                <button onClick={() => handleDelete(course.id)}
                  className="px-3 py-1.5 text-xs border border-red-200 dark:border-red-700 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 수강자 현황 모달 */}
      {enrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setEnrollModal(null); setSelectedEnrollment(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">👥 수강자 현황</h2>
                <p className="text-xs text-gray-400 mt-0.5">{enrollModal.courseTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  총 <span className="font-semibold text-gray-800 dark:text-white">{enrollments.length}</span>명
                  {enrollments.filter(e => isEnrollCompleted(e)).length > 0 && (
                    <span className="ml-1.5 text-green-600">
                      (수료 {enrollments.filter(e => isEnrollCompleted(e)).length}명)
                    </span>
                  )}
                </span>
                <button onClick={() => { setEnrollModal(null); setSelectedEnrollment(null); }}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {enrollLoading ? (
                <div className="text-center py-12 text-gray-400">불러오는 중...</div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">수강자가 없습니다.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {enrollments.map(e => (
                    <div key={e.id} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        {/* 이름 + 신청일 */}
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedEnrollment(e)}
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                            {e.username || '-'}
                          </button>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(e.enrolledAt).toLocaleDateString('ko-KR')}</p>
                        </div>
                        {/* 상태 배지 */}
                        <div className="shrink-0">
                          {isEnrollCompleted(e)
                            ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">🎓 수료완료</span>
                            : isEnrollPending(e)
                              ? <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">⏳ 수료대기</span>
                              : e.progressRate > 0
                                ? <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">📖 수강중</span>
                                : <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 rounded-full">미시작</span>
                          }
                        </div>
                        {/* 관리 버튼 */}
                        <div className="flex gap-1 shrink-0">
                          {isEnrollPending(e) && (
                            <button
                              onClick={() => handleAdminApproveCompletion(e)}
                              className="text-xs px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg transition-colors font-medium">
                              승인
                            </button>
                          )}
                          <button
                            onClick={() => handleAdminCancelEnrollment(e)}
                            className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors">
                            삭제
                          </button>
                        </div>
                      </div>
                      {/* 진도율 바 */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${e.progressRate}%` }} />
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold shrink-0 w-8 text-right">{e.progressRate}%</span>
                        <span className="text-xs text-gray-400 shrink-0">{formatStudyTime(e.totalStudySeconds)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <button onClick={() => { setEnrollModal(null); setSelectedEnrollment(null); }}
                className="w-full py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 수강자 상세 모달 */}
      {selectedEnrollment && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedEnrollment(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">👤 수강자 상세</h3>
              <button onClick={() => setSelectedEnrollment(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            {/* 수강자 정보 */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">이름</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-white">{selectedEnrollment.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">수강 신청일</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(selectedEnrollment.enrolledAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">총 학습시간</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">{formatStudyTime(selectedEnrollment.totalStudySeconds)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">상태</span>
                {isEnrollCompleted(selectedEnrollment)
                  ? <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">🎓 수료완료</span>
                  : isEnrollPending(selectedEnrollment)
                    ? <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">⏳ 수료대기</span>
                    : selectedEnrollment.progressRate > 0
                      ? <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">📖 수강중</span>
                      : <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">미시작</span>
                }
              </div>
              {isEnrollCompleted(selectedEnrollment) && selectedEnrollment.completedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">수료일</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {new Date(selectedEnrollment.completedAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              )}
            </div>

            {/* 진도율 바 */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>진도율</span>
                <span className="font-semibold text-blue-600">{selectedEnrollment.progressRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${selectedEnrollment.progressRate}%` }} />
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex flex-col gap-2">
              {isEnrollPending(selectedEnrollment) && (
                <button onClick={() => handleAdminApproveCompletion(selectedEnrollment)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors">
                  🎓 수료 승인
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => setSelectedEnrollment(null)}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  닫기
                </button>
                <button onClick={() => handleAdminCancelEnrollment(selectedEnrollment)}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
                  수강 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 강의 등록/편집 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5">
              {editCourse ? '강의 편집' : '새 강의 등록'}
            </h2>
            <div className="space-y-4">

              {/* 강의명 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">강의명 *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="강의 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">설명</label>
                <textarea value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="강의 설명을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* 썸네일 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">썸네일</label>

                {/* 미리보기 */}
                {previewSrc && (
                  <div className="mb-2 relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={previewSrc} alt="썸네일 미리보기"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <button onClick={clearThumbnail}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full text-xs flex items-center justify-center transition-colors">
                      ✕
                    </button>
                    {thumbnailFile && (
                      <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-2 py-0.5 rounded">
                        📁 {thumbnailFile.name} (저장 시 업로드됨)
                      </span>
                    )}
                  </div>
                )}

                {/* URL 입력 */}
                <input type="text" value={form.thumbnailUrl}
                  onChange={e => { setForm(f => ({ ...f, thumbnailUrl: e.target.value })); setThumbnailFile(null); setThumbnailPreview(''); }}
                  placeholder="https://... (YouTube 썸네일 등 외부 URL)"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400 mb-1.5"
                />

                {/* 파일 선택 버튼 */}
                <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  🖼️ 파일에서 선택 (jpg, png, webp 등) — 저장 시 업로드
                </button>
                <input ref={thumbnailInputRef} type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden" onChange={handleThumbnailSelect}
                />
              </div>

              {/* 접수 기간 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">📅 접수 기간</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={form.registrationStartDate}
                    onChange={e => setForm(f => ({ ...f, registrationStartDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400 shrink-0">~</span>
                  <input type="date" value={form.registrationEndDate}
                    onChange={e => setForm(f => ({ ...f, registrationEndDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* 교육 기간 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">🎓 교육 기간</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={form.educationStartDate}
                    onChange={e => setForm(f => ({ ...f, educationStartDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400 shrink-0">~</span>
                  <input type="date" value={form.educationEndDate}
                    onChange={e => setForm(f => ({ ...f, educationEndDate: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* 교육 장소 / 강사 */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">📍 교육 장소</label>
                  <input type="text" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="예: 서울 강남구 교육센터"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">👨‍🏫 강사</label>
                  <input type="text" value={form.instructor}
                    onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
                    placeholder="강사명"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* 즉시 공개 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">즉시 공개</span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowForm(false); setThumbnailFile(null); setThumbnailPreview(''); }}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    <ConfirmModal {...confirmProps} />
    </>
  );
}
