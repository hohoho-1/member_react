import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, logout } from '../utils/authFetch';

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [updateMsg, setUpdateMsg] = useState({ text: '', type: '' });
  const [deleteMsg, setDeleteMsg] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/users/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) { setUser(data); setForm(f => ({ ...f, username: data.username, email: data.email })); }
        else navigate('/login');
      });
  }, [navigate]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        setUser(data.user);
        setUpdateMsg({ text: '정보가 수정되었습니다!', type: 'success' });
        setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
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
    if (!deletePassword) { setDeleteMsg('비밀번호를 입력해주세요.'); return; }
    if (!window.confirm('정말로 탈퇴하시겠습니까?')) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch('/api/users/me', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok) { logout(); }
      else setDeleteMsg(data.message || '탈퇴에 실패했습니다.');
    } catch {
      setDeleteMsg('서버 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-gray-700 mb-1">⚙️ 마이페이지</h2>
        <p className="text-center text-sm text-gray-400 mb-6">{user.username} ({user.email})</p>

        {/* 회원정보 수정 */}
        <form onSubmit={handleUpdate} className="space-y-3">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">회원정보 수정</p>
          {[{ label: '이름', name: 'username', type: 'text' }, { label: '이메일', name: 'email', type: 'email' }].map(f => (
            <div key={f.name}>
              <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
              <input type={f.type} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          ))}
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide pt-2">비밀번호 변경 (선택)</p>
          {[{ label: '현재 비밀번호', name: 'currentPassword', ph: '현재 비밀번호' }, { label: '새 비밀번호', name: 'newPassword', ph: '새 비밀번호' }].map(f => (
            <div key={f.name}>
              <label className="block text-sm text-gray-600 mb-1">{f.label}</label>
              <input type="password" placeholder={f.ph} value={form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          ))}
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
        <button onClick={() => navigate('/home')}
          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors">
          ← 홈으로 돌아가기
        </button>
        <hr className="my-6 border-gray-200" />

        {/* 회원 탈퇴 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-xs text-red-600 mb-3">⚠️ 탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</p>
          <input type="password" placeholder="현재 비밀번호 입력" value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 mb-2" />
          {deleteMsg && <p className="text-xs text-red-600 mb-2">{deleteMsg}</p>}
          <button onClick={handleDelete} disabled={deleteLoading}
            className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-colors">
            {deleteLoading ? '처리 중...' : '회원 탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}
