import { useEffect } from 'react';

const BASE_TITLE = 'GetSmart';

/**
 * 페이지별 document.title 설정
 * usePageTitle('강의 목록') → "강의 목록 | GetSmart"
 * usePageTitle() → "GetSmart"
 */
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [title]);
}
