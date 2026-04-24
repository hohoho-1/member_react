/**
 * CourseThumbnail — 썸네일 이미지 없을 때 카테고리/제목 기반 그라데이션 placeholder 표시
 * Props:
 *   thumbnailUrl : string | null
 *   title        : string  (강의명 — 이니셜 표시용)
 *   category     : string | null (ex. '개발', '디자인', ...)
 *   className    : string  (컨테이너에 추가할 Tailwind 클래스)
 *   imgClassName : string  (img 태그에 추가할 클래스, 기본 object-cover)
 */

const GRADIENTS = [
  'from-blue-400 to-indigo-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500',
  'from-orange-400 to-rose-500',
  'from-cyan-400 to-blue-500',
  'from-fuchsia-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-lime-400 to-green-500',
];

const CATEGORY_MAP = {
  '개발':    'from-blue-400 to-indigo-500',
  '프로그래밍': 'from-blue-400 to-indigo-500',
  '디자인':  'from-fuchsia-400 to-pink-500',
  '데이터':  'from-cyan-400 to-blue-500',
  '마케팅':  'from-orange-400 to-rose-500',
  '경영':    'from-amber-400 to-orange-500',
  '어학':    'from-emerald-400 to-teal-500',
  '취업':    'from-violet-400 to-purple-500',
  '기타':    'from-lime-400 to-green-500',
};

/** 제목 문자열로 그라데이션 결정 (카테고리 없을 때 fallback) */
function pickGradient(title = '') {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) & 0xffff;
  return GRADIENTS[hash % GRADIENTS.length];
}

/** 강의 제목에서 이니셜(최대 2글자) 추출 */
function toInitial(title = '') {
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (title[0] || '?').toUpperCase();
}

export default function CourseThumbnail({
  thumbnailUrl,
  title = '',
  category = '',
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-cover',
}) {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={title} className={imgClassName} />;
  }

  const gradient = CATEGORY_MAP[category] || pickGradient(title);
  const initial = toInitial(title);

  return (
    <div className={`${className} bg-gradient-to-br ${gradient} flex flex-col items-center justify-center select-none`}>
      <span className="text-white font-bold text-2xl leading-none opacity-90">{initial}</span>
      {category && (
        <span className="text-white/70 text-[10px] mt-1 font-medium tracking-wide uppercase">{category}</span>
      )}
    </div>
  );
}
