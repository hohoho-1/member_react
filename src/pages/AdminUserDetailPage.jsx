import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { SkeletonPage } from '../components/SkeletonLoader';
import { authFetch, isAdmin, getTokenPayload } from '../utils/authFetch';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../hooks/useConfirm';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPage = searchParams.get('from') ?? '1';
  const fromKeyword = searchParams.get('keyword') ?? '';

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', role: '' });
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwMsg, setPwMsg] = useState({ text: '', type: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const currentUserId = getTokenPayload()?.userId;
  const isMe = user?.id === currentUserId;
  const { confirmProps, confirm } = useConfirm();

  const inputCls = 'w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900';

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    authFetch(`/api/users/admin/users/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) { setUser(data); setForm({ username: data.username, email: data.email, role: data.role }); }
        else navigate('/admin');
        setLoading(false);
      });
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      if (form.role !== user.role) {
        if (isMe) { setUpdateMsg({ text: '자신의 권한은 변경할 수 없습니다.', type: 'error' }); setUpdateLoading(false); return; }
        const roleRes = await authFetch(`/api/users/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: form.role }) });
        if (!roleRes.ok) { const data = await roleRes.json(); setUpdateMsg({ text: data.message || '권한 변경에 실패했습니다.', type: 'error' }); setUpdateLoading(false); return; }
      }
      const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'PUT', body: JSON.stringify({ username: form.username, email: form.email }) });
      const data = await res.json();
      if (res.ok) { setUser({ ...data, role: form.role }); setUpdateMsg({ text: '회원 정보가 수정되었습니다!', type: 'success' }); }
      else setUpdateMsg({ text: data.message || '수정에 실패했습니다.', type: 'error' });
    } catch { setUpdateMsg({ text: '서버 오류가 발생했습니다.', type: 'error' }); }
    finally { setUpdateLoading(false); }
  };

  const handleDelete = async () => {
    if (isMe) { setUpdateMsg({ text: '자신은 삭제할 수 없습니다.', type: 'error' }); return; }
    const ok = await confirm({ title: '회원 영구 삭제', message: `'${user.username}' 회원을 즉시 삭제합니다.\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`, confirmText: '삭제', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) navigate('/admin');
    else { const data = await res.json(); setUpdateMsg({ text: data.message || '삭제에 실패했습니다.', type: 'error' }); }
  };

  const handleWithdraw = async () => {
    if (isMe) { setUpdateMsg({ text: '자신은 탈퇴 처리할 수 없습니다.', type: 'error' }); return; }
    const ok = await confirm({ title: '회원 탈퇴 처리', message: `'${user.username}' 회원을 탈퇴 처리하시겠습니까?\n탈퇴 회원 탭에서 복구할 수 있습니다.`, confirmText: '탈퇴 처리', confirmColor: 'red' });
    if (!ok) return;
    const res = await authFetch(`/api/users/admin/users/${id}/withdraw`, { method: 'POST' });
    if (res.ok) navigate('/admin?tab=deleted');
    else { const data = await res.json(); setUpdateMsg({ text: data.message || '탈퇴 처리에 실패했습니다.', type: 'error' }); }
  };

  const handleUnlockUser = async () => {
    setUnlockLoading(true);
    const res = await authFetch(`/api/users/admin/users/${id}/unlock`, { method: 'PATCH' });
    const data = await res.json();
    if (res.ok) {
      setUser(prev => ({ ...prev, loginLocked: false, loginLockedUntil: null }));
      setUpdateMsg({ text: '로그인 잠금이 해제되었습니다.', type: 'success' });
    } else {
      setUpdateMsg({ text: data.message || '잠금 해제에 실패했습니다.', type: 'error' });
    }
    setUnlockLoading(false);
  };

  const handleForceChangePassword = async () => {
    if (pwForm.newPassword.length < 6) { setPwMsg({ text: '비밀번호는 6자 이상이어야 합니다.', type: 'error' }); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwMsg({ text: '비밀번호가 일치하지 않습니다.', type: 'error' }); return; }
    const ok = await confirm({ title: '비밀번호 강제 변경', message: `'${user.username}' 회원의 비밀번호를 강제 변경하시겠습니까?`, confirmText: '변경', confirmColor: 'blue' });
    if (!ok) return;
    setPwLoading(true); setPwMsg({ text: '', type: '' });
    const res = await authFetch(`/api/users/admin/users/${id}/password`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    if (res.ok) { setPwMsg({ text: '비밀번호가 변경되었습니다!', type: 'success' }); setPwForm({ newPassword: '', confirmPassword: '' }); }
    else setPwMsg({ text: data.message || '비밀번호 변경에 실패했습니다.', type: 'error' });
    setPwLoading(false);
  };

  if (loading) return <SkeletonPage />;

  return (
    <>
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen flex items-start justify-center py-8 px-4">
      <div className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-lg">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-100">👤 회원 상세</h2>
          <button onClick={() => navigate(`/admin?page=${fromPage}${fromKeyword ? '&keyword=' + encodeURIComponent(fromKeyword) : ''}`)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm transition-colors">
            ← 목록으로
          </button>
        </div>

        {/* 회원 기본 정보 카드 */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-500">
              {user.username[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{user.username}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{user.email}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${user.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
              {user.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 border-t border-gray-200 dark:border-gray-600 pt-2">
            <p>ID: <span className="font-medium text-gray-700 dark:text-gray-200">{user.id}</span></p>
            <p>로그인 횟수: <span className="font-medium text-gray-700 dark:text-gray-200">{user.loginCount}회</span></p>
            <p>가입일: <span className="font-medium text-gray-700 dark:text-gray-200">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</span></p>
            <p>최종 로그인: <span className="font-medium text-gray-700 dark:text-gray-200">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '-'}</span></p>
            <p>수정일: <span className="font-medium text-gray-700 dark:text-gray-200">{user.updatedAt ? new Date(user.updatedAt).toLocaleString('ko-KR') : '-'}</span></p>
            {user.isDeleted && <p className="text-red-500">탈퇴일: <span className="font-medium">{new Date(user.deletedAt).toLocaleDateString('ko-KR')}</span></p>}
          </div>
          {/* 잠금 상태 표시 */}
          {user.loginLocked && (
            <div className="mt-3 flex items-center justify-between bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">🔒 로그인 잠금 상태</p>
                <p className="text-xs text-red-400 dark:text-red-500">
                  해제 시각: {new Date(user.loginLockedUntil).toLocaleString('ko-KR')}
                </p>
              </div>
              <button onClick={handleUnlockUser} disabled={unlockLoading}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs rounded-lg font-medium transition-colors">
                {unlockLoading ? '해제 중...' : '잠금 해제'}
              </button>
            </div>
          )}
          {isMe && <p className="text-xs text-blue-400 mt-2">(현재 로그인 중인 계정)</p>}
        </div>

        {/* 수정 폼 */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">정보 수정</p>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">이름</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">이메일</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">권한</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} disabled={isMe}
              className={`${inputCls} ${isMe ? 'cursor-not-allowed opacity-60' : ''}`}>
              <option value="ROLE_USER">일반회원</option>
              <option value="ROLE_ADMIN">관리자</option>
            </select>
            {isMe && <p className="text-xs text-gray-400 mt-1">자신의 권한은 변경할 수 없습니다.</p>}
          </div>
          {updateMsg.text && (
            <div className={`text-sm text-center px-3 py-2 rounded-lg ${updateMsg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {updateMsg.text}
            </div>
          )}
          <button type="submit" disabled={updateLoading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors">
            {updateLoading ? '수정 중...' : '정보 수정'}
          </button>
        </form>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        {/* 비밀번호 강제 변경 */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide">🔑 비밀번호 강제 변경</p>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">새 비밀번호</label>
            <input type="password" value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="6자 이상 입력"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">비밀번호 확인</label>
            <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              placeholder="비밀번호 재입력"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-900" />
          </div>
          {pwMsg.text && (
            <div className={`text-sm text-center px-3 py-2 rounded-lg ${pwMsg.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {pwMsg.text}
            </div>
          )}
          <button onClick={handleForceChangePassword} disabled={pwLoading || !pwForm.newPassword}
            className="w-full py-2.5 bg-orange-400 hover:bg-orange-500 disabled:bg-orange-200 text-white rounded-lg font-medium transition-colors">
            {pwLoading ? '변경 중...' : '비밀번호 강제 변경'}
          </button>
        </div>

        <hr className="my-6 border-gray-200 dark:border-gray-700" />

        {/* 탈퇴 처리 / 영구 삭제 */}
        <div className="flex gap-3">
          <button onClick={handleWithdraw} disabled={isMe}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${isMe ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-orange-400 hover:bg-orange-500 text-white'}`}>
            탈퇴 처리
          </button>
          <button onClick={handleDelete} disabled={isMe}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${isMe ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
            🗑️ 영구 삭제
          </button>
        </div>
        {isMe && <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-2">자신은 탈퇴 처리하거나 삭제할 수 없습니다.</p>}
      </div>
    </div>
    <ConfirmModal {...confirmProps} />
    </>
  );
}
