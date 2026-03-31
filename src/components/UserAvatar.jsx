// 프로필 이미지가 있으면 이미지, 없으면 이니셜 아바타를 보여주는 공통 컴포넌트
export default function UserAvatar({ profileImageUrl, username, size = 8 }) {
  const sizeClass = `w-${size} h-${size}`;
  const textSizeClass = size <= 6 ? 'text-xs' : size <= 8 ? 'text-sm' : 'text-base';

  if (profileImageUrl) {
    return (
      <img
        src={`http://localhost:8080${profileImageUrl}`}
        alt={username}
        className={`${sizeClass} rounded-full object-cover border border-gray-200 shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-500 ${textSizeClass} shrink-0`}>
      {username?.[0] ?? '?'}
    </div>
  );
}
