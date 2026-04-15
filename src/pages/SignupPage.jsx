import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [checks, setChecks] = useState({ username: null, email: null, password: null });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showPw, setShowPw] = useState(false);

  const debounce = (fn, delay) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(fn, delay));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'username' && value.trim()) {
      debounce(async () => {
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(value)}`);
        const data = await res.json();
        setChecks(c => ({ ...c, username: !data.exists }));
      }, 500);
    } else if (name === 'email' && value.trim()) {
      debounce(async () => {
        const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(value)}`);
        const data = await res.json();
        setChecks(c => ({ ...c, email: !data.exists }));
      }, 500);
    } else if (name === 'password') {
      setChecks(c => ({ ...c, password: value.length >= 6 }));
    }
    if (!value.trim()) setChecks(c => ({ ...c, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!checks.username || !checks.email || !checks.password) {
      setMessage('입력 항목을 다시 확인해주세요.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`환영합니다, ${data.username}님! 로그인 페이지로 이동합니다...`);
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setMessage('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (status) => {
    const base = 'w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
    if (status === false) return `${base} border-red-400 focus:ring-red-100 dark:focus:ring-red-900`;
    if (status === true)  return `${base} border-green-400 focus:ring-green-100 dark:focus:ring-green-900`;
    return `${base} border-gray-300 dark:border-gray-600 focus:border-green-400 focus:ring-green-100 dark:focus:ring-green-900`;
  };

  const hint = (status, okText, errText) => {
    if (status === null) return null;
    return (
      <p className={`text-xs mt-1 ${status ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
        {status ? `✅ ${okText}` : `❌ ${errText}`}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-100 mb-6">📝 회원가입</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">이름</label>
            <input type="text" name="username" value={form.username} onChange={handleChange}
              placeholder="홍길동" className={inputClass(checks.username)} />
            {hint(checks.username, '사용 가능한 이름입니다.', '이미 사용 중인 이름입니다.')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">이메일</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="example@email.com" className={inputClass(checks.email)} />
            {hint(checks.email, '사용 가능한 이메일입니다.', '이미 사용 중인 이메일입니다.')}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">비밀번호</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                placeholder="6자 이상 입력" className={`${inputClass(checks.password)} pr-10`} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {hint(checks.password, '사용 가능한 비밀번호입니다.', '6자 이상 입력해주세요.')}
          </div>
          {message && (
            <div className="text-sm text-center px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {message}
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-lg transition-colors">
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-green-500 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}
