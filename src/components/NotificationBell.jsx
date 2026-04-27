import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getTokenPayload } from '../utils/authFetch';
import UserAvatar from './UserAvatar';

const TYPE_ICON = {
  COMMENT:                  '💬',
  REPLY:                    '↩️',
  POST_LIKE:                '❤️',
  COMMENT_LIKE:             '❤️',
  ANSWER:                   '💡',
  COURSE_COMPLETE_PENDING:  '🎓',
  SYSTEM:                   '📢',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell({ showProfile = true }) {
  const navigate = useNavigate();
  const payload = getTokenPayload();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [myProfile, setMyProfile] = useState(null);
  const dropdownRef = useRef(null);

  // SSE 실시간 알림 연결
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const es = new EventSource(`http://localhost:8080/api/notifications/stream?token=${token}`);

    es.addEventListener('notification', (e) => {
      const newNotif = JSON.parse(e.data);
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    es.addEventListener('heartbeat', () => {});
    es.onerror = () => { es.close(); };

    return () => es.close();
  }, []);

  // 초기 unread count 로드
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    authFetch('/api/notifications/unread-count').then(res => res.ok ? res.json() : null).then(data => {
      if (data) setUnreadCount(data.count);
    });
  }, []);

  // 내 프로필 정보 조회 (최초 1회)
  useEffect(() => {
    if (payload) {
      authFetch('/api/users/me').then(res => res.ok ? res.json() : null).then(data => {
        if (data) setMyProfile(data);
      });
    }
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const res = await authFetch('/api/notifications');
    if (res.ok) {
      setNotifications(await res.json());
    }
  };

  const handleBellClick = async () => {
    if (!open) await fetchNotifications();
    setOpen(prev => !prev);
  };

  const handleClickNotification = async (noti) => {
    if (!noti.read) {
      await authFetch(`/api/notifications/${noti.id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setOpen(false);

    if (noti.courseId) {
      if (noti.type === 'COURSE_COMPLETE_PENDING') {
        navigate(`/courses/admin?courseId=${noti.courseId}`);
      } else {
        navigate(`/courses/${noti.courseId}`);
      }
      return;
    }

    if (noti.postId) {
      const returnTo = (() => {
        if (noti.boardGroup === 'COMMUNITY') return `/community?scope=${noti.boardCode}`;
        if (noti.boardGroup === 'SUPPORT')   return `/support?scope=${noti.boardCode}`;
        return '/community';
      })();
      navigate(`/board/${noti.postId}?returnTo=${encodeURIComponent(returnTo)}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    await authFetch('/api/notifications/read-all', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const unreadList = notifications.filter(n => !n.read);
  const readList = notifications.filter(n => n.read);

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {showProfile && payload && (
        <button
          onClick={() => navigate('/mypage')}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
          <UserAvatar
            profileImageUrl={myProfile?.profileImageUrl}
            username={myProfile?.username ?? payload?.username}
            size={7}
          />
          <span className="text-sm font-medium text-gray-600 hidden sm:block">
            {myProfile?.username ?? payload?.username}
          </span>
        </button>
      )}

      <div className="relative">
        <button
          onClick={handleBellClick}
          className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="알림">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-bold text-gray-700 text-sm">🔔 알림</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                  전체 읽음
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">알림이 없습니다.</div>
              ) : (
                <>
                  {unreadList.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50">새 알림</div>
                      {unreadList.map(noti => (
                        <button
                          key={noti.id}
                          onClick={() => handleClickNotification(noti)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 bg-blue-50/50">
                          <div className="flex items-start gap-2">
                            <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[noti.type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 leading-snug">{noti.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(noti.createdAt)}</p>
                            </div>
                            <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {readList.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 bg-gray-50">읽은 알림</div>
                      {readList.map(noti => (
                        <button
                          key={noti.id}
                          onClick={() => handleClickNotification(noti)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
                          <div className="flex items-start gap-2">
                            <span className="text-base shrink-0 mt-0.5 opacity-50">{TYPE_ICON[noti.type]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-400 leading-snug">{noti.message}</p>
                              <p className="text-xs text-gray-300 mt-1">{timeAgo(noti.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
