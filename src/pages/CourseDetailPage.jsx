import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authFetch, isLoggedIn, isAdmin } from '../utils/authFetch';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { SkeletonCourseDetail } from '../components/SkeletonLoader';

const FILE_ICONS = { pdf:'?뱞', pptx:'?뱤', ppt:'?뱤', docx:'?뱷', doc:'?뱷', xlsx:'?뱤', xls:'?뱤', txt:'?뱜', zip:'?뿙截?, hwp:'?뱷', hwpx:'?뱷', mp4:'?렗', avi:'?렗', mov:'?렗' };
const getFileIcon = (name) => FILE_ICONS[name?.split('.').pop()?.toLowerCase()] || '?뱨';
const formatBytes = (b) => b < 1024 ? b+'B' : b < 1048576 ? (b/1024).toFixed(1)+'KB' : (b/1048576).toFixed(1)+'MB';

// ?? 蹂꾩젏 而댄룷?뚰듃 ??????????????????????????????????????
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
          {(hovered || value) >= star ? '狩? : '??}
        </span>
      ))}
    </div>
  );
}

// ?? 由щ럭 ?뱀뀡 ??????????????????????????????????????????
function ReviewSection({ courseId, enrollment }) {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { confirmProps: reviewConfirmProps, confirm: reviewConfirm } = useConfirm();

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
    if (!content.trim()) { alert('?꾧린 ?댁슜???낅젰?댁＜?몄슂.'); return; }
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
        alert(err.message || '?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const ok = await reviewConfirm({ title: '?꾧린 ??젣', message: '?꾧린瑜???젣?섏떆寃좎뒿?덇퉴?', confirmText: '??젣', confirmColor: 'red' });
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
      {/* ?ㅻ뜑 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-bold text-gray-900 dark:text-white">狩??섍컯 ?꾧린</h2>
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
            ?꾧린 ?묒꽦
          </button>
        )}
      </div>

      {/* ?묒꽦 ??*/}
      {showForm && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {editMode ? '?꾧린 ?섏젙' : '?꾧린 ?묒꽦'}
          </p>
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">蹂꾩젏</p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="?섍컯 ???먮? ?먯쓣 ?먯쑀濡?쾶 ?묒꽦??二쇱꽭??"
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors">
              痍⑥냼
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
              {submitting ? '???以?..' : (editMode ? '?섏젙?섍린' : '?깅줉?섍린')}
            </button>
          </div>
        </div>
      )}

      {/* ?섎즺 ?덈궡 */}
      {isLoggedIn() && !canWrite && !myReview && (
        <div className="text-sm text-gray-400 dark:text-gray-500 mb-4 text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          ?섎즺 ?꾨즺 ???꾧린瑜??묒꽦?????덉뒿?덈떎.
        </div>
      )}

      {/* 由щ럭 紐⑸줉 */}
      {reviews.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">?꾩쭅 ?꾧린媛 ?놁뒿?덈떎.</div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className={`pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 ${review.mine ? 'bg-yellow-50 dark:bg-yellow-900/10 rounded-lg px-3 pt-3' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* ?꾨컮? */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm shrink-0 overflow-hidden">
                    {review.authorAvatar
                      ? <img src={review.authorAvatar} alt="" className="w-full h-full object-cover" />
                      : review.authorName?.[0]
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{review.authorName}</span>
                      {review.mine && <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">???꾧린</span>}
                    </div>
                    <StarRating value={review.rating} readonly size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
                  {review.mine && (
                    <>
                      <button onClick={openEditForm} className="text-xs text-blue-500 hover:underline">?섏젙</button>
                      <button onClick={() => handleDelete(review.id)} className="text-xs text-red-400 hover:underline">??젣</button>
                    </>
                  )}
                  {isAdmin() && !review.mine && (
                    <button onClick={() => handleDelete(review.id)} className="text-xs text-red-400 hover:underline">??젣</button>
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
    <ConfirmModal {...reviewConfirmProps} />
    </>
  );
}

// ?? Q&A ?뱀뀡 ???????????????????????????????????????????
function QnaSection({ courseId, enrollment }) {
  const [qnaList, setQnaList] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [answerEditId, setAnswerEditId] = useState(null);
  const { confirmProps: qnaConfirmProps, confirm: qnaConfirm } = useConfirm();

  const canWrite = !!enrollment; // ?섍컯 ?좎껌留??대룄 ?묒꽦 媛??

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
    if (!title.trim() || !content.trim()) { alert('?쒕ぉ怨??댁슜???낅젰?댁＜?몄슂.'); return; }
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
        alert(err.message || '?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qnaId) => {
    const ok = await qnaConfirm({ title: '吏덈Ц ??젣', message: '吏덈Ц????젣?섏떆寃좎뒿?덇퉴?', confirmText: '??젣', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/qna/${qnaId}`, { method: 'DELETE' });
    if (res.ok) await fetchQna();
  };

  const handleAnswerSubmit = async (qnaId) => {
    if (!answerContent.trim()) { alert('?듬? ?댁슜???낅젰?댁＜?몄슂.'); return; }
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
    const ok = await qnaConfirm({ title: '?듬? ??젣', message: '?듬?????젣?섏떆寃좎뒿?덇퉴?', confirmText: '??젣', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/courses/${courseId}/qna/${qnaId}/answer`, { method: 'DELETE' });
    if (res.ok) await fetchQna();
  };

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      {/* ?ㅻ뜑 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900 dark:text-white">?뮠 媛뺤쓽 Q&amp;A</h2>
        {canWrite && !showForm && (
          <button
            onClick={openWriteForm}
            className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            吏덈Ц?섍린
          </button>
        )}
      </div>

      {/* ?묒꽦 ??*/}
      {showForm && (
        <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {editTarget ? '吏덈Ц ?섏젙' : '吏덈Ц ?묒꽦'}
          </p>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="吏덈Ц ?쒕ぉ"
            className="w-full mb-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="吏덈Ц ?댁슜???먯꽭???묒꽦??二쇱꽭??"
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors">
              痍⑥냼
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors">
              {submitting ? '???以?..' : (editTarget ? '?섏젙?섍린' : '?깅줉?섍린')}
            </button>
          </div>
        </div>
      )}

      {/* 鍮꾩닔媛??덈궡 */}
      {isLoggedIn() && !canWrite && (
        <div className="text-sm text-gray-400 dark:text-gray-500 mb-4 text-center py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          ?섍컯 ?좎껌 ??吏덈Ц???묒꽦?????덉뒿?덈떎.
        </div>
      )}

      {/* Q&A 紐⑸줉 */}
      {qnaList.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">?꾩쭅 吏덈Ц???놁뒿?덈떎.</div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {qnaList.map(q => (
            <div key={q.id} className="py-3">
              {/* 吏덈Ц ?ㅻ뜑 - ?대┃ ???쇱튂湲?*/}
              <div
                className="flex items-start gap-2 cursor-pointer"
                onClick={() => setOpenId(openId === q.id ? null : q.id)}>
                {/* ?듬? ?щ? 諛곗? */}
                <span className={`shrink-0 mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                  q.answer
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}>
                  {q.answer ? '?듬??꾨즺' : '誘몃떟蹂'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{q.authorName}</span>
                    <span className="text-xs text-gray-300">쨌</span>
                    <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {q.mine && !q.answer && (
                    <>
                      <button onClick={e => { e.stopPropagation(); openEditForm(q); }}
                        className="text-xs text-blue-500 hover:underline">?섏젙</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                        className="text-xs text-red-400 hover:underline">??젣</button>
                    </>
                  )}
                  {isAdmin() && (
                    <button onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                      className="text-xs text-red-400 hover:underline">??젣</button>
                  )}
                  <span className="text-gray-400 text-xs">{openId === q.id ? '?? : '??}</span>
                </div>
              </div>

              {/* ?쇱퀜吏??댁슜 */}
              {openId === q.id && (
                <div className="mt-3 ml-14 space-y-3">
                  {/* 吏덈Ц 蹂몃Ц */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    {q.content}
                  </div>

                  {/* 湲곗〈 ?듬? */}
                  {q.answer && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-green-700 dark:text-green-300">?뮠 愿由ъ옄 ?듬?</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(q.answer.createdAt).toLocaleDateString('ko-KR')}</span>
                          {isAdmin() && (
                            <>
                              <button onClick={() => { setAnswerEditId(q.id); setAnswerContent(q.answer.content); }}
                                className="text-xs text-blue-500 hover:underline">?섏젙</button>
                              <button onClick={() => handleAnswerDelete(q.id)}
                                className="text-xs text-red-400 hover:underline">??젣</button>
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
                              className="text-xs text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-3 py-1">痍⑥냼</button>
                            <button onClick={() => handleAnswerSubmit(q.id)}
                              className="text-xs bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1">?섏젙</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{q.answer.content}</p>
                      )}
                    </div>
                  )}

                  {/* 愿由ъ옄 ?듬? ?묒꽦 ??(誘몃떟蹂 ?곹깭) */}
                  {isAdmin() && !q.answer && answerEditId !== q.id && (
                    <button
                      onClick={() => { setAnswerEditId(q.id); setAnswerContent(''); }}
                      className="text-xs text-green-600 hover:text-green-700 border border-green-200 dark:border-green-700 rounded-lg px-3 py-1.5 transition-colors">
                      + ?듬? ?묒꽦
                    </button>
                  )}
                  {isAdmin() && !q.answer && answerEditId === q.id && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">?듬? ?묒꽦</p>
                      <textarea
                        value={answerContent}
                        onChange={e => setAnswerContent(e.target.value)}
                        rows={3}
                        placeholder="?듬? ?댁슜???낅젰?섏꽭??"
                        className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      <div className="flex gap-2 mt-1.5 justify-end">
                        <button onClick={() => setAnswerEditId(null)}
                          className="text-xs text-gray-500 border border-gray-200 dark:border-gray-600 rounded px-3 py-1">痍⑥냼</button>
                        <button onClick={() => handleAnswerSubmit(q.id)}
                          className="text-xs bg-green-500 hover:bg-green-600 text-white rounded px-3 py-1 font-medium">?깅줉</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ?섏씠吏?ㅼ씠??*/}
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
    <ConfirmModal {...qnaConfirmProps} />
    </>
  );
}

// ?? 硫붿씤 ?섏씠吏 ???????????????????????????????????????
export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [courseFiles, setCourseFiles] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    fetchCourse();
    if (isLoggedIn()) fetchMyEnrollment();
    // eslint-disable-next-line
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    const res = await authFetch(`/api/courses/${courseId}`);
    if (res.ok) {
      const data = await res.json();
      setCourse(data);
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

  const handleEnroll = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setEnrolling(true);
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setEnrollment(data);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || '?섍컯 ?좎껌???ㅽ뙣?덉뒿?덈떎.');
    }
    setEnrolling(false);
  };

  const handleDownload = async (fileId, originalName) => {
    try {
      const res = await authFetch(`/api/courses/files/${fileId}/download`);
      if (!res.ok) { alert('?ㅼ슫濡쒕뱶???ㅽ뙣?덉뒿?덈떎.'); return; }
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
      alert('?ㅼ슫濡쒕뱶 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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
    const res = await authFetch(`/api/courses/${courseId}/enroll`, { method: 'DELETE' });
    if (res.ok) {
      setEnrollment(null);
      setCancelModalOpen(false);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.message || '?섍컯 痍⑥냼???ㅽ뙣?덉뒿?덈떎.');
    }
  };

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const totalLessons = course?.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;

  const lessonTypeIcon = (type) => {
    if (type === 'VIDEO') return '?렗';
    if (type === 'QUIZ') return '?뱷';
    return '?뱞';
  };

  const formatSeconds = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (loading) return <SkeletonCourseDetail />;
  if (!course) return (
    <div className="flex justify-center py-20 text-gray-400">媛뺤쓽瑜?李얠쓣 ???놁뒿?덈떎.</div>
  );

  return (
    <>
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ?ㅻ줈媛湲?*/}
      <button
        onClick={() => navigate('/courses')}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 mb-4 flex items-center gap-1 transition-colors">
        ??媛뺤쓽 紐⑸줉?쇰줈
      </button>

      {/* 紐⑤컮?? ?곗륫 ?⑤꼸???곷떒??癒쇱? ?쒖떆, ?곗뒪?ы깙: 2而щ읆 */}
      <div className="flex flex-col-reverse lg:flex-row lg:gap-6 lg:items-start">

        {/* 醫뚯륫: ?몃꽕??+ 而ㅻ━?섎읆 + 援먯쑁?먮즺 + 由щ럭 */}
        <div className="flex-1 min-w-0 space-y-4 mt-4 lg:mt-0">
          {/* ?몃꽕??*/}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center overflow-hidden">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-contain bg-gray-900" />
              ) : (
                <span className="text-6xl">?뱴</span>
              )}
            </div>
          </div>

          {/* 而ㅻ━?섎읆 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="font-bold text-gray-900 dark:text-white mb-4">?뱥 而ㅻ━?섎읆</h2>
            {course.sections?.length === 0 ? (
              <div className="text-center py-8 text-gray-400">?깅줉??媛뺤쓽 ?댁슜???놁뒿?덈떎.</div>
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
                        <span>{section.lessons?.length || 0}媛?/span>
                        <span>{openSections[section.id] ? '?? : '??}</span>
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
                            {!enrollment && <span className="text-xs">?뵏</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 援먯쑁 ?먮즺 */}
          {courseFiles.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3">?뱨 援먯쑁 ?먮즺</h2>
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
                      ?ㅼ슫濡쒕뱶
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ?섍컯 ?꾧린 */}
          <ReviewSection courseId={courseId} enrollment={enrollment} />

          {/* 媛뺤쓽 Q&A */}
          <QnaSection courseId={courseId} enrollment={enrollment} />
        </div>

        {/* ?곗륫: 媛뺤쓽 ?뺣낫 + ?섍컯?좎껌 (?곗뒪?ы깙: sticky, 紐⑤컮?? ?곷떒 ?쒖떆) */}
        <div className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 space-y-4">
            {/* ?쒕ぉ */}
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{course.title}</h1>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{course.description}</p>
              )}
            </div>

            {/* ?덉뒯/?뱀뀡 ?붿빟 + 蹂꾩젏 */}
            <div className="flex flex-col gap-1.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-3">
                <span>?뱴 珥?{totalLessons}媛??덉뒯</span>
                <span>?뾺截?{course.sections?.length || 0}媛??뱀뀡</span>
                {course.viewCount > 0 && <span>?몓 {course.viewCount.toLocaleString()}</span>}
