import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages (to be created)
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import NewProjectPage from './pages/NewProject';
import ProjectEditorPage from './pages/ProjectEditor';
import TemplatesPage from './pages/Templates';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-dark-900">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/project/new"
          element={isAuthenticated ? <NewProjectPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/project/:id"
          element={isAuthenticated ? <ProjectEditorPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/templates"
          element={isAuthenticated ? <TemplatesPage /> : <Navigate to="/login" />}
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
