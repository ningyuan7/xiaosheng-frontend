import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import CreatePage from "./pages/CreatePage";
import LearningPage from "./pages/LearningPage";
import ProfilePage from "./pages/ProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CampusHomePage from './pages/campus/CampusHomePage';
import CampusCreatePage from './pages/campus/CampusCreatePage';
import CampusOpinionPage from './pages/campus/CampusOpinionPage';
import CampusAccountPage from './pages/campus/CampusAccountPage';
import CampusNotificationsPage from './pages/campus/CampusNotificationsPage';
import CampusAdminPage from './pages/campus/CampusAdminPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CampusHomePage />} />
      <Route path="/search" element={<CampusHomePage />} />
      <Route path="/create" element={<CampusCreatePage />} />
      <Route path="/campus/topics/:id" element={<CampusHomePage />} />
      <Route path="/campus/opinions/:id" element={<CampusOpinionPage />} />
      <Route path="/campus/account" element={<CampusAccountPage />} />
      <Route path="/campus/notifications" element={<CampusNotificationsPage />} />
      <Route path="/campus/admin" element={<CampusAdminPage />} />
      <Route path="/library" element={<HomePage />} />
      <Route path="/library/search" element={<SearchPage />} />
      <Route path="/library/create" element={<CreatePage />} />
      <Route path="/learn" element={<LearningPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/edit" element={<EditProfilePage />} />
      <Route path="/post/:id" element={<CourseDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
