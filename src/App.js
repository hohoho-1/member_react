import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';
import ForbiddenPage from './pages/ForbiddenPage';
import AdminUserDetailPage from './pages/AdminUserDetailPage';
import SearchPage from './pages/SearchPage';
import CommunityPage from './pages/CommunityPage';
import SupportPage from './pages/SupportPage';
import PostDetailPage from './pages/PostDetailPage';
import PostWritePage from './pages/PostWritePage';
import SchedulePage from './pages/SchedulePage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseLessonPage from './pages/CourseLessonPage';
import CourseAdminPage from './pages/CourseAdminPage';
import CourseCurriculumPage from './pages/CourseCurriculumPage';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import MessagePage from './pages/MessagePage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 루트: 홈으로 */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* 공개 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<Layout><HomePage /></Layout>} />
          <Route path="/forbidden" element={<Layout><ForbiddenPage /></Layout>} />

          {/* 게시판: 비로그인도 열람 가능 */}
          <Route path="/community" element={<Layout><CommunityPage /></Layout>} />
          <Route path="/support" element={<Layout><SupportPage /></Layout>} />
          <Route path="/board/:id" element={<Layout><PostDetailPage /></Layout>} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          <Route path="/schedule" element={<Layout><SchedulePage /></Layout>} />

          {/* 강의: 비로그인도 목록/상세 열람 가능 */}
          <Route path="/courses" element={<Layout><CourseListPage /></Layout>} />
          <Route path="/courses/:courseId" element={<Layout><CourseDetailPage /></Layout>} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<PrivateRoute><Layout><CourseLessonPage /></Layout></PrivateRoute>} />
          <Route path="/courses/admin" element={<PrivateRoute><Layout><CourseAdminPage /></Layout></PrivateRoute>} />
          <Route path="/courses/admin/:courseId/curriculum" element={<PrivateRoute><Layout><CourseCurriculumPage /></Layout></PrivateRoute>} />
          <Route path="/courses/certificates/verify/:code" element={<Layout><CertificateVerifyPage /></Layout>} />

          {/* 하위호환 리다이렉트 */}
          <Route path="/board" element={<Navigate to="/community?scope=FREE" replace />} />

          {/* 글쓰기/수정: 로그인 필요 */}
          <Route path="/board/write" element={<PrivateRoute><Layout><PostWritePage /></Layout></PrivateRoute>} />
          <Route path="/board/:id/edit" element={<PrivateRoute><Layout><PostWritePage /></Layout></PrivateRoute>} />

          {/* 마이페이지: 로그인 필요 */}
          <Route path="/mypage" element={<PrivateRoute><Layout><MyPage /></Layout></PrivateRoute>} />

          {/* 쪽지함: 로그인 필요 */}
          <Route path="/messages" element={<PrivateRoute><Layout><MessagePage /></Layout></PrivateRoute>} />

          {/* 관리자: 로그인 필요 */}
          <Route path="/admin" element={<PrivateRoute><Layout><AdminPage /></Layout></PrivateRoute>} />
          <Route path="/admin/users/:id" element={<PrivateRoute><Layout><AdminUserDetailPage /></Layout></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
