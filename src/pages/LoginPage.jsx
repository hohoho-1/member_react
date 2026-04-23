import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { isLoggedIn } from '../utils/authFetch';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoggedIn()) {
      const fromLocation = location.state?.from;
      const from = fromLocation ? (fromLocation.pathname + (fromLocation.search ?? '')) : '/home';
      navigate(from, { replace: true });
    }
  }, []);

  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setMessage({ text: '이메일과 비밀번호를 입력해주세요.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setMessage({ text: `환영합니다, ${data.user.username}님!`, type: 'success' });
        const fromLocation = location.state?.from;
        const from = fromLocation ? (fromLocation.pathname + (fromLocation.search ?? '')) : '/home';
        setTimeout(() => navigate(from, { replace: true }), 800);
      } else {
        setMessage({ text: data.message || '로그인에 실패했습니다.', type: 'error' });
      }
    } catch {
      setMessage({ text: '서버에 연결할 수 없습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-white dark:bg-gray-800 p-8 sm:p-10 rounded-2xl shadow-lg w-full max-w-sm sm:max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-100 mb-6">🔐 로그인</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">이메일</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                placeholder="비밀번호 입력"
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {message.text && (
            <div className={`text-sm text-center px-3 py-2 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-blue-500 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
