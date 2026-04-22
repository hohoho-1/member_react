import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function CertificateVerifyPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses/certificates/verify/${code}`);
        if (res.ok) {
          setCert(await res.json());
        } else {
          setError('유효하지 않은 수료증 코드입니다.');
        }
      } catch {
        setError('서버 연결에 실패했습니다.');
      }
      setLoading(false);
    };
    if (code) verify();
  }, [code]);

  const formatStudyTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}시간 ${m}분`;
    return `${m}분`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/mypage?tab=certificates')}
            className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors mb-4 block mx-auto">
            ← 뒤로가기
          </button>
          <h1 className="text-xl font-bold text-gray-700 dark:text-gray-200">🔍 수료증 검증</h1>
          <p className="text-xs text-gray-400 mt-1">수료증 코드의 진위 여부를 확인합니다</p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center">
            <div className="text-4xl mb-3 animate-pulse">🔍</div>
            <p className="text-gray-400 text-sm">검증 중...</p>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-lg font-bold text-red-500 mb-2">검증 실패</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button onClick={() => navigate('/courses')}
              className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors">
              강의 목록 보기
            </button>
          </div>
        ) : cert && (
          <>
            {/* 수료증 카드 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              {/* 상단 배너 */}
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-5 text-white text-center">
                <div className="text-4xl mb-2">🎓</div>
                <h2 className="text-lg font-bold">수료증</h2>
                <p className="text-xs text-indigo-100 mt-0.5">Certificate of Completion</p>
              </div>

              {/* 수료 내용 */}
              <div className="px-6 py-6">
                {/* 유효 확인 배지 */}
                <div className="flex items-center justify-center gap-2 mb-5 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <span className="text-green-500 text-lg">✅</span>
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">유효한 수료증입니다</span>
                </div>

                {/* 수료자 정보 */}
                <div className="text-center mb-5">
                  <p className="text-xs text-gray-400 mb-1">수료자</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{cert.username}</p>
                </div>

                {/* 강의 정보 */}
                <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 space-y-3 mb-5">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-400 shrink-0">강의명</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white text-right ml-4">{cert.courseTitle}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">발급일</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(cert.issuedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">총 학습시간</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{formatStudyTime(cert.totalStudySeconds)}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-gray-400 shrink-0">수료증 코드</span>
                    <span className="text-xs text-gray-400 font-mono text-right ml-4 break-all">{cert.code}</span>
                  </div>
                </div>

                {/* 강의 바로가기 */}
                <button
                  onClick={() => navigate(`/courses/${cert.courseId}`)}
                  className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
                  강의 보기
                </button>
              </div>
            </div>

            {/* 안내 문구 */}
            <p className="text-center text-xs text-gray-400 mt-4">
              이 수료증은 시스템에 의해 자동 발급되었으며, 코드로 진위 확인이 가능합니다.
            </p>
          </>
        )}

        {/* 코드 직접 입력 */}
        {!loading && (
          <div className="mt-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-xl p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">다른 수료증 코드 확인</p>
            <CodeVerifyForm />
          </div>
        )}
      </div>
    </div>
  );
}

function CodeVerifyForm() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');

  const handleVerify = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    navigate(`/courses/certificates/verify/${trimmed}`);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleVerify(); }}
        placeholder="수료증 코드 입력"
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-400"
      />
      <button
        onClick={handleVerify}
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
        확인
      </button>
    </div>
  );
}
