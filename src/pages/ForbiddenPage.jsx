import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(timer); navigate('/home'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-96 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-500 text-sm mb-6">이 페이지는 관리자만 접근할 수 있습니다.</p>
        <button onClick={() => navigate('/home')}
          className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
          ← 홈으로 돌아가기
        </button>
        <p className="text-xs text-gray-400 mt-4">{count}초 후 자동으로 이동합니다...</p>
      </div>
    </div>
  );
}
