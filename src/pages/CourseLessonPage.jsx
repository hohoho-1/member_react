import { useState, useEffect, useRef } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
// YouTube URL → embed URL 변환
const toEmbedUrl = (url) => {
  if (!url) return '';
  // youtu.be/VIDEO_ID 단축 URL
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  // youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  // 이미 embed URL이거나 다른 URL 그대로 반환
  return url;
};

export default function CourseLessonPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    fetchData();
    startTimeRef.current = Date.now();
    // eslint-disable-next-line
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchBookmarkStatus();
    // eslint-disable-next-line
  }, [lessonId]);

  const fetchData = async () => {
    const [courseRes, enrollRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`),
      authFetch('/api/courses/my/enrollments')
    ]);
    if (courseRes.ok) {
      const courseData = await courseRes.json();
      setCourse(courseData);
      // 현재 레슨 찾기
      for (const section of courseData.sections || []) {
        const found = section.lessons?.find(l => String(l.id) === String(lessonId));
        if (found) { setLesson(found); document.title = `${found.title} | GetSmart`; break; }
      }
    }
    if (enrollRes.ok) {
      const enrollments = await enrollRes.json();
      const found = enrollments.find(e => String(e.courseId) === String(courseId));
      setEnrollment(found || null);
      if (found?.completedLessonIds) {
        setCompletedIds(new Set(found.completedLessonIds));
      }
    }
  };

  const fetchBookmarkStatus = async () => {
    const res = await authFetch(`/api/courses/lessons/${lessonId}/bookmark`);
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
    }
  };

  const handleToggleBookmark = async () => {
    if (bookmarking) return;
    setBookmarking(true);
    const res = await authFetch(`/api/courses/lessons/${lessonId}/bookmark`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
    }
    setBookmarking(false);
  };

  const handleComplete = async () => {
    if (completing || completedIds.has(Number(lessonId))) return;
    setCompleting(true);
    const studySeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const res = await authFetch(`/api/courses/lessons/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ studySeconds })
    });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
      setCompletedIds(prev => new Set([...prev, Number(lessonId)]));
      // 수료 대기 전환 시 리뷰 유도 모달
      if (data.pendingApproval) {
        setShowReviewPrompt(true);
        return;
      }
      // 다음 레슨으로 자동 이동
      const next = getNextLesson();
      if (next) {
        setTimeout(() => navigate(`/courses/${courseId}/lessons/${next.id}`), 800);
      }
    }
    setCompleting(false);
  };

  const handleQuizSubmit = () => {
    if (!lesson?.quizQuestions) return;
    const results = lesson.quizQuestions.map(q => ({
      id: q.id,
      question: q.questionText,
      userAnswer: quizAnswers[q.id],
      correct: String(quizAnswers[q.id]) === String(q.answer),
      answer: q.answer,
      explanation: q.explanation,
      choices: q.choices ? JSON.parse(q.choices) : null
    }));
    setQuizResults(results);
    const allCorrect = results.every(r => r.correct);
    if (allCorrect) handleComplete();
  };

  const getNextLesson = () => {
    if (!course) return null;
    let found = false;
    for (const section of course.sections || []) {
      for (const l of section.lessons || []) {
        if (found) return l;
        if (String(l.id) === String(lessonId)) found = true;
      }
    }
    return null;
  };

  const getPrevLesson = () => {
    if (!course) return null;
    let prev = null;
    for (const section of course.sections || []) {
      for (const l of section.lessons || []) {
        if (String(l.id) === String(lessonId)) return prev;
        prev = l;
      }
    }
    return null;
  };

  const isCompleted = completedIds.has(Number(lessonId));
  const nextLesson = getNextLesson();
  const prevLesson = getPrevLesson();

  if (!lesson) return (
    <div className="flex justify-center py-20 text-gray-400">불러오는 중...</div>
  );

  return (
    <>
    {/* 수료 대기 → 리뷰 유도 모달 */}
    {showReviewPrompt && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">모든 강의를 완료했어요!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            관리자 수료 승인 후 수료증이 발급됩니다.<br/>
            수강 후기를 남겨주시면 다른 수강생에게 큰 도움이 됩니다 😊
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setShowReviewPrompt(false); navigate(`/courses/${courseId}#reviews`); }}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              ✍️ 후기 작성하러 가기
            </button>
            <button
              onClick={() => setShowReviewPrompt(false)}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              나중에 하기
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 flex gap-6">      {/* 사이드바: 커리큘럼 (lg 이상에서만 표시) */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-20">
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="text-xs text-blue-500 hover:underline">
              ← 강의 홈
            </button>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
              {course?.title}
            </div>
            {enrollment && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>진도율</span><span>{enrollment.progressRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${enrollment.progressRate}%` }} />
                </div>
              </div>
            )}
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
            {course?.sections?.map((section, si) => (
              <div key={section.id}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750">
                  {si + 1}. {section.title}
                </div>
                {section.lessons?.map((l, li) => (
                  <button
                    key={l.id}
                    onClick={() => navigate(`/courses/${courseId}/lessons/${l.id}`)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors border-l-2
                      ${String(l.id) === String(lessonId)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                    <span>{completedIds.has(l.id) ? '✅' : l.lessonType === 'VIDEO' ? '🎬' : l.lessonType === 'QUIZ' ? '📝' : '📄'}</span>
                    <span className="line-clamp-1">{si + 1}-{li + 1}. {l.title}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 메인: 레슨 콘텐츠 */}
      <main className="flex-1 min-w-0">
        {/* 모바일 전용: 강의홈 링크 + 진도율 */}
        <div className="lg:hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => navigate(`/courses/${courseId}`)}
              className="text-xs text-blue-500 hover:underline">← 강의 홈</button>
            {enrollment && (
              <span className="text-xs font-semibold text-blue-600">{enrollment.progressRate}%</span>
            )}
          </div>
          {enrollment && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${enrollment.progressRate}%` }} />
            </div>
          )}
        </div>

        {/* 레슨 헤더 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>{lesson.lessonType === 'VIDEO' ? '🎬 영상' : lesson.lessonType === 'QUIZ' ? '📝 퀴즈' : '📄 텍스트'}</span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
            <button
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              title={bookmarked ? '북마크 해제' : '북마크 추가'}
              className={`shrink-0 mt-0.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                bookmarked
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600 text-amber-500'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 hover:border-amber-300 hover:text-amber-500'
              }`}>
              {bookmarked ? '🔖 북마크됨' : '🔖 북마크'}
            </button>
          </div>
        </div>

        {/* 영상 타입 */}
        {lesson.lessonType === 'VIDEO' && (
          <div className="mb-6">
            {lesson.videoUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={toEmbedUrl(lesson.videoUrl)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={lesson.title}
                />
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                영상이 등록되지 않았습니다
              </div>
            )}
            {lesson.content && (
              <div className="mt-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">📋 강의 설명</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                  {lesson.content}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 텍스트 타입 */}
        {lesson.lessonType === 'TEXT' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {lesson.content || '내용이 없습니다.'}
            </div>
          </div>
        )}

        {/* 퀴즈 타입 */}
        {lesson.lessonType === 'QUIZ' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h2 className="font-bold text-gray-900 dark:text-white mb-5">📝 퀴즈</h2>
            {!lesson.quizQuestions || lesson.quizQuestions.length === 0 ? (
              <div className="text-gray-400 text-center py-8">등록된 문항이 없습니다.</div>
            ) : (
              <div className="space-y-6">
                {lesson.quizQuestions?.map((q, qi) => {
                  const choices = q.choices ? JSON.parse(q.choices) : null;
                  const result = quizResults?.find(r => r.id === q.id);
                  return (
                    <div key={q.id} className={`p-4 rounded-lg border ${
                      result ? (result.correct ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20')
                             : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <p className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-3">
                        Q{qi + 1}. {q.questionText}
                      </p>
                      {choices ? (
                        <div className="space-y-2">
                          {choices.map((c, ci) => (
                            <label key={ci} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                value={ci}
                                disabled={!!quizResults}
                                checked={quizAnswers[q.id] === ci}
                                onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: ci }))}
                                className="accent-blue-500"
                              />
                              <span className={`text-sm ${
                                result && String(ci) === String(q.answer) ? 'text-green-600 font-semibold' : 'text-gray-600 dark:text-gray-400'
                              }`}>{c}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          disabled={!!quizResults}
                          value={quizAnswers[q.id] || ''}
                          onChange={e => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="답을 입력하세요"
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-blue-400"
                        />
                      )}
                      {result && (
                        <div className={`mt-2 text-xs font-medium ${result.correct ? 'text-green-600' : 'text-red-600'}`}>
                          {result.correct ? '✅ 정답!' : `❌ 오답 (정답: ${choices ? choices[q.answer] : q.answer})`}
                          {q.explanation && <span className="text-gray-500 ml-2">| {q.explanation}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!quizResults && !isCompleted && (
                  <button
                    onClick={handleQuizSubmit}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    제출하기
                  </button>
                )}
                {isCompleted && !quizResults && (
                  <div className="text-center p-3 rounded-lg text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    ✅ 이미 완료한 퀴즈입니다
                  </div>
                )}
                {quizResults && (
                  <div className={`text-center p-3 rounded-lg text-sm font-medium ${
                    quizResults.every(r => r.correct)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  }`}>
                    {quizResults.filter(r => r.correct).length} / {quizResults.length} 정답
                    {!quizResults.every(r => r.correct) && (
                      <button
                        onClick={() => { setQuizResults(null); setQuizAnswers({}); }}
                        className="ml-3 underline text-xs">다시 풀기</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 완료 버튼 + 네비게이션 */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => prevLesson && navigate(`/courses/${courseId}/lessons/${prevLesson.id}`)}
            disabled={!prevLesson}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
            ← 이전
          </button>

          {lesson.lessonType !== 'QUIZ' && (
            <button
              onClick={handleComplete}
              disabled={completing || isCompleted}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                isCompleted
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 cursor-default'
                  : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-60'
              }`}>
              {isCompleted ? '✅ 완료됨' : completing ? '처리 중...' : '완료 처리'}
            </button>
          )}

          <button
            onClick={() => nextLesson && navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
            disabled={!nextLesson}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors">
            다음 →
          </button>
        </div>
      </main>
    </div>
    </>
  );
}
