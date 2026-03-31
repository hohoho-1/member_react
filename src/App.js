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
import PostDetailPage from './pages/PostDetailPage';
import PostWritePage from './pages/PostWritePage';

// 로그인/회원가입은 Layout 없이, 나머지는 Layout 적용
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
        <Route path="/board" element={<Layout><BoardPage /></Layout>} />
        <Route path="/board/write" element={<Layout><PostWritePage /></Layout>} />
        <Route path="/board/:id" element={<Layout><PostDetailPage /></Layout>} />
        <Route path="/board/:id/edit" element={<Layout><PostWritePage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
