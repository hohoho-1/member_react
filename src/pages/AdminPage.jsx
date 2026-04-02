import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch, isAdmin, getTokenPayload } from '../utils/authFetch';

// 삭제 게시글 상세 모달
function DeletedPostModal({ post, onClose, onRestore, onPermanentDelete }) {
  if (!post) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[480px] p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700">📝 삭제된 게시글 상세</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            post.boardCode === 'NOTICE' ? 'bg-red-100 text-red-500' :
            post.boardCode === 'FAQ' ? 'bg-green-100 text-green-600' :
            post.boardCode === 'QNA' ? 'bg-amber-100 text-amber-600' :
            post.boardCode === 'SUGGESTION' ? 'bg-teal-100 text-teal-600' :
            post.boardCode === 'GALLERY' ? 'bg-purple-100 text-purple-500' :
            'bg-blue-100 text-blue-500'
          }`}>
            {post.boardName}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-500">삭제됨</span>
        </div>

        <h4 className="text-base font-semibold text-gray-700 mb-3">{post.title}</h4>

        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 mb-4 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {post.content || <span className="text-gray-400">내용 없음</span>}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">번호</span>
            <span className="font-medium text-gray-600">{post.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">작성자</span>
            <span className="font-medium text-gray-600">{post.authorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">조회수</span>
            <span className="font-medium text-gray-600">{post.viewCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">작성일</span>
            <span className="font-medium text-gray-600">
              {post.createdAt ? new Date(post.createdAt).toLocaleString('ko-KR') : '-'}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
            <span className="text-orange-400">삭제일</span>
            <span className="font-medium text-orange-400">
              {post.deletedAt ? new Date(post.deletedAt).toLocaleString('ko-KR') : '-'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => onRestore(post.id, post.title)}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            복구
          </button>
          <button onClick={() => onPermanentDelete(post.id, post.title)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            영구삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// 탈퇴 회원 상세 모달
function DeletedUserModal({ user, onClose, onRestore, onPermanentDelete }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[400px] p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700">🗑️ 탈퇴 회원 상세</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-400">
            {user.username[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-500">{user.username}</p>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <span className="ml-auto px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-500">탈퇴</span>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-gray-400">ID</span>
            <span className="font-medium text-gray-600">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">권한</span>
            <span className="font-medium text-gray-600">{user.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">가입일</span>
            <span className="font-medium text-gray-600">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">최종 로그인</span>
            <span className="font-medium text-gray-600">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">로그인 횟수</span>
            <span className="font-medium text-gray-600">{user.loginCount}회</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
            <span className="text-red-400">탈퇴일</span>
            <span className="font-medium text-red-400">{user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('ko-KR') : '-'}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onRestore(user.id, user.username)}
            className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
            복구
          </button>
          <button onClick={() => onPermanentDelete(user.id, user.username)}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
            영구삭제
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 5;
const LOG_PAGE_SIZE = 15;

const BOARD_TYPE_LABELS = { NORMAL: '일반형', GALLERY: '이미지형', QNA: '질문답변형', FAQ: 'FAQ형' };
const BOARD_GROUP_LABELS = { COMMUNITY: '커뮤니티', SUPPORT: '고객센터' };

const BOARD_FORM_DEFAULT = {
  code: '', name: '', boardGroup: 'COMMUNITY', boardType: 'NORMAL',
  adminOnly: false, allowComment: true, allowAttachment: true,
  sortOrder: 0, active: true,
};

// ── 게시판 생성/수정 모달 ──────────────────────────────────────────────────
function BoardFormModal({ board, onClose, onSave }) {
  const isEdit = !!board?.code;
  const [form, setForm] = useState(
    isEdit ? {
      code: board.code, name: board.name,
      boardGroup: board.boardGroup, boardType: board.boardType,
      adminOnly: board.adminOnly, allowComment: board.allowComment,
      allowAttachment: board.allowAttachment, sortOrder: board.sortOrder,
      active: board.active,
    } : { ...BOARD_FORM_DEFAULT }
  );
  const [error, setError] = useState('');

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('게시판 이름을 입력하세요.'); return; }
    if (!isEdit && !form.code.trim()) { setError('게시판 코드를 입력하세요.'); return; }
    setError('');
    await onSave(form, isEdit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[500px] max-h-[90vh] overflow-y-auto p-8"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-700">
            {isEdit ? '📝 게시판 수정' : '➕ 게시판 생성'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="space-y-4">
          {/* 코드 (생성 시만) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">게시판 코드 <span className="text-red-400">*</span></label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="영문 대문자/숫자/언더바 (예: FREE, MY_BOARD)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 font-mono" />
              <p className="text-xs text-gray-400 mt-1">영문 대문자·숫자·언더바만 사용 가능, 생성 후 변경 불가</p>
            </div>
          )}

          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">게시판 이름 <span className="text-red-400">*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="예: 자유게시판, 공지사항"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          </div>

          {/* 그룹 + 유형 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">메뉴 그룹</label>
              <select value={form.boardGroup} onChange={e => set('boardGroup', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400">
                <option value="COMMUNITY">커뮤니티</option>
                <option value="SUPPORT">고객센터</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">게시판 유형</label>
              <select value={form.boardType} onChange={e => set('boardType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400">
                <option value="NORMAL">일반형</option>
                <option value="GALLERY">이미지형</option>
                <option value="QNA">질문답변형</option>
                <option value="FAQ">FAQ형</option>
              </select>
            </div>
          </div>

          {/* 표시 순서 */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">표시 순서</label>
            <input type="number" value={form.sortOrder} onChange={e => set('sortOrder', parseInt(e.target.value) || 0)}
              className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 text-center" />
            <p className="text-xs text-gray-400 mt-1">숫자가 작을수록 탭에서 앞쪽에 표시됩니다</p>
          </div>

          {/* 옵션 체크박스들 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">옵션 설정</p>
            {[
              { key: 'adminOnly',       label: '관리자만 글쓰기 가능', desc: '공지사항·FAQ 등 관리자 전용 게시판' },
              { key: 'allowComment',    label: '댓글 허용',           desc: '사용자 댓글 작성 가능 여부' },
              { key: 'allowAttachment', label: '파일 첨부 허용',       desc: '이미지·파일 업로드 가능 여부' },
              { key: 'active',          label: '즉시 활성화',          desc: '비활성이면 사용자 화면에서 숨김' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-indigo-500 cursor-pointer" />
                <div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{label}</span>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* 유형 안내 */}
          <div className="bg-indigo-50 rounded-xl p-4 text-xs text-indigo-700 space-y-1">
            <p className="font-semibold mb-1">📌 게시판 유형 안내</p>
            <p>• <strong>일반형</strong> — 텍스트 중심 게시판 (자유게시판, 공지사항, 건의사항)</p>
            <p>• <strong>이미지형</strong> — 썸네일 그리드 뷰 (사진갤러리)</p>
            <p>• <strong>질문답변형</strong> — 관리자 답변 기능 포함, 답변완료/대기 표시 (QnA)</p>
            <p>• <strong>FAQ형</strong> — 목록에서 Q/A 아코디언 펼치기, 상세 페이지 없음 (FAQ)</p>
          </div>

          {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-medium transition-colors">
              취소
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
              {isEdit ? '수정 완료' : '게시판 생성'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ACTION_LABELS = {
  LOGIN:       { label: '로그인',   color: 'bg-blue-100 text-blue-700' },
  LOGOUT:      { label: '로그아웃', color: 'bg-gray-100 text-gray-600' },
  SIGNUP:      { label: '회원가입', color: 'bg-green-100 text-green-700' },
  WITHDRAW:    { label: '탈퇴',     color: 'bg-red-100 text-red-600' },
  ROLE_CHANGE: { label: '권한변경', color: 'bg-purple-100 text-purple-700' },
};

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 탭: 'active' | 'deleted' | 'logs' | 'deletedPosts' | 'boards'
  const tab = searchParams.get('tab') ?? 'active';

  // 회원 목록 상태
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);

  // 로그 상태
  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logTotalPages, setLogTotalPages] = useState(0);
  const [logTotalElements, setLogTotalElements] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logKeyword, setLogKeyword] = useState('');
  const [logAction, setLogAction] = useState('');

  // 삭제 게시글 상태
  const [deletedPosts, setDeletedPosts] = useState([]);
  const [deletedPostLoading, setDeletedPostLoading] = useState(false);
  const [deletedPostTotalPages, setDeletedPostTotalPages] = useState(0);
  const [deletedPostTotalElements, setDeletedPostTotalElements] = useState(0);
  const [deletedPostPage, setDeletedPostPage] = useState(0);
  const [deletedPostKeyword, setDeletedPostKeyword] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);

  // 게시판 관리 상태
  const [boards, setBoards] = useState([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [editingSortOrder, setEditingSortOrder] = useState({});
  const [boardFormTarget, setBoardFormTarget] = useState(null); // null=닫힘, {}=생성, board=수정

  // 알림 상태
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [aiDays, setAiDays] = useState(7);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const currentPage = Math.max(0, parseInt(searchParams.get('page') ?? '1') - 1);
  const keyword = searchParams.get('keyword') ?? '';
  const currentUserId = getTokenPayload()?.userId;
  const [keywordInput, setKeywordInput] = useState(keyword);
  const isComposingMember = useRef(false);

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    if (tab === 'logs') {
      setLogPage(0); setLogKeyword(''); setLogAction('');
      loadLogs(0, '', '');
    } else if (tab === 'deletedPosts') {
      setDeletedPostPage(0); setDeletedPostKeyword('');
      loadDeletedPosts(0, '');
    } else if (tab === 'boards') {
      loadBoards();
    } else {
      loadUsers(currentPage, keyword, tab);
    }
  }, [searchParams.toString()]);

  const loadAiInsights = async (days) => {
    setAiLoading(true);
    setAiError('');
    const res = await authFetch(`/api/posts/admin/ai-insights?days=${days}`);
    if (res.ok) {
      const data = await res.json();
      setAiInsights(data);
    } else {
      const data = await res.json().catch(() => ({}));
      setAiError(data.message || 'AI 인사이트를 불러오지 못했습니다.');
    }
    setAiLoading(false);
  };

  const handleAiDaysChange = (days) => {
    setAiDays(days);
    loadAiInsights(days);
  };

  const normalizeCategoryStats = (stats) => {
    if (!stats) return [];
    if (Array.isArray(stats)) {
      return stats
        .map(item => ({
          category: item?.category ?? item?.name ?? '-',
          count: Number(item?.count ?? 0),
        }))
        .sort((a, b) => b.count - a.count);
    }
    if (typeof stats === 'object') {
      return Object.entries(stats)
        .map(([category, count]) => ({ category, count: Number(count ?? 0) }))
        .sort((a, b) => b.count - a.count);
    }
    return [];
  };

  const loadUsers = async (page, kw, currentTab) => {
    setLoading(true);
    const endpoint = currentTab === 'deleted'
      ? `/api/users/admin/users/deleted?page=${page}&size=${PAGE_SIZE}&keyword=${encodeURIComponent(kw)}`
      : `/api/users/admin/users?page=${page}&size=${PAGE_SIZE}&keyword=${encodeURIComponent(kw)}`;
    const res = await authFetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    }
    setLoading(false);
  };

  const loadDeletedPosts = async (page, kw) => {
    setDeletedPostLoading(true);
    const res = await authFetch(
      `/api/posts/deleted?page=${page}&size=10&keyword=${encodeURIComponent(kw)}`
    );
    if (res.ok) {
      const data = await res.json();
      setDeletedPosts(data.posts);
      setDeletedPostTotalPages(data.totalPages);
      setDeletedPostTotalElements(data.totalElements);
    }
    setDeletedPostLoading(false);
  };

  const handleRestorePost = async (id, title) => {
    if (!window.confirm(`'${title}' 게시글을 복구하시겠습니까?`)) return;
    const res = await authFetch(`/api/posts/${id}/restore`, { method: 'POST' });
    if (res.ok) {
      setSelectedPost(null);
      showSuccess(`게시글이 복구되었습니다.`);
      loadDeletedPosts(deletedPostPage, deletedPostKeyword);
    } else {
      const data = await res.json();
      showError(data.message || '복구에 실패했습니다.');
    }
  };

  const handlePermanentDeletePost = async (id, title) => {
    if (!window.confirm(`'${title}' 게시글을 완전히 삭제합니다.\n이 작업은 되돌릴 수 없습니다.`)) return;
    const res = await authFetch(`/api/posts/${id}/permanent`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedPost(null);
      showSuccess(`게시글이 영구 삭제되었습니다.`);
      const newPage = deletedPosts.length === 1 && deletedPostPage > 0 ? deletedPostPage - 1 : deletedPostPage;
      setDeletedPostPage(newPage);
      loadDeletedPosts(newPage, deletedPostKeyword);
    } else {
      showError('영구 삭제에 실패했습니다.');
    }
  };

  const loadLogs = async (page, kw, action) => {
    setLogLoading(true);
    const res = await authFetch(
      `/api/users/admin/logs?page=${page}&size=${LOG_PAGE_SIZE}&keyword=${encodeURIComponent(kw)}&action=${action}`
    );
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
      setLogTotalPages(data.totalPages);
      setLogTotalElements(data.totalElements);
    }
    setLogLoading(false);
  };

  const switchTab = (newTab) => setSearchParams({ tab: newTab });

  const goToPage = (page) => {
    const params = { tab };
    if (page + 1 > 1) params.page = String(page + 1);
    if (keyword) params.keyword = keyword;
    setSearchParams(params);
  };

  const handleKeywordChange = (e) => {
    const kw = e.target.value;
    setKeywordInput(kw);
    if (isComposingMember.current) return;
    const params = { tab };
    if (kw) params.keyword = kw;
    setSearchParams(params);
  };

  const handleRestore = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 복구하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}/restore`, { method: 'POST' });
    if (res.ok) {
      setSelectedUser(null);
      showSuccess(`'${username}' 회원이 복구되었습니다.`);
      const newPage = users.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      loadUsers(newPage, keyword, tab);
      if (newPage !== currentPage) goToPage(newPage);
    } else {
      const data = await res.json();
      showError(data.message || '복구에 실패했습니다.');
    }
  };

  const handlePermanentDelete = async (id, username) => {
    if (!window.confirm(`'${username}' 회원을 완전히 삭제합니다.\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSelectedUser(null);
      showSuccess(`'${username}' 회원이 영구 삭제되었습니다.`);
      const newPage = users.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      loadUsers(newPage, keyword, tab);
      if (newPage !== currentPage) goToPage(newPage);
    } else {
      showError('영구 삭제에 실패했습니다.');
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('모든 활동 로그를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    const res = await authFetch('/api/users/admin/logs', { method: 'DELETE' });
    if (res.ok) {
      showSuccess('활동 로그가 모두 삭제되었습니다.');
      setLogPage(0);
      loadLogs(0, logKeyword, logAction);
    } else {
      showError('로그 삭제에 실패했습니다.');
    }
  };

  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 3000); };
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  // ── 게시판 관리 ──────────────────────────────────────────────────────────
  const loadBoards = async () => {
    setBoardLoading(true);
    const res = await authFetch('/api/boards/admin/all');
    if (res.ok) {
      const data = await res.json();
      setBoards(data);
      const initSortOrder = {};
      data.forEach(b => { initSortOrder[b.code] = b.sortOrder; });
      setEditingSortOrder(initSortOrder);
    }
    setBoardLoading(false);
  };

  const handleToggleBoardActive = async (code) => {
    const res = await authFetch(`/api/boards/${code}/toggle-active`, { method: 'PATCH' });
    if (res.ok) {
      const updated = await res.json();
      setBoards(prev => prev.map(b => b.code === code ? updated : b));
      showSuccess(`'${updated.name}' 게시판이 ${updated.active ? '활성화' : '비활성화'}되었습니다.`);
    } else showError('게시판 상태 변경에 실패했습니다.');
  };

  const handleUpdateSortOrder = async (code) => {
    const newOrder = parseInt(editingSortOrder[code], 10);
    if (isNaN(newOrder)) { showError('올바른 숫자를 입력하세요.'); return; }
    const res = await authFetch(`/api/boards/${code}/sort-order`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sortOrder: newOrder }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBoards(prev => [...prev.map(b => b.code === code ? updated : b)].sort((a, b) => a.sortOrder - b.sortOrder));
      showSuccess(`'${updated.name}' 순서가 변경되었습니다.`);
    } else showError('순서 변경에 실패했습니다.');
  };

  const handleSaveBoard = async (form, isEdit) => {
    const url    = isEdit ? `/api/boards/${form.code}` : '/api/boards';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const saved = await res.json();
      if (isEdit) {
        setBoards(prev => prev.map(b => b.code === saved.code ? saved : b));
        showSuccess(`'${saved.name}' 게시판이 수정되었습니다.`);
      } else {
        setBoards(prev => [...prev, saved].sort((a, b) => a.sortOrder - b.sortOrder));
        setEditingSortOrder(prev => ({ ...prev, [saved.code]: saved.sortOrder }));
        showSuccess(`'${saved.name}' 게시판이 생성되었습니다.`);
      }
      setBoardFormTarget(null);
    } else {
      const data = await res.json().catch(() => ({}));
      showError(data.message || (isEdit ? '수정에 실패했습니다.' : '생성에 실패했습니다.'));
    }
  };

  const handleDeleteBoard = async (code, name) => {
    if (!window.confirm(`'${name}' 게시판을 삭제하시겠습니까?\n⚠️ 게시글이 남아있는 경우 삭제되지 않을 수 있습니다.`)) return;
    const res = await authFetch(`/api/boards/${code}`, { method: 'DELETE' });
    if (res.ok) {
      setBoards(prev => prev.filter(b => b.code !== code));
      showSuccess(`'${name}' 게시판이 삭제되었습니다.`);
    } else {
      const data = await res.json().catch(() => ({}));
      showError(data.message || '삭제에 실패했습니다.');
    }
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <div className="bg-gray-100 p-6">
      <DeletedUserModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
      <DeletedPostModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onRestore={handleRestorePost}
        onPermanentDelete={handlePermanentDeletePost}
      />
      {boardFormTarget !== null && (
        <BoardFormModal
          board={boardFormTarget}
          onClose={() => setBoardFormTarget(null)}
          onSave={handleSaveBoard}
        />
      )}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">🛠️ 관리자 페이지</h2>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm text-center">
            ✅ {successMsg}
          </div>
        )}

        {/* 관리자 AI 인사이트 */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-700">🤖 관리자 AI 인사이트</h3>
              <p className="text-xs text-gray-400 mt-1">게시글 활동 요약과 AI 분석 결과를 확인할 수 있습니다.</p>
            </div>
            <button onClick={() => loadAiInsights(aiDays)}
              disabled={aiLoading}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:bg-gray-50 disabled:text-gray-300 transition-colors">
              새로고침
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {[7, 14, 30].map(days => (
              <button key={days}
                onClick={() => handleAiDaysChange(days)}
                disabled={aiLoading}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  aiDays === days ? 'bg-indigo-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                } disabled:bg-gray-50 disabled:text-gray-300`}>
                {days}일
              </button>
            ))}
          </div>

          {aiLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">AI 인사이트를 불러오는 중입니다...</div>
          ) : aiError ? (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
              ⚠️ {aiError}
            </div>
          ) : aiInsights ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-400">활성 게시글 수</p>
                  <p className="text-2xl font-bold text-blue-600">{aiInsights.activePostCount ?? 0}</p>
                </div>
                <div className="bg-red-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-red-400">삭제 게시글 수</p>
                  <p className="text-2xl font-bold text-red-500">{aiInsights.deletedPostCount ?? 0}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">카테고리별 게시글</p>
                {normalizeCategoryStats(aiInsights.categoryStats).length === 0 ? (
                  <p className="text-sm text-gray-400">카테고리 통계 데이터가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {normalizeCategoryStats(aiInsights.categoryStats).map(stat => (
                      <span key={stat.category}
                        className="px-3 py-1 rounded-full bg-gray-200 text-gray-600 text-xs font-medium">
                        {stat.category}: {stat.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-indigo-700 mb-2">AI 분석</p>
                {aiInsights.insight ? (
                  <p className="text-sm text-gray-700 whitespace-pre-line">{aiInsights.insight}</p>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>💳</span>
                    <span>AI 분석을 사용하려면 OpenAI 크레딧 충전이 필요합니다.</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 text-right">
                생성 시각: {aiInsights.generatedAt ? new Date(aiInsights.generatedAt).toLocaleString('ko-KR') : '-'}
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">AI 인사이트 데이터가 없습니다.</div>
          )}
        </div>

        {/* 회원 수 카드 (로그/삭제게시글/게시판관리 탭 제외) */}
        {tab !== 'logs' && tab !== 'deletedPosts' && tab !== 'boards' && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6 text-center">
            <p className="text-4xl font-bold text-blue-500">{totalElements}</p>
            <p className="text-sm text-gray-400 mt-1">
              {tab === 'deleted' ? '탈퇴 회원 수' : '활성 회원 수'}
            </p>
          </div>
        )}

        {/* 탭 버튼 */}
        <div className="flex mb-4 bg-white rounded-2xl shadow overflow-hidden">
          <button onClick={() => switchTab('active')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'active' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            👥 활성 회원
          </button>
          <button onClick={() => switchTab('deleted')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'deleted' ? 'bg-red-400 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            🗑️ 탈퇴 회원
          </button>
          <button onClick={() => switchTab('logs')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'logs' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📋 활동 로그
          </button>
          <button onClick={() => switchTab('deletedPosts')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'deletedPosts' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📝 삭제 게시글
          </button>
          <button onClick={() => switchTab('boards')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'boards' ? 'bg-indigo-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
            📌 게시판 관리
          </button>
        </div>

        {/* ── 활동 로그 탭 ── */}
        {tab === 'logs' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-100 gap-3">
              <span className="font-semibold text-gray-700">
                활동 로그
                <span className="ml-2 text-sm text-gray-400">({logTotalElements}건)</span>
              </span>
              <div className="flex gap-2 flex-wrap">
                <select value={logAction}
                  onChange={e => { const v = e.target.value; setLogAction(v); setLogPage(0); loadLogs(0, logKeyword, v); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400">
                  <option value="">전체 액션</option>
                  <option value="LOGIN">로그인</option>
                  <option value="LOGOUT">로그아웃</option>
                  <option value="SIGNUP">회원가입</option>
                  <option value="WITHDRAW">탈퇴</option>
                  <option value="ROLE_CHANGE">권한변경</option>
                </select>
                <input type="text" placeholder="🔍 이름 또는 이메일"
                  value={logKeyword}
                  onChange={e => { const v = e.target.value; setLogKeyword(v); setLogPage(0); loadLogs(0, v, logAction); }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-purple-400 w-44"
                />
                <button onClick={handleClearLogs}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-sm font-medium transition-colors">
                  전체삭제
                </button>
              </div>
            </div>

            {logLoading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-gray-400">활동 로그가 없습니다.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {['시각', '이름', '이메일', '액션', '상세', 'IP'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const info = ACTION_LABELS[log.action] ?? { label: log.action, color: 'bg-gray-100 text-gray-600' };
                        return (
                          <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{log.username}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{log.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                                {info.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{log.detail}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{log.ipAddress}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => { const p = logPage - 1; setLogPage(p); loadLogs(p, logKeyword, logAction); }}
                    disabled={logPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {Array.from({ length: logTotalPages }, (_, i) => i).map(num => (
                    <button key={num} onClick={() => { setLogPage(num); loadLogs(num, logKeyword, logAction); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === logPage ? 'bg-purple-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => { const p = logPage + 1; setLogPage(p); loadLogs(p, logKeyword, logAction); }}
                    disabled={logPage >= logTotalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 삭제 게시글 탭 ── */}
        {tab === 'deletedPosts' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex flex-wrap justify-between items-center px-6 py-4 border-b border-gray-100 gap-3">
              <span className="font-semibold text-gray-700">
                삭제된 게시글
                <span className="ml-2 text-sm text-gray-400">({deletedPostTotalElements}건)</span>
              </span>
              <input type="text" placeholder="🔍 제목 또는 작성자"
                value={deletedPostKeyword}
                onChange={e => { const v = e.target.value; setDeletedPostKeyword(v); setDeletedPostPage(0); loadDeletedPosts(0, v); }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-400 w-48"
              />
            </div>

            {deletedPostLoading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : deletedPosts.length === 0 ? (
              <div className="text-center py-10 text-gray-400">삭제된 게시글이 없습니다.</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['번호', '카테고리', '제목', '작성자', '삭제일', '관리'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deletedPosts.map(post => (
                      <tr key={post.id}
                        className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPost(post)}>
                        <td className="px-4 py-3 text-sm text-gray-400">{post.id}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.boardCode === 'NOTICE' ? 'bg-red-100 text-red-500' :
                            post.boardCode === 'FAQ' ? 'bg-green-100 text-green-600' :
                            post.boardCode === 'QNA' ? 'bg-amber-100 text-amber-600' :
                            post.boardCode === 'GALLERY' ? 'bg-purple-100 text-purple-500' :
                            post.boardCode === 'SUGGESTION' ? 'bg-teal-100 text-teal-600' :
                            'bg-blue-100 text-blue-500'
                          }`}>
                            {post.boardName ?? post.boardCode ?? '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 max-w-[180px] truncate">{post.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{post.authorName}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {post.deletedAt ? new Date(post.deletedAt).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleRestorePost(post.id, post.title)}
                              className="px-3 py-1 rounded-lg text-xs bg-green-50 hover:bg-green-100 text-green-600 transition-colors">
                              복구
                            </button>
                            <button onClick={() => handlePermanentDeletePost(post.id, post.title)}
                              className="px-3 py-1 rounded-lg text-xs bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                              영구삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => { const p = deletedPostPage - 1; setDeletedPostPage(p); loadDeletedPosts(p, deletedPostKeyword); }}
                    disabled={deletedPostPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {Array.from({ length: deletedPostTotalPages }, (_, i) => i).map(num => (
                    <button key={num} onClick={() => { setDeletedPostPage(num); loadDeletedPosts(num, deletedPostKeyword); }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === deletedPostPage ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => { const p = deletedPostPage + 1; setDeletedPostPage(p); loadDeletedPosts(p, deletedPostKeyword); }}
                    disabled={deletedPostPage >= deletedPostTotalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── 게시판 관리 탭 ── */}
        {tab === 'boards' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-700">
                게시판 목록
                <span className="ml-2 text-sm text-gray-400">({boards.length}개)</span>
              </span>
              <div className="flex gap-2">
                <button onClick={loadBoards}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
                  새로고침
                </button>
                <button onClick={() => setBoardFormTarget({})}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors">
                  ➕ 게시판 추가
                </button>
              </div>
            </div>

            {boardLoading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : boards.length === 0 ? (
              <div className="text-center py-10 text-gray-400">게시판이 없습니다.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {boards.map(board => (
                  <div key={board.code}
                    className={`flex items-center gap-4 px-6 py-4 transition-colors ${board.active ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}`}>

                    {/* 게시판 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm ${board.active ? 'text-gray-800' : 'text-gray-400'}`}>
                          {board.name}
                        </span>
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {board.code}
                        </span>
                        {!board.active && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-xs rounded-full">비활성</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          board.boardGroup === 'COMMUNITY' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {BOARD_GROUP_LABELS[board.boardGroup] ?? board.boardGroup}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          board.boardType === 'GALLERY' ? 'bg-pink-100 text-pink-600' :
                          board.boardType === 'QNA'     ? 'bg-amber-100 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {BOARD_TYPE_LABELS[board.boardType] ?? board.boardType}
                        </span>
                        {board.adminOnly && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500 font-medium">관리자 전용</span>
                        )}
                        {!board.allowComment && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">댓글 비허용</span>
                        )}
                      </div>
                    </div>

                    {/* 순서 편집 */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-gray-400">순서</span>
                      <input
                        type="number"
                        value={editingSortOrder[board.code] ?? board.sortOrder}
                        onChange={e => setEditingSortOrder(prev => ({ ...prev, [board.code]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdateSortOrder(board.code); }}
                        className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-indigo-400"
                      />
                      <button onClick={() => handleUpdateSortOrder(board.code)}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-medium transition-colors">
                        적용
                      </button>
                    </div>

                    {/* 활성/비활성 토글 */}
                    <button onClick={() => handleToggleBoardActive(board.code)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        board.active
                          ? 'bg-green-50 hover:bg-green-100 text-green-600'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                      }`}>
                      {board.active ? '✅ 활성' : '⛔ 비활성'}
                    </button>

                    {/* 수정 / 삭제 */}
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setBoardFormTarget(board)}
                        className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors">
                        수정
                      </button>
                      <button onClick={() => handleDeleteBoard(board.code, board.name)}
                        className="px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-medium transition-colors">
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 안내 */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                💡 순서 숫자가 작을수록 사용자 화면 탭에서 앞쪽에 표시됩니다. &nbsp;|&nbsp; 비활성 게시판은 사용자 화면에서 숨겨집니다.
              </p>
            </div>
          </div>
        )}

        {/* ── 활성/탈퇴 회원 탭 ── */}
        {tab !== 'logs' && tab !== 'deletedPosts' && tab !== 'boards' && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-700">
                {tab === 'deleted' ? '탈퇴 회원 목록' : '전체 회원 목록'}
                <span className="ml-2 text-sm text-gray-400">({currentPage + 1} / {totalPages || 1} 페이지)</span>
              </span>
              <input type="text" placeholder="🔍 이름 또는 이메일 검색"
                value={keywordInput} onChange={handleKeywordChange}
                onCompositionStart={() => { isComposingMember.current = true; }}
                onCompositionEnd={(e) => {
                  isComposingMember.current = false;
                  const kw = e.target.value;
                  const params = { tab };
                  if (kw) params.keyword = kw;
                  setSearchParams(params);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 w-48"
              />
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">로딩 중...</div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {(tab === 'deleted'
                        ? ['ID', '이름', '이메일', '탈퇴일', '관리']
                        : ['ID', '이름', '이메일', '권한', '가입일']
                      ).map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-10 text-gray-400">
                        {tab === 'deleted' ? '탈퇴 회원이 없습니다.' : '회원이 없습니다.'}
                      </td></tr>
                    ) : tab === 'deleted' ? (
                      users.map(u => (
                        <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedUser(u)}>
                          <td className="px-4 py-3 text-sm text-gray-400">{u.id}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-400">{u.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">
                            {u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                              <button onClick={() => handleRestore(u.id, u.username)}
                                className="px-3 py-1 rounded-lg text-xs transition-colors bg-green-50 hover:bg-green-100 text-green-600">
                                복구
                              </button>
                              <button onClick={() => handlePermanentDelete(u.id, u.username)}
                                className="px-3 py-1 rounded-lg text-xs transition-colors bg-red-50 hover:bg-red-100 text-red-600">
                                영구삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      users.map(u => {
                        const isMe = u.id === currentUserId;
                        return (
                          <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/admin/users/${u.id}?from=${currentPage + 1}${keyword ? '&keyword=' + encodeURIComponent(keyword) : ''}`)}>
                            <td className="px-4 py-3 text-sm text-gray-400">{u.id}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-blue-600 hover:underline">
                              {u.username}{isMe && <span className="ml-1 text-xs text-blue-400">(나)</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ko-KR') : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                <div className="flex justify-center items-center gap-1 px-6 py-4 border-t border-gray-100">
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">‹</button>
                  {pageNumbers.map(num => (
                    <button key={num} onClick={() => goToPage(num)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${num === currentPage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {num + 1}
                    </button>
                  ))}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-100">›</button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
