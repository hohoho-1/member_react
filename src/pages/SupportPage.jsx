import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import BoardListPage from '../components/BoardListPage';
import { SkeletonPage } from '../components/SkeletonLoader';

export default function SupportPage() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    authFetch('/api/boards/group/SUPPORT')
      .then(r => r.ok ? r.json() : [])
      .then(setBoards);
  }, []);

  if (boards.length === 0) {
    return <SkeletonPage />;
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
