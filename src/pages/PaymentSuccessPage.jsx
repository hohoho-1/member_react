import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { useToastContext } from '../context/ToastContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToastContext();
  const [status, setStatus] = useState('loading'); // loading | done | error

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    const confirm = async () => {
      const res = await authFetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      if (res.ok) {
        setStatus('done');
        success('결제 및 수강 신청이 완료되었습니다!');
      } else {
        const err = await res.json().catch(() => ({}));
        setStatus('error');
        error(err.message || '결제 승인에 실패했습니다.');
      }
    };

    if (paymentKey && orderId && amount) confirm();
    else setStatus('error');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">⏳</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">결제 처리 중...</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">잠시만 기다려 주세요.</p>
          </>
        )}
        {status === 'done' && (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">결제 완료!</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">수강 신청이 완료되었습니다.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/courses')}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                강의 목록으로
              </button>
              <button
                onClick={() => navigate('/mypage?tab=courses')}
                className="w-full py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                내 수강 현황 보기
              </button>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-5xl mb-4">❌</div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white mb-2">결제 실패</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">결제 승인 중 문제가 발생했습니다.</p>
            <button
              onClick={() => navigate(-1)}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
