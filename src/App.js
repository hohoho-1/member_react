import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';
import ForbiddenPage from './pages/ForbiddenPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import BoardPage from './pages/BoardPage';
import CommunityPage from './pages/CommunityPage';
import SupportPage from './pages/SupportPage';
import PostDetailPage from './pages/PostDetailPage';
import PostWritePage from './pages/PostWritePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Layout><HomePage /></Layout>} />
        <Route path="/mypage" element={<Layout><MyPage /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPage /></Layout>} />
        <Route path="/admin/users/:id" element={<Layout><AdminUserDetailPage /></Layout>} />
        <Route path="/forbidden" element={<Layout><ForbiddenPage /></Layout>} />

        {/* 기존 /board는 자유게시판으로 redirect (하위 호환) */}
        <Route path="/board" element={<Navigate to="/community?scope=FREE" replace />} />

        {/* 커뮤니티 그룹 */}
        <Route path="/community" element={<Layout><CommunityPage /></Layout>} />

        {/* 고객센터 그룹 */}
        <Route path="/support" element={<Layout><SupportPage /></Layout>} />

        {/* 게시글 상세/작성/수정 - 공유 */}
        <Route path="/board/write" element={<Layout><PostWritePage /></Layout>} />
        <Route path="/board/:id" element={<Layout><PostDetailPage /></Layout>} />
        <Route path="/board/:id/edit" element={<Layout><PostWritePage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
