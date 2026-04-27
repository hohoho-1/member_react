import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentFailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const message = searchParams.get('message') || '결제가 취소되었습니다.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">😢</div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">결제 실패</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
          돌아가기
        </button>
      </div>
    </div>
  );
}
