import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch, isAdmin, getTokenPayload } from '../utils/authFetch';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', role: '' });
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  const currentUserId = getTokenPayload()?.userId;
  const isMe = user?.id === currentUserId;

  useEffect(() => {
    if (!isAdmin()) { navigate('/forbidden'); return; }
    authFetch(`/api/users/admin/users/${id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
          setForm({ username: data.username, email: data.email, role: data.role });
        } else {
          navigate('/admin');
        }
        setLoading(false);
      });
  }, [id, navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      // 권한 변경이 있는 경우 별도 API 호출
      if (form.role !== user.role) {
        if (isMe) {
          setUpdateMsg({ text: '자신의 권한은 변경할 수 없습니다.', type: 'error' });
          setUpdateLoading(false);
          return;
        }
        const roleRes = await authFetch(`/api/users/admin/users/${id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: form.role })
        });
        if (!roleRes.ok) {
          const data = await roleRes.json();
          setUpdateMsg({ text: data.message || '권한 변경에 실패했습니다.', type: 'error' });
          setUpdateLoading(false);
          return;
        }
      }

      // 이름/이메일 변경
      const res = await authFetch(`/api/users/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ username: form.username, email: form.email })
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...data, role: form.role });
        setUpdateMsg({ text: '회원 정보가 수정되었습니다!', type: 'success' });
      } else {
        setUpdateMsg({ text: data.message || '수정에 실패했습니다.', type: 'error' });
      }
    } catch {
      setUpdateMsg({ text: '서버 오류가 발생했습니다.', type: 'error' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isMe) { setUpdateMsg({ text: '자신은 삭제할 수 없습니다.', type: 'error' }); return; }
    if (!window.confirm(`'${user.username}' 회원을 삭제하시겠습니까?`)) return;
    const res = await authFetch(`/api/users/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) navigate('/admin');
    else {
      const data = await res.json();
      setUpdateMsg({ text: data.message || '삭제에 실패했습니다.', type: 'error' });
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-[480px]">

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">👤 회원 상세</h2>
          <button onClick={() => navigate('/admin')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm transition-colors">
            ← 목록으로
          </button>
        </div>

        {/* 회원 기본 정보 카드 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-500">
              {user.username[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-700">{user.username}</p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${user.role === 'ROLE_ADMIN' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
              {user.role === 'ROLE_ADMIN' ? '관리자' : '일반회원'}
            </span>
          </div>
          <p className="text-xs text-gray-400">ID: {user.id} {isMe && <span className="text-blue-400">(현재 로그인 중인 계정)</span>}</p>
        </div>

        {/* 수정 폼 */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">정보 수정</p>

          <div>
            <label className="block text-sm text-gray-600 mb-1">이름</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">이메일</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">권한</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              disabled={isMe}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${isMe ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
              <option value="ROLE_USER">일반회원</option>
              <option value="ROLE_ADMIN">관리자</option>
            </select>
            {isMe && <p className="text-xs text-gray-400 mt-1">자신의 권한은 변경할 수 없습니다.</p>}
          </div>

          {updateMsg.text && (
            <div className={`text-sm text-center px-3 py-2 rounded-lg ${updateMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {updateMsg.text}
            </div>
          )}

          <button type="submit" disabled={updateLoading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors">
            {updateLoading ? '수정 중...' : '정보 수정'}
          </button>
        </form>

        <hr className="my-6 border-gray-200" />

        {/* 회원 삭제 */}
        <button onClick={handleDelete} disabled={isMe}
          className={`w-full py-2.5 rounded-lg font-medium transition-colors ${isMe ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
          🗑️ 회원 삭제
        </button>
        {isMe && <p className="text-xs text-center text-gray-400 mt-2">자신은 삭제할 수 없습니다.</p>}
      </div>
    </div>
  );
}
