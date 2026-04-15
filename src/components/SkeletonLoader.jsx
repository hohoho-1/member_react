/**
 * SkeletonLoader — 재사용 가능한 스켈레톤 UI 컴포넌트 모음
 *
 * 사용 예시:
 *   import { SkeletonCard, SkeletonList, SkeletonTable } from '../components/SkeletonLoader';
 *
 *   {loading ? <SkeletonCard count={6} /> : <실제컴포넌트 />}
 */

// 기본 shimmer 애니메이션 박스
const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─────────────────────────────────────────────
// 강의 카드 스켈레톤 (CourseListPage용)
// ─────────────────────────────────────────────
export const SkeletonCourseCard = () => (
  <div className="bg-white rounded-2xl shadow overflow-hidden">
    {/* 썸네일 */}
    <Shimmer className="w-full h-44" />
    <div className="p-4 space-y-2">
      {/* 제목 */}
      <Shimmer className="h-4 w-3/4" />
      <Shimmer className="h-3 w-1/2" />
      {/* 날짜/강사 */}
      <div className="flex gap-2 pt-1">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-16" />
      </div>
      {/* 하단 버튼 영역 */}
      <div className="flex justify-between items-center pt-2">
        <Shimmer className="h-5 w-12 rounded-full" />
        <Shimmer className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  </div>
);

export const SkeletonCourseGrid = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCourseCard key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// 게시글 목록 스켈레톤 (BoardListPage용)
// ─────────────────────────────────────────────
export const SkeletonPostRow = () => (
  <div className="px-5 py-3.5 flex items-center gap-3">
    <Shimmer className="h-4 w-4 shrink-0 rounded" />
    <div className="flex-1 space-y-1.5">
      <div className="flex items-center gap-2">
        <Shimmer className="h-3.5 w-14 rounded-full" />
        <Shimmer className="h-3.5 w-48" />
      </div>
      <div className="flex gap-3">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3 w-12" />
        <Shimmer className="h-3 w-10" />
      </div>
    </div>
  </div>
);

export const SkeletonPostList = ({ count = 8 }) => (
  <div className="bg-white rounded-2xl shadow overflow-hidden divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonPostRow key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// 마이페이지 탭 스켈레톤 (범용 리스트)
// ─────────────────────────────────────────────
export const SkeletonMyPageRow = () => (
  <div className="px-6 py-4 flex items-center gap-4">
    <Shimmer className="w-10 h-10 rounded-full shrink-0" />
    <div className="flex-1 space-y-2">
      <Shimmer className="h-4 w-3/5" />
      <Shimmer className="h-3 w-2/5" />
    </div>
    <Shimmer className="h-7 w-16 rounded-lg shrink-0" />
  </div>
);

export const SkeletonMyPageList = ({ count = 4 }) => (
  <div className="bg-white rounded-2xl shadow overflow-hidden divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonMyPageRow key={i} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// 강의 상세 페이지 스켈레톤
// ─────────────────────────────────────────────
export const SkeletonCourseDetail = () => (
  <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
    {/* 상단 헤더 */}
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <Shimmer className="h-7 w-2/3" />
      <div className="flex gap-3">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-4 w-20" />
      </div>
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-5/6" />
    </div>
    {/* 커리큘럼 */}
    <div className="bg-white rounded-2xl shadow p-6 space-y-3">
      <Shimmer className="h-5 w-32 mb-4" />
      {[80, 70, 90, 65].map((w, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Shimmer className="w-8 h-8 rounded-lg shrink-0" />
          <Shimmer className={`h-4 w-${w > 80 ? '1/2' : w > 70 ? '2/5' : '3/5'}`} />
        </div>
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 전체 페이지 로딩 스켈레톤 (페이지 진입 시)
// ─────────────────────────────────────────────
export const SkeletonPage = () => (
  <div className="bg-gray-100 dark:bg-gray-900 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
    <div className="text-center space-y-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
      <p className="text-sm text-gray-400">불러오는 중...</p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// 마이페이지 전체 스켈레톤 (user 로딩 전)
// ─────────────────────────────────────────────
export const SkeletonMyPage = () => (
  <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4">
    <div className="max-w-6xl mx-auto">
      {/* 헤더 타이틀 */}
      <Shimmer className="h-7 w-40 mb-6" />

      {/* 프로필 카드 */}
      <div className="bg-white rounded-2xl shadow mb-4 p-5">
        <div className="flex items-center gap-4">
          <Shimmer className="w-16 h-16 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-48" />
            <div className="flex gap-4 pt-1">
              <Shimmer className="h-3 w-28" />
              <Shimmer className="h-3 w-36" />
              <Shimmer className="h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Shimmer className="h-8 w-20 rounded-lg" />
            <Shimmer className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white rounded-2xl shadow mb-4 flex overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-1 py-3 px-2 flex justify-center">
            <Shimmer className="h-4 w-full rounded" />
          </div>
        ))}
      </div>

      {/* 콘텐츠 */}
      <SkeletonMyPageList count={5} />
    </div>
  </div>
);
