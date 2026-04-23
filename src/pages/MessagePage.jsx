import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';
import { SkeletonMyPageList } from '../components/SkeletonLoader';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

// ── 쪽지 작성 모달 ────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onSent, initialReceiver = null }) {
  const [users, setUsers] = useState([]);
  const [receiverSearch, setReceiverSearch] = useState(initialReceiver?.username ?? '');
  const [selectedReceiver, setSelectedReceiver] = useState(initialReceiver);
  const [showUserList, setShowUserList] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    if (!receiverSearch.trim() || selectedReceiver) { setUsers([]); setShowUserList(false); return; }
    const timer = setTimeout(async () => {
      const res = await authFetch(`/api/users/search?keyword=${encodeURIComponent(receiverSearch)}&size=10`);
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.users ?? []));
        setShowUserList(true);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [receiverSearch, selectedReceiver]);

  const handleSend = async () => {
    if (!selectedReceiver) { setError('수신자를 선택해주세요.'); return; }
    if (!title.trim()) { setError('제목을 입력해주세요.'); return; }
    if (!content.trim()) { setError('내용을 입력해주세요.'); return; }
    setSending(true); setError('');
    const res = await authFetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: selectedReceiver.id, title: title.trim(), content: content.trim() }),
    });
    setSending(false);
    if (res.ok) { onSent?.(); onClose(); }
    else { const d = await res.json(); setError(d.message || '발송에 실패했습니다.'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">✉️ 쪽지 보내기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
        </div>
        <div className="space-y-4">
          {/* 수신자 */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">수신자</label>
            {selectedReceiver ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl">
                <UserAvatar profileImageUrl={selectedReceiver.profileImageUrl} username={selectedReceiver.username} size={6} />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedReceiver.username}</span>
                <button onClick={() => { setSelectedReceiver(null); setReceiverSearch(''); }} className="ml-auto text-blue-400 hover:text-blue-600 text-xs">✕</button>
              </div>
            ) : (
              <div ref={searchRef}>
                <input type="text" value={receiverSearch} onChange={e => setReceiverSearch(e.target.value)}
                  placeholder="회원 이름으로 검색..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400" />
                {showUserList && users.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {users.map(u => (
                      <button key={u.id} onClick={() => { setSelectedReceiver(u); setReceiverSearch(u.username); setShowUserList(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
                        <UserAvatar profileImageUrl={u.profileImageUrl} username={u.username} size={6} />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{u.username}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={200}
              placeholder="제목을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400" />
          </div>
          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">내용</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
              placeholder="내용을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 resize-none" />
          </div>
          {error && <p className="text-sm text-red-500">⚠️ {error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">취소</button>
            <button onClick={handleSend} disabled={sending}
              className="px-5 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors">
              {sending ? '전송 중...' : '✉️ 보내기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 쪽지 상세 모달 ────────────────────────────────────────────────────────────
function DetailModal({ message, myId, onClose, onDelete, onReply }) {
  if (!message) return null;
  const isSender = message.senderId === myId;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate flex-1 mr-2">{message.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none shrink-0">×</button>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <UserAvatar
              profileImageUrl={isSender ? message.receiverProfileImageUrl : message.senderProfileImageUrl}
              username={isSender ? message.receiverName : message.senderName}
              size={7}
            />
            <div>
              <p className="text-xs text-gray-400">{isSender ? '받는 사람' : '보낸 사람'}</p>
              <p className="font-medium text-gray-700 dark:text-gray-200">{isSender ? message.receiverName : message.senderName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date(message.sentAt).toLocaleString('ko-KR')}</p>
            {!isSender && (
              <p className={`text-xs font-medium ${message.readByReceiver ? 'text-gray-400' : 'text-blue-500'}`}>
                {message.readByReceiver ? '읽음' : '읽지 않음'}
              </p>
            )}
          </div>
        </div>
        <div className="px-6 py-5 min-h-[120px]">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <button onClick={() => { onDelete(message.id); onClose(); }}
            className="px-3 py-1.5 text-xs text-red-400 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
            삭제
          </button>
          {!isSender && (
            <button onClick={() => { onReply(message); onClose(); }}
              className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              ↩️ 답장
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────────────
export default function MessagePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'inbox';

  const payload = getTokenPayload();
  const myId = payload?.userId;

  const { confirmProps, confirm } = useConfirm();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedMessage, setSelectedMessage] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);

  useEffect(() => {
    if (!payload) { navigate('/login'); return; }
    loadMessages(0);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async (p) => {
    setLoading(true);
    const endpoint = tab === 'inbox'
      ? `/api/messages/inbox?page=${p}&size=20`
      : `/api/messages/outbox?page=${p}&size=20`;
    const res = await authFetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.content ?? []);
      setTotalPages(data.totalPages ?? 1);
      setPage(p);
    }
    setLoading(false);
  };

  const handleOpenDetail = async (msg) => {
    const res = await authFetch(`/api/messages/${msg.id}`);
    if (res.ok) {
      const detail = await res.json();
      setSelectedMessage(detail);
      if (tab === 'inbox') {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, readByReceiver: true } : m));
        window.dispatchEvent(new Event('message-read')); // MessageBell 즉시 갱신
      }
    }
  };

  const handleDelete = async (messageId) => {
    const ok = await confirm({ title: '쪽지 삭제', message: '이 쪽지를 삭제하시겠습니까?', confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/messages/${messageId}`, { method: 'DELETE' });
    if (res.ok) setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleReply = (msg) => {
    setReplyTarget({ id: msg.senderId, username: msg.senderName, profileImageUrl: msg.senderProfileImageUrl });
    setComposeOpen(true);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = messages.filter(m => !m.readByReceiver).map(m => m.id);
    await Promise.all(unreadIds.map(id => authFetch(`/api/messages/${id}`, { method: 'GET' })));
    setMessages(prev => prev.map(m => ({ ...m, readByReceiver: true })));
    window.dispatchEvent(new Event('message-read')); // MessageBell 즉시 갱신
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen py-6 px-3 sm:px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-100">✉️ 쪽지함</h2>
          <div className="flex items-center gap-2">
            {tab === 'inbox' && messages.some(m => !m.readByReceiver) && (
              <button onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-xs text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
                전체 읽음
              </button>
            )}
            <button onClick={() => { setReplyTarget(null); setComposeOpen(true); }}
              className="px-3 sm:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors">
              ✏️ 쪽지 쓰기
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex mb-4 bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
          {[{ key: 'inbox', label: '📥 받은 쪽지함' }, { key: 'outbox', label: '📤 보낸 쪽지함' }].map(t => (
            <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">
          {loading ? (
            <SkeletonMyPageList count={5} />
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">{tab === 'inbox' ? '📭' : '📤'}</p>
              <p>{tab === 'inbox' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {messages.map(msg => {
                const isUnread = tab === 'inbox' && !msg.readByReceiver;
                const counterpart = tab === 'inbox' ? msg.senderName : msg.receiverName;
                const counterpartImg = tab === 'inbox' ? msg.senderProfileImageUrl : msg.receiverProfileImageUrl;
                return (
                  <div key={msg.id} onClick={() => handleOpenDetail(msg)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}>
                    <div className="shrink-0">
                      <UserAvatar profileImageUrl={counterpartImg} username={counterpart} size={9} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {counterpart}
                        </span>
                        {isUnread && <span className="shrink-0 w-2 h-2 rounded-full bg-blue-500" />}
                        {tab === 'outbox' && (
                          <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                            msg.readByReceiver ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {msg.readByReceiver ? '읽음' : '안 읽음'}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-xs text-gray-400 dark:text-gray-500">{timeAgo(msg.sentAt)}</span>
                      </div>
                      <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {msg.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{msg.content}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(msg.id); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-400 transition-colors rounded">
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-1 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => loadMessages(page - 1)} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i).map(n => (
                <button key={n} onClick={() => loadMessages(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    n === page ? 'bg-blue-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                  {n + 1}
                </button>
              ))}
              <button onClick={() => loadMessages(page + 1)} disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
            </div>
          )}
        </div>
      </div>

      {/* 모달 */}
      {composeOpen && (
        <ComposeModal
          onClose={() => { setComposeOpen(false); setReplyTarget(null); }}
          onSent={() => loadMessages(0)}
          initialReceiver={replyTarget}
        />
      )}
      {selectedMessage && (
        <DetailModal
          message={selectedMessage}
          myId={myId}
          onClose={() => setSelectedMessage(null)}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      )}
      <ConfirmModal {...confirmProps} />
    </div>
  );
}
