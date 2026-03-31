import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import BoardListPage from '../components/BoardListPage';

export default function SupportPage() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    authFetch('/api/boards/group/SUPPORT')
      .then(r => r.ok ? r.json() : [])
      .then(setBoards);
  }, []);

  if (boards.length === 0) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-400">로딩 중...</div>;
  }

  return (
    <BoardListPage
      groupKey="SUPPORT"
      groupLabel="고객센터"
      groupEmoji="🎧"
      boards={boards}
      basePath="/support"
    />
  );
}
