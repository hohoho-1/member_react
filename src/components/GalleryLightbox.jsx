import { useEffect, useCallback, useState } from 'react';
import { authFetch } from '../utils/authFetch';

/**
 * 갤러리 라이트박스
 * - 게시글 간 이동 (‹ ›  외부)
 * - 게시글 내 이미지 간 이동 (‹ › 내부 / 하단 썸네일)
 */
export default function GalleryLightbox({ posts, index, onClose, onNavigate, onGoDetail, allowComment }) {
  const isOpen  = index !== null && index !== undefined;
  const post    = isOpen ? posts[index] : null;
  const hasPrevPost = isOpen && index > 0;
  const hasNextPost = isOpen && index < posts.length - 1;

  // 게시글 내 이미지 목록
  const [images, setImages]       = useState([]);   // { id, url, name }
  const [imgIndex, setImgIndex]   = useState(0);
  const [imgLoading, setImgLoading] = useState(false);

  const hasPrevImg = imgIndex > 0;
  const hasNextImg = imgIndex < images.length - 1;

  // 게시글 변경 시 이미지 목록 로드
  useEffect(() => {
    if (!isOpen || !post) { setImages([]); setImgIndex(0); return; }
    setImgLoading(true);
    setImgIndex(0);
    authFetch(`/api/posts/${post.id}/files`)
      .then(r => r.ok ? r.json() : [])
      .then(files => {
        const imgs = files
          .filter(f => f.image)
          .map(f => ({ id: f.id, url: `http://localhost:8080${f.downloadUrl}`, name: f.originalName }));
        // 이미지 첨부파일이 없으면 thumbnailUrl 폴백
        if (imgs.length === 0 && post.thumbnailUrl) {
          setImages([{ id: 0, url: `http://localhost:8080${post.thumbnailUrl}`, name: post.title }]);
        } else {
          setImages(imgs);
        }
      })
      .finally(() => setImgLoading(false));
  }, [isOpen, post?.id]);

  // 키보드
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { onClose(); return; }
    // Shift+← → 게시글 간 이동
    if (e.shiftKey) {
      if (e.key === 'ArrowLeft'  && hasPrevPost) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && hasNextPost) onNavigate(index + 1);
    } else {
      // ← → 이미지 간 이동
      if (e.key === 'ArrowLeft'  && hasPrevImg) setImgIndex(i => i - 1);
      if (e.key === 'ArrowRight' && hasNextImg) setImgIndex(i => i + 1);
    }
  }, [isOpen, index, hasPrevPost, hasNextPost, hasPrevImg, hasNextImg, onClose, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const currentImage = images[imgIndex] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col max-w-3xl w-full mx-4"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/70 rounded-t-2xl">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-white text-sm font-medium truncate">{post.title}</p>
            {images.length > 1 && (
              <p className="text-gray-400 text-xs mt-0.5">
                이미지 {imgIndex + 1} / {images.length}
                {images.length > 1 && <span className="ml-1 opacity-60">(← → 로 이동)</span>}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* 게시글 간 이동 표시 */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => hasPrevPost && onNavigate(index - 1)}
                disabled={!hasPrevPost}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors">
                ◀ 이전 글
              </button>
              <span className="text-gray-500 text-xs">{index + 1}/{posts.length}</span>
              <button
                onClick={() => hasNextPost && onNavigate(index + 1)}
                disabled={!hasNextPost}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors">
                다음 글 ▶
              </button>
            </div>
            <button
              onClick={() => onGoDetail(post.id)}
              className="px-3 py-1 bg-purple-500/80 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors">
              상세보기 →
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors">
              ✕
            </button>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className="relative bg-black flex items-center justify-center" style={{ minHeight: '55vh' }}>
          {imgLoading ? (
            <div className="text-gray-500 text-sm animate-pulse">이미지를 불러오는 중...</div>
          ) : currentImage ? (
            <img
              key={currentImage.id}
              src={currentImage.url}
              alt={currentImage.name}
              className="max-w-full object-contain select-none"
              style={{ maxHeight: '55vh' }}
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500 py-20">
              <span className="text-6xl mb-3">🖼️</span>
              <span className="text-sm">이미지가 없습니다</span>
            </div>
          )}

          {/* 이미지 내 이전/다음 버튼 */}
          {hasPrevImg && (
            <button
              onClick={() => setImgIndex(i => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full text-2xl transition-colors">
              ‹
            </button>
          )}
          {hasNextImg && (
            <button
              onClick={() => setImgIndex(i => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/80 text-white rounded-full text-2xl transition-colors">
              ›
            </button>
          )}
        </div>

        {/* 하단 정보 바 */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/70 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <span>✍️ {post.authorName}</span>
            <span>📅 {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>👁️ {post.viewCount}</span>
          </div>
          <div className="flex items-center gap-3">
            {post.likeCount > 0 && <span>❤️ {post.likeCount}</span>}
            {allowComment && post.commentCount > 0 && <span>💬 {post.commentCount}</span>}
          </div>
        </div>

        {/* 하단 이미지 썸네일 (이미지 2장 이상일 때만) */}
        {images.length > 1 && (
          <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 justify-center bg-black/40 rounded-b-2xl px-3 py-2">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setImgIndex(i)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === imgIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* 하단 게시글 썸네일 (이미지 1장일 때 게시글 네비) */}
        {images.length <= 1 && posts.length > 1 && (
          <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 justify-center bg-black/40 rounded-b-2xl px-3 py-2">
            {posts.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onNavigate(i)}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}>
                {p.thumbnailUrl ? (
                  <img src={`http://localhost:8080${p.thumbnailUrl}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-lg">🖼️</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
