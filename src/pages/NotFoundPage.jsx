import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-lg w-96 text-center">
        <div className="text-7xl mb-4">🗺️</div>
        <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">404</h2>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">페이지를 찾을 수 없습니다</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
            ← 뒤로가기
          </button>
          <button onClick={() => navigate('/home')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
            🏠 홈으로
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">{count}초 후 홈으로 이동합니다...</p>
      </div>
    </div>
  );
}
