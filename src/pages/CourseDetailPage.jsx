import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch, isLoggedIn, isAdmin } from '../utils/authFetch';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { useToastContext } from '../context/ToastContext';
import { SkeletonCourseDetail } from '../components/SkeletonLoader';

const FILE_ICONS = { pdf:'📄', pptx:'📊', ppt:'📊', docx:'📝', doc:'📝', xlsx:'📊', xls:'📊', txt:'📃', zip:'🗜️', hwp:'📝', hwpx:'📝', mp4:'🎬', avi:'🎬', mov:'🎬' };
const getFileIcon = (name) => FILE_ICONS[name?.split('.').pop()?.toLowerCase()] || '📎';
const formatBytes = (b) => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';

// ── 별점 컴포넌트 ──────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className={`flex gap-0.5 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={readonly ? '' : 'cursor-pointer'}>
          {(hovered || value) >= star ? '⭐' : '☆'}
        </span>
      ))}
    </div>
  );
}

// ── 리뷰 섹션 ──────────────────────────────────────────
function ReviewSection({ courseId, enrollment }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { confirmProps, confirm } = useConfirm();
  const { error } = useToastContext();

  const canWrite = enrollment?.completed || enrollment?.isCompleted;

  useEffect(() => {
    fetchReviews();
    if (isLoggedIn()) fetchMyReview();
    // eslint-disable-next-line
  }, [courseId]);

  const fetchReviews = async () => {
    const res = await authFetch(`/api/courses/${courseId}/reviews`);
    if (res.ok) setReviews(await res.json());
  };

  const fetchMyReview = async () => {
    const res = await authFetch(`/api/courses/${courseId}/reviews/my`);
    if (res.status === 204) { setMyReview(null); return; }
    if (res.ok) {
      const data = await res.json();
      setMyReview(data);
    }
  };

  const openWriteForm = () => {
    setEditMode(false);
    setRating(5);
    setContent('');
    setShowForm(true);
  };

  const openEditForm = () => {
    setEditMode(true);
    setRating(myReview.rating);
    setContent(myReview.content || '');
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!content.trim()) { error('후기 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      let res;
      if (editMode) {
        res = await authFetch(`/api/courses/${courseId}/reviews/${myReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, content }),
        });
      } else {
        res = await authFetch(`/api/courses/${courseId}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, content }),
        });
      }
      if (res.ok) {
        setShowForm(false);
        await fetchReviews();
        await fetchMyReview();
      } else {
        const err = await res.json().catch(() => ({}));
        error(err.message || '오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const ok = await confirm({ title: '후기 삭제', message: '후기를 삭제하시겠습니까?', confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/reviews/${reviewId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchReviews();
      await fetchMyReview();
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mt-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900 dark:text-white">⭐ 수강 후기</h2>
          {avgRating && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-yellow-500">{avgRating}</span>
              <StarRating value={Math.round(Number(avgRating))} readonly size="sm" />
              <span className="text-xs text-gray-400">({reviews.length})</span>
            </div>
          )}
        </div>
        {canWrite && !myReview && !showForm && (
          <button
            onClick={openWriteForm}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            후기 작성
          </button>
        )}
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {editMode ? '후기 수정' : '후기 작성'}
          </p>
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">별점</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="수강 후 느낀 점을 자유롭게 작성해 주세요."
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
              {submitting ? '저장 중...' : (editMode ? '수정하기' : '등록하기')}
            </button>
          </div>
        </div>
      )}

      {/* 수료 안내 */}
      {isLoggedIn() && !canWrite && !myReview && (
        <div className="text-sm text-gray-400 dark:text-gray-500 mb-4 text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          수료 완료 후 후기를 작성할 수 있습니다.
        </div>
      )}

      {/* 리뷰 목록 */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">아직 후기가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className={`pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 ${review.mine ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded-lg px-3 pt-3' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* 아바타 */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0 overflow-hidden">
                    {review.authorAvatar
                      ? <img src={review.authorAvatar} alt="" className="w-full h-full object-cover" />
                      : review.authorName?.[0]
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{review.authorName}</span>
                      {review.mine && <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">내 후기</span>}
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                  {review.mine && (
                    <>
                      <button onClick={openEditForm} className="text-xs text-blue-500 hover:underline">수정</button>
                      <button onClick={() => handleDelete(review.id)} className="text-xs text-red-400 hover:underline">삭제</button>
                    </>
                  )}
                  {isAdmin() && !review.mine && (
                    <button onClick={() => handleDelete(review.id)} className="text-xs text-red-400 hover:underline">삭제</button>
                  )}
                </div>
              </div>
              {review.content && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-10">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    <ConfirmModal {...confirmProps} />
    </>
  );
}

// ── Q&A 섹션 ───────────────────────────────────────────
function QnaSection({ courseId, enrollment }) {
  const [qnaList, setQnaList] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);   // { id, title, content }
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openId, setOpenId] = useState(null);           // 펼쳐진 질문 id
  const [answerContent, setAnswerContent] = useState('');
  const [answerEditId, setAnswerEditId] = useState(null);
  const { confirmProps, confirm } = useConfirm();
  const { error } = useToastContext();

  const canWrite = !!enrollment; // 수강 신청만 해도 작성 가능

  useEffect(() => {
    fetchQna();
    // eslint-disable-next-line
  }, [courseId, page]);

  const fetchQna = async () => {
    const res = await authFetch(`/api/courses/${courseId}/qna?page=${page}&size=10`);
    if (res.ok) {
      const data = await res.json();
      setQnaList(data.content);
      setTotalPages(data.totalPages);
    }
  };

  const openWriteForm = () => {
    setEditTarget(null);
    setTitle('');
    setContent('');
    setShowForm(true);
  };

  const openEditForm = (q) => {
    setEditTarget(q);
    setTitle(q.title);
    setContent(q.content);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) { error('제목과 내용을 입력해주세요.'); return; }
    setSubmitting(true);
    try {
      let res;
      if (editTarget) {
        res = await authFetch(`/api/courses/${courseId}/qna/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });
      } else {
        res = await authFetch(`/api/courses/${courseId}/qna`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content }),
        });
      }
      if (res.ok) {
        setShowForm(false);
        setPage(0);
        await fetchQna();
      } else {
        const err = await res.json().catch(() => ({}));
        error(err.message || '오류가 발생했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qnaId) => {
    const ok = await confirm({ title: '질문 삭제', message: '질문을 삭제하시겠습니까?', confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/qna/${qnaId}`, { method: 'DELETE' });
    if (res.ok) await fetchQna();
  };

  const handleAnswerSubmit = async (qnaId) => {
    if (!answerContent.trim()) { error('답변 내용을 입력해주세요.'); return; }
    const res = await authFetch(`/api/courses/${courseId}/qna/${qnaId}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: answerContent }),
    });
    if (res.ok) {
      setAnswerEditId(null);
      setAnswerContent('');
      await fetchQna();
    }
  };

  const handleAnswerDelete = async (qnaId) => {
    const ok = await confirm({ title: '답변 삭제', message: '답변을 삭제하시겠습니까?', confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/qna/${qnaId}/answer`, { method: 'DELETE' });
    if (res.ok) await fetchQna();
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">💬 강의 Q&amp;A</h2>
        {canWrite && !showForm && (
          <button
            onClick={openWriteForm}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            질문하기
          </button>
        )}
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {editTarget ? '질문 수정' : '질문 작성'}
          </p>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="질문 제목"
            className="w-full mb-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="질문 내용을 자세히 작성해 주세요."
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors">
              취소
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
              {submitting ? '저장 중...' : (editTarget ? '수정하기' : '등록하기')}
            </button>
          </div>
        </div>
      )}

      {/* 비수강 안내 */}
      {isLoggedIn() && !canWrite && (
        <div className="text-sm text-gray-400 dark:text-gray-500 mb-4 text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          수강 신청 후 질문을 작성할 수 있습니다.
        </div>
      )}

      {/* Q&A 목록 */}
      {qnaList.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">아직 질문이 없습니다.</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {qnaList.map(q => (
            <div key={q.id} className="py-3">
              {/* 질문 헤더 - 클릭 시 펼치기 */}
              <div
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => setOpenId(openId === q.id ? null : q.id)}>
                {/* 답변 여부 배지 */}
                <span className={`shrink-0 mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                  q.answer
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}>
                  {q.answer ? '답변완료' : '미답변'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{q.authorName}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.mine && !q.answer && (
                    <>
                      <button onClick={e => { e.stopPropagation(); openEditForm(q); }}
                        className="text-xs text-blue-500 hover:underline">수정</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                        className="text-xs text-red-400 hover:underline">삭제</button>
                    </>
                  )}
                  {isAdmin() && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                      className="text-xs text-red-400 hover:underline">삭제</button>
                  )}
                  <span className="text-gray-400 text-xs">{openId === q.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* 펼쳐진 내용 */}
              {openId === q.id && (
                <div className="mt-3 ml-14 space-y-3">
                  {/* 질문 본문 */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    {q.content}
                  </div>

                  {/* 기존 답변 */}
                  {q.answer && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-300">💬 관리자 답변</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(q.answer.createdAt).toLocaleDateString('ko-KR')}</span>
                          {isAdmin() && (
                            <>
                              <button onClick={() => { setAnswerEditId(q.id); setAnswerContent(q.answer.content); }}
                                className="text-xs text-blue-500 hover:underline">수정</button>
                              <button onClick={() => handleAnswerDelete(q.id)}
                                className="text-xs text-red-400 hover:underline">삭제</button>
                            </>
                          )}
                        </div>
                      </div>
                      {answerEditId === q.id ? (
                        <div>
                          <textarea
                            value={answerContent}
                            onChange={e => setAnswerContent(e.target.value)}
                            rows={3}
                            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                          />
                          <div className="flex gap-2 mt-1.5 justify-end">
                            <button onClick={() => setAnswerEditId(null)}
                              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-3 py-1">취소</button>
                            <button onClick={() => handleAnswerSubmit(q.id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1">수정</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{q.answer.content}</p>
                      )}
                    </div>
                  )}

                  {/* 관리자 답변 작성 폼 (미답변 상태) */}
                  {isAdmin() && !q.answer && answerEditId !== q.id && (
                    <button
                      onClick={() => { setAnswerEditId(q.id); setAnswerContent(''); }}
                      className="text-xs text-green-600 hover:text-green-700 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5 transition-colors">
                      + 답변 작성
                    </button>
                  )}
                  {isAdmin() && !q.answer && answerEditId === q.id && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">답변 작성</p>
                      <textarea
                        value={answerContent}
                        onChange={e => setAnswerContent(e.target.value)}
                        rows={3}
                        placeholder="답변 내용을 입력하세요."
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <div className="flex gap-2 mt-1.5 justify-end">
                        <button onClick={() => setAnswerEditId(null)}
                          className="text-xs text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-3 py-1">취소</button>
                        <button onClick={() => handleAnswerSubmit(q.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 font-medium">등록</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`w-7 h-7 rounded text-xs transition-colors ${
                page === i
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-500 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
    <ConfirmModal {...confirmProps} />
    </>
  );
}

// ── 메인 페이지 ───────────────────────────────────────
export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [courseFiles, setCourseFiles] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [waiting, setWaiting] = useState(null); // 대기 신청 상태
  const [openSections, setOpenSections] = useState({});
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const { confirmProps, confirm } = useConfirm();
  const { success, error } = useToastContext();

  useEffect(() => {
    fetchCourse();
    if (isLoggedIn()) {
      fetchMyEnrollment();
      fetchMyWaiting();
    }
    // eslint-disable-next-line
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    const res = await authFetch(`/api/courses/${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
      document.title = `${data.title} | GetSmart`;
      setLiked(data.likedByMe ?? false);
      setLikeCount(data.likeCount ?? 0);
    }
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

  const fetchMyWaiting = async () => {
    const res = await authFetch('/api/courses/my/waiting');
    if (res.ok) {
      const data = await res.json();
      const found = data.find(w => String(w.courseId) === String(courseId));
      setWaiting(found || null);
    }
  };

  const handleEnroll = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setEnrolling(true);
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
      setWaiting(null);
      success('수강 신청이 완료되었습니다!');
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.message === 'FULL') {
        // 정원 초과 → 대기 신청 유도
        const ok = await confirm({
          title: '정원 초과',
          message: '현재 정원이 가득 찼습니다.\n대기자 명단에 등록하시겠습니까?',
          confirmText: '대기 신청',
          confirmColor: 'blue',
        });
        if (ok) await handleJoinWaiting();
      } else {
        error(err.message || '수강 신청에 실패했습니다.');
      }
    }
    setEnrolling(false);
  };

  const handleJoinWaiting = async () => {
    const res = await authFetch(`/api/courses/${courseId}/waiting`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setWaiting(data);
      success(`대기 ${data.position}번으로 등록되었습니다.`);
    } else {
      const err = await res.json().catch(() => ({}));
      error(err.message || '대기 신청에 실패했습니다.');
    }
  };

  const handleCancelWaiting = async () => {
    const ok = await confirm({
      title: '대기 취소',
      message: '대기 신청을 취소하시겠습니까?',
      confirmText: '취소',
      confirmColor: 'red',
    });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/waiting`, { method: 'DELETE' });
    if (res.ok) {
      setWaiting(null);
      success('대기 신청이 취소되었습니다.');
    }
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const res = await authFetch(`/api/courses/files/${fileId}/download`);
      if (!res.ok) { error('다운로드에 실패했습니다.'); return; }
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
      error('다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (liking) return;
    setLiking(true);
    const res = await authFetch(`/api/courses/${courseId}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
    setLiking(false);
  };

  const handleCancelEnroll = async () => {
    const ok = await confirm({
      title: '수강 취소',
      message: '수강을 취소하시겠습니까?\n진도 및 학습 기록이 모두 삭제됩니다.',
      confirmText: '수강 취소',
      confirmColor: 'red',
    });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'DELETE' });
    if (res.ok) {
      setEnrollment(null);
      success('수강이 취소되었습니다.');
    } else {
      const err = await res.json().catch(() => ({}));
      error(err.message || '수강 취소에 실패했습니다.');
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

  if (loading) return <SkeletonCourseDetail />;
  if (!course) return (
    <div className="flex justify-center py-20 text-gray-400">강의를 찾을 수 없습니다.</div>
  );

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 뒤로가기 */}
      <button
        onClick={() => navigate('/courses')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 mb-4 flex items-center gap-1 transition-colors">
        ← 강의 목록으로
      </button>

      {/* 모바일: 우측 패널을 상단에 먼저 표시, 데스크탑: 2컬럼 */}
      <div className="flex flex-col-reverse lg:flex-row lg:gap-6 lg:items-start">

        {/* 좌측: 썸네일 + 커리큘럼 + 교육자료 + 리뷰 */}
        <div className="flex-1 min-w-0 space-y-4 mt-4 lg:mt-0">
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

          {/* 수강 후기 */}
          <ReviewSection courseId={courseId} enrollment={enrollment} />

          {/* 강의 Q&A */}
          <QnaSection courseId={courseId} enrollment={enrollment} />
        </div>

        {/* 우측: 강의 정보 + 수강신청 (데스크탑: sticky, 모바일: 상단 표시) */}
        <div className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            {/* 제목 */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
              )}
            </div>

            {/* 레슨/섹션 요약 + 별점 */}
            <div className="flex flex-col gap-1.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-3">
                <span>📚 총 {totalLessons}개 레슨</span>
                <span>🗂️ {course.sections?.length || 0}개 섹션</span>
                {course.viewCount > 0 && <span>👁 {course.viewCount.toLocaleString()}</span>}
              </div>
              {course.reviewCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating value={Math.round(course.avgRating)} readonly size="sm" />
                  <span className="font-semibold text-yellow-500">{course.avgRating.toFixed(1)}</span>
                  <span>({course.reviewCount}개 후기)</span>
                </div>
              )}
            </div>

            {/* 좋아요 버튼 */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                disabled={liking}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  liked
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-500'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300 hover:text-red-400'
                }`}>
                {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount.toLocaleString() : '좋아요'}
              </button>
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
                {course.maxStudents && (
                  <div className="flex gap-2">
                    <span className="shrink-0 text-gray-400">👥 정원</span>
                    <span className={course.enrolledCount >= course.maxStudents ? 'text-red-400 font-medium' : ''}>
                      {course.enrolledCount ?? 0} / {course.maxStudents}명
                      {course.enrolledCount >= course.maxStudents && ' (마감)'}
                    </span>
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
                      // lastLessonId 있으면 이어보기, 없으면 첫 레슨
                      const resumeLessonId = enrollment.lastLessonId;
                      if (resumeLessonId) {
                        navigate(`/courses/${courseId}/lessons/${resumeLessonId}`);
                      } else {
                        const firstLesson = course.sections?.[0]?.lessons?.[0];
                        if (firstLesson) navigate(`/courses/${courseId}/lessons/${firstLesson.id}`);
                      }
                    }}
                    className="w-full mt-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                    {enrollment.lastLessonId ? '▶ 이어서 학습하기' : '▶ 학습 시작하기'}
                  </button>
                  <button
                    onClick={handleCancelEnroll}
                    className="w-full py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    수강 취소
                  </button>
                </div>
              ) : waiting ? (
                <div className="space-y-2">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-amber-600 text-sm font-semibold">⏳ 대기 {waiting.position}번</span>
                    </div>
                    <p className="text-xs text-amber-500 dark:text-amber-400">정원이 생기면 자동 알림을 받습니다</p>
                  </div>
                  <button
                    onClick={handleCancelWaiting}
                    className="w-full py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    대기 취소
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
                    {enrolling ? '신청 중...' : '수강 신청하기'}
                  </button>
                  {course.maxStudents && (
                    <p className="text-center text-xs text-gray-400">
                      정원 {course.enrolledCount ?? 0} / {course.maxStudents}명
                      {course.enrolledCount >= course.maxStudents && (
                        <span className="ml-1.5 text-red-400 font-medium">정원 마감</span>
                      )}
                    </p>
                  )}
                </div>
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

    <ConfirmModal {...confirmProps} />
    </>
  );
}
