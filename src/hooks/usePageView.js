import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

// 경로 → 사람이 읽기 좋은 페이지명 매핑
const PAGE_NAMES = {
  '/':                    '홈',
  '/home':                '홈',
  '/community':           '커뮤니티',
  '/support':             '고객센터',
  '/schedule':            '일정',
  '/courses':             '강의 목록',
  '/mypage':              '마이페이지',
  '/login':               '로그인',
  '/signup':              '회원가입',
  '/search':              '통합검색',
  '/admin':               '관리자',
  '/courses/admin':       '강의 관리',
};

function getPageName(pathname) {
  // 정확히 매핑된 경로 우선
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];

  // 상세 페이지는 path 자체를 이름으로 사용 (집계 후 링크로 활용)
  if (/^\/courses\/\d+\/lessons\/\d+/.test(pathname)) return pathname; // 강의 수강
  if (/^\/courses\/\d+/.test(pathname))               return pathname; // 강의 상세
  if (/^\/board\/\d+\/edit/.test(pathname))           return pathname; // 게시글 수정
  if (/^\/board\/\d+/.test(pathname))                 return pathname; // 게시글 상세
  if (/^\/board\/write/.test(pathname))               return '게시글 작성';
  if (/^\/courses\/certificates\/verify/.test(pathname)) return '수료증 검증';

  return pathname;
}

let lastPath = null; // 중복 전송 방지

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // 같은 경로 중복 전송 방지
    if (path === lastPath) return;
    lastPath = path;

    // 관리자 페이지 내부 탭 변경은 기록 안 함
    if (path === '/admin') return;

    const pageName = getPageName(path);

    // fire-and-forget (실패해도 무관)
    authFetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, pageName }),
    }).catch(() => {});
  }, [location.pathname]);
}
