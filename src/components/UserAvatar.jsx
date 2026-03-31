// 프로필 이미지가 있으면 이미지, 없으면 이니셜 아바타를 보여주는 공통 컴포넌트
import { useState } from 'react';

const SIZE_MAP = {
  6:  { box: 'w-6 h-6',   text: 'text-xs' },
  7:  { box: 'w-7 h-7',   text: 'text-xs' },
  8:  { box: 'w-8 h-8',   text: 'text-sm' },
  10: { box: 'w-10 h-10', text: 'text-sm' },
  12: { box: 'w-12 h-12', text: 'text-base' },
  16: { box: 'w-16 h-16', text: 'text-xl' },
};

export default function UserAvatar({ profileImageUrl, username, size = 8 }) {
  const [imgError, setImgError] = useState(false);
  const { box, text } = SIZE_MAP[size] ?? SIZE_MAP[8];

  if (profileImageUrl && !imgError) {
    return (
      <img
        src={`http://localhost:8080${profileImageUrl}`}
        alt={username}
        className={`${box} rounded-full object-cover border border-gray-200 shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${box} rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-500 ${text} shrink-0`}>
      {username?.[0] ?? '?'}
    </div>
  );
}
