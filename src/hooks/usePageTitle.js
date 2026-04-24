import { useEffect } from 'react';

const BASE_TITLE = 'GetSmart';

/**
 * 페이지별 document.title 설정 — depth 지원
 *
 * usePageTitle()                     → "GetSmart"
 * usePageTitle('강의 목록')           → "강의 목록 | GetSmart"
 * usePageTitle('자유게시판', '커뮤니티') → "자유게시판 | 커뮤니티 | GetSmart"
 * usePageTitle(null, '커뮤니티')       → "커뮤니티 | GetSmart"  (탭 미선택)
 */
export function usePageTitle(subTitle, parentTitle) {
  useEffect(() => {
    const parts = [subTitle, parentTitle, BASE_TITLE].filter(Boolean);
    document.title = parts.join(' | ');
    return () => { document.title = BASE_TITLE; };
  }, [subTitle, parentTitle]);
}
