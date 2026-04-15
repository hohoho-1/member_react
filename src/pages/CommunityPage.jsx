import { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import BoardListPage from '../components/BoardListPage';
import { SkeletonPage } from '../components/SkeletonLoader';

export default function CommunityPage() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    authFetch('/api/boards/group/COMMUNITY')
      .then(r => r.ok ? r.json() : [])
      .then(setBoards);
  }, []);

  if (boards.length === 0) {
    return <SkeletonPage />;
  }

  return (
    <BoardListPage
      groupKey="COMMUNITY"
      groupLabel="커뮤니티"
      groupEmoji="💬"
      boards={boards}
      basePath="/community"
    />
  );
}
