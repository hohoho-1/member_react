import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const FILE_ICONS = {
  pdf: '📄', pptx: '📊', ppt: '📊', docx: '📝', doc: '📝',
  xlsx: '📊', xls: '📊', txt: '📃', zip: '🗜️', hwp: '📝', hwpx: '📝',
  mp4: '🎬', avi: '🎬', mov: '🎬'
};
const getFileIcon = (name) => FILE_ICONS[name?.split('.').pop()?.toLowerCase()] || '📎';
const formatBytes = (b) => b < 1024 ? b + 'B' : b < 1024*1024 ? (b/1024).toFixed(1)+'KB' : (b/(1024*1024)).toFixed(1)+'MB';

const LESSON_TYPES = [
  { value: 'TEXT',  label: '📄 텍스트' },
  { value: 'VIDEO', label: '🎬 영상' },
  { value: 'QUIZ',  label: '📝 퀴즈' },
];

export default function CourseCurriculumPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // 섹션 모달
  const [sectionModal, setSectionModal] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '' });

  // 레슨 모달
  const [lessonModal, setLessonModal] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', lessonType: 'TEXT', content: '', videoUrl: '', durationSeconds: ''
  });

  // 퀴즈 문항 모달
  const [quizModal, setQuizModal] = useState(null); // { lessonId, lessonTitle }
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [questionModal, setQuestionModal] = useState(null); // null | { mode, data? }
  const [questionForm, setQuestionForm] = useState({
    questionText: '', choices: ['', '', '', ''], isMultiple: true, answer: '', explanation: ''
  });

  const [saving, setSaving] = useState(false);

  // ── 첨부파일 ──────────────────────────────────────────────────
  const [courseFiles, setCourseFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { fetchCourse(); fetchCourseFiles(); }, [courseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCourse = async () => {
    setLoading(true);
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.ok) setCourse(await res.json());
    setLoading(false);
  };

  const fetchCourseFiles = async () => {
    const res = await fetch(`/api/courses/${courseId}/files`);
    if (res.ok) setCourseFiles(await res.json());
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await authFetch(`/api/courses/${courseId}/files`, { method: 'POST', body: formData });
    if (res.ok) {
      await fetchCourseFiles();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || '파일 업로드에 실패했습니다.');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('이 파일을 삭제하시겠습니까?')) return;
    const res = await authFetch(`/api/courses/${courseId}/files/${fileId}`, { method: 'DELETE' });
    if (res.ok) setCourseFiles(prev => prev.filter(f => f.id !== fileId));
    else alert('파일 삭제에 실패했습니다.');
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

  // ── 섹션 ──────────────────────────────────────────────────

  const openCreateSection = () => {
    setSectionForm({ title: '' });
    setSectionModal({ mode: 'create' });
  };

  const openEditSection = (section) => {
    setSectionForm({ title: section.title });
    setSectionModal({ mode: 'edit', data: section });
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) { alert('섹션 제목을 입력하세요.'); return; }
    setSaving(true);
    if (sectionModal.mode === 'create') {
      await authFetch(`/api/courses/${courseId}/sections`, {
        method: 'POST', body: JSON.stringify({ title: sectionForm.title })
      });
    } else {
      await authFetch(`/api/courses/sections/${sectionModal.data.id}`, {
        method: 'PUT', body: JSON.stringify({ title: sectionForm.title })
      });
    }
    setSectionModal(null);
    setSaving(false);
    fetchCourse();
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('섹션을 삭제하면 포함된 레슨도 모두 삭제됩니다.')) return;
    await authFetch(`/api/courses/sections/${sectionId}`, { method: 'DELETE' });
    fetchCourse();
  };

  // ── 레슨 ──────────────────────────────────────────────────

  const openCreateLesson = (sectionId) => {
    setLessonForm({ title: '', lessonType: 'TEXT', content: '', videoUrl: '', durationSeconds: '' });
    setLessonModal({ mode: 'create', sectionId });
  };

  const openEditLesson = (lesson) => {
    setLessonForm({
      title: lesson.title,
      lessonType: lesson.lessonType,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      durationSeconds: lesson.durationSeconds || ''
    });
    setLessonModal({ mode: 'edit', data: lesson });
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) { alert('레슨 제목을 입력하세요.'); return; }
    setSaving(true);
    const body = {
      title: lessonForm.title,
      lessonType: lessonForm.lessonType,
      content: lessonForm.content || null,
      videoUrl: lessonForm.videoUrl || null,
      durationSeconds: lessonForm.durationSeconds ? Number(lessonForm.durationSeconds) : null,
    };
    if (lessonModal.mode === 'create') {
      await authFetch(`/api/courses/sections/${lessonModal.sectionId}/lessons`, {
        method: 'POST', body: JSON.stringify(body)
      });
    } else {
      await authFetch(`/api/courses/lessons/${lessonModal.data.id}`, {
        method: 'PUT', body: JSON.stringify(body)
      });
    }
    setLessonModal(null);
    setSaving(false);
    fetchCourse();
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('이 레슨을 삭제하시겠습니까?')) return;
    await authFetch(`/api/courses/lessons/${lessonId}`, { method: 'DELETE' });
    fetchCourse();
  };

  // ── 퀴즈 문항 ──────────────────────────────────────────────

  const openQuizModal = async (lesson) => {
    setQuizModal({ lessonId: lesson.id, lessonTitle: lesson.title });
    setQuizLoading(true);
    const res = await authFetch(`/api/courses/lessons/${lesson.id}/quiz`);
    if (res.ok) setQuizQuestions(await res.json());
    setQuizLoading(false);
  };

  const openCreateQuestion = () => {
    setQuestionForm({
      questionText: '', choices: ['', '', '', ''], isMultiple: true, answer: '', explanation: ''
    });
    setQuestionModal({ mode: 'create' });
  };

  const openEditQuestion = (q) => {
    const parsed = q.choices ? JSON.parse(q.choices) : null;
    setQuestionForm({
      questionText: q.questionText,
      choices: parsed || ['', '', '', ''],
      isMultiple: !!parsed,
      answer: q.answer,
      explanation: q.explanation || ''
    });
    setQuestionModal({ mode: 'edit', data: q });
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.questionText.trim()) { alert('문항 내용을 입력하세요.'); return; }
    if (!questionForm.answer.toString().trim()) { alert('정답을 입력하세요.'); return; }
    setSaving(true);

    const body = {
      questionText: questionForm.questionText,
      choices: questionForm.isMultiple
        ? JSON.stringify(questionForm.choices.filter(c => c.trim()))
        : null,
      answer: questionForm.answer.toString(),
      explanation: questionForm.explanation || null,
    };

    if (questionModal.mode === 'create') {
      const res = await authFetch(`/api/courses/lessons/${quizModal.lessonId}/quiz`, {
        method: 'POST', body: JSON.stringify(body)
      });
      if (res.ok) {
        const newQ = await res.json();
        setQuizQuestions(prev => [...prev, newQ]);
      }
    } else {
      const res = await authFetch(`/api/courses/quiz/${questionModal.data.id}`, {
        method: 'PUT', body: JSON.stringify(body)
      });
      if (res.ok) {
        const updated = await res.json();
        setQuizQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
      }
    }
    setQuestionModal(null);
    setSaving(false);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('이 문항을 삭제하시겠습니까?')) return;
    const res = await authFetch(`/api/courses/quiz/${questionId}`, { method: 'DELETE' });
    if (res.ok) setQuizQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const updateChoice = (idx, val) => {
    setQuestionForm(f => {
      const choices = [...f.choices];
      choices[idx] = val;
      return { ...f, choices };
    });
  };

  if (loading) return <div className="flex justify-center py-20 text-gray-400">불러오는 중...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/courses/admin')}
            className="text-xs text-gray-400 hover:text-blue-500 mb-1 block transition-colors">
            ← 강의 관리로
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">📋 커리큘럼 편집</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{course?.title}</p>
        </div>
        <button onClick={openCreateSection}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
          + 섹션 추가
        </button>
      </div>

      {/* 커리큘럼 */}
      {!course?.sections?.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>섹션을 추가해서 커리큘럼을 구성하세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {course.sections.map((section, si) => (
            <div key={section.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* 섹션 헤더 */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                  {si + 1}. {section.title}
                  <span className="ml-2 text-xs font-normal text-gray-400">({section.lessons?.length || 0}개 레슨)</span>
                </span>
                <div className="flex gap-1">
                  <button onClick={() => openCreateLesson(section.id)}
                    className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors">
                    + 레슨
                  </button>
                  <button onClick={() => openEditSection(section)}
                    className="px-2.5 py-1 text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    편집
                  </button>
                  <button onClick={() => handleDeleteSection(section.id)}
                    className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-700 text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    삭제
                  </button>
                </div>
              </div>

              {/* 레슨 목록 */}
              {section.lessons?.length === 0 ? (
                <div className="px-4 py-3 text-xs text-gray-400 text-center">레슨이 없습니다. + 레슨 버튼으로 추가하세요.</div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                  {section.lessons.map((lesson, li) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-base shrink-0">
                        {lesson.lessonType === 'VIDEO' ? '🎬' : lesson.lessonType === 'QUIZ' ? '📝' : '📄'}
                      </span>
                      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                        {si + 1}-{li + 1}. {lesson.title}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {lesson.lessonType === 'VIDEO' && lesson.durationSeconds
                          ? `${Math.floor(lesson.durationSeconds / 60)}:${String(lesson.durationSeconds % 60).padStart(2, '0')}`
                          : ''}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {lesson.lessonType === 'QUIZ' && (
                          <button onClick={() => openQuizModal(lesson)}
                            className="px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700 rounded hover:bg-purple-100 transition-colors">
                            문항 관리
                          </button>
                        )}
                        <button onClick={() => openEditLesson(lesson)}
                          className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          편집
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson.id)}
                          className="px-2 py-1 text-xs border border-red-200 dark:border-red-700 text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── 교육 자료 첨부파일 ── */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
            📎 교육 자료
            <span className="ml-2 text-xs font-normal text-gray-400">({courseFiles.length}/10)</span>
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || courseFiles.length >= 10}
            className="px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 disabled:opacity-40 transition-colors">
            {uploading ? '업로드 중...' : '+ 파일 추가'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.txt,.zip,.hwp,.hwpx,.mp4,.avi,.mov"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {courseFiles.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-gray-400">
            첨부된 교육 자료가 없습니다.<br />
            <span className="text-gray-300">PDF, PPT, Word, Excel, ZIP, HWP, 동영상 등 최대 10개 / 파일당 10MB</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {courseFiles.map(file => (
              <div key={file.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-lg shrink-0">{getFileIcon(file.originalName)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.fileSize)}</p>
                </div>
                <button
                  onClick={() => handleDownload(file.id, file.originalName)}
                  className="px-2.5 py-1 text-xs border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0">
                  다운로드
                </button>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-700 text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 섹션 모달 ── */}      {sectionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSectionModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {sectionModal.mode === 'create' ? '섹션 추가' : '섹션 편집'}
            </h2>
            <input type="text" value={sectionForm.title}
              onChange={e => setSectionForm({ title: e.target.value })}
              placeholder="섹션 제목" autoFocus
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setSectionModal(null)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSaveSection} disabled={saving}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 레슨 모달 ── */}
      {lessonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setLessonModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {lessonModal.mode === 'create' ? '레슨 추가' : '레슨 편집'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">레슨 제목 *</label>
                <input type="text" value={lessonForm.title}
                  onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="레슨 제목"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">타입</label>
                <div className="flex gap-2">
                  {LESSON_TYPES.map(t => (
                    <button key={t.value} onClick={() => setLessonForm(f => ({ ...f, lessonType: t.value }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        lessonForm.lessonType === t.value
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {(lessonForm.lessonType === 'TEXT' || lessonForm.lessonType === 'VIDEO') && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {lessonForm.lessonType === 'TEXT' ? '본문 내용' : '강의 설명'}
                  </label>
                  <textarea value={lessonForm.content}
                    onChange={e => setLessonForm(f => ({ ...f, content: e.target.value }))}
                    rows={4} placeholder={lessonForm.lessonType === 'TEXT' ? '학습 내용을 입력하세요' : '영상에 대한 설명을 입력하세요'}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400 resize-none"
                  />
                </div>
              )}
              {lessonForm.lessonType === 'VIDEO' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">영상 URL</label>
                    <input type="text" value={lessonForm.videoUrl}
                      onChange={e => setLessonForm(f => ({ ...f, videoUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">영상 길이 (초)</label>
                    <input type="number" value={lessonForm.durationSeconds}
                      onChange={e => setLessonForm(f => ({ ...f, durationSeconds: e.target.value }))}
                      placeholder="예: 600 (10분)"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </>
              )}
              {lessonForm.lessonType === 'QUIZ' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-xs text-purple-600 dark:text-purple-400">
                  💡 레슨 저장 후 <b>문항 관리</b> 버튼에서 퀴즈 문항을 추가할 수 있습니다.
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setLessonModal(null)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSaveLesson} disabled={saving}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 퀴즈 문항 관리 모달 ── */}
      {quizModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setQuizModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">📝 퀴즈 문항 관리</h2>
                <p className="text-xs text-gray-400 mt-0.5">{quizModal.lessonTitle}</p>
              </div>
              <button onClick={openCreateQuestion}
                className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors">
                + 문항 추가
              </button>
            </div>

            {/* 문항 목록 */}
            <div className="overflow-y-auto flex-1 p-4">
              {quizLoading ? (
                <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
              ) : quizQuestions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-3xl mb-2">📭</div>
                  <p className="text-sm">등록된 문항이 없습니다.</p>
                  <p className="text-xs text-gray-300 mt-1">+ 문항 추가 버튼으로 문항을 만드세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizQuestions.map((q, qi) => {
                    const choices = q.choices ? JSON.parse(q.choices) : null;
                    return (
                      <div key={q.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                            <span className="text-purple-500 mr-1">Q{qi + 1}.</span>{q.questionText}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => openEditQuestion(q)}
                              className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-600 text-gray-500 rounded hover:bg-gray-50 transition-colors">편집</button>
                            <button onClick={() => handleDeleteQuestion(q.id)}
                              className="px-2 py-1 text-xs border border-red-200 dark:border-red-700 text-red-400 rounded hover:bg-red-50 transition-colors">삭제</button>
                          </div>
                        </div>
                        {choices ? (
                          <div className="space-y-1 mb-2">
                            {choices.map((c, ci) => (
                              <div key={ci} className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                                String(ci) === String(q.answer)
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                <span>{String(ci) === String(q.answer) ? '✅' : '○'}</span>
                                <span>{c}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 mb-1">주관식 — 정답: <span className="text-green-600 font-medium">{q.answer}</span></p>
                        )}
                        {q.explanation && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">💡 {q.explanation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <button onClick={() => setQuizModal(null)}
                className="w-full py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 문항 등록/편집 모달 ── */}
      {questionModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setQuestionModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              {questionModal.mode === 'create' ? '문항 추가' : '문항 편집'}
            </h2>
            <div className="space-y-4">
              {/* 문항 내용 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">문항 내용 *</label>
                <textarea value={questionForm.questionText}
                  onChange={e => setQuestionForm(f => ({ ...f, questionText: e.target.value }))}
                  rows={2} placeholder="문제를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400 resize-none"
                />
              </div>

              {/* 객관식 / 주관식 토글 */}
              <div className="flex gap-2">
                <button onClick={() => setQuestionForm(f => ({ ...f, isMultiple: true, answer: '' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    questionForm.isMultiple ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                  객관식
                </button>
                <button onClick={() => setQuestionForm(f => ({ ...f, isMultiple: false, answer: '' }))}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    !questionForm.isMultiple ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                  주관식
                </button>
              </div>

              {/* 객관식: 보기 입력 */}
              {questionForm.isMultiple && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">보기 (정답 번호 선택)</label>
                  {questionForm.choices.map((c, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <button onClick={() => setQuestionForm(f => ({ ...f, answer: String(ci) }))}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs shrink-0 transition-colors ${
                          String(questionForm.answer) === String(ci)
                            ? 'border-green-500 bg-green-500 text-white'
                            : 'border-gray-300 dark:border-gray-500 text-gray-400'
                        }`}>
                        {ci + 1}
                      </button>
                      <input type="text" value={c}
                        onChange={e => updateChoice(ci, e.target.value)}
                        placeholder={`보기 ${ci + 1}`}
                        className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">번호 버튼을 클릭해서 정답을 선택하세요</p>
                </div>
              )}

              {/* 주관식: 정답 입력 */}
              {!questionForm.isMultiple && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">정답 *</label>
                  <input type="text" value={questionForm.answer}
                    onChange={e => setQuestionForm(f => ({ ...f, answer: e.target.value }))}
                    placeholder="정답을 입력하세요"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}

              {/* 해설 */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">해설 (선택)</label>
                <input type="text" value={questionForm.explanation}
                  onChange={e => setQuestionForm(f => ({ ...f, explanation: e.target.value }))}
                  placeholder="정답 해설을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setQuestionModal(null)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSaveQuestion} disabled={saving}
                className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
