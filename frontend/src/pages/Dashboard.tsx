import { Link } from 'react-router-dom';
import { Plus, Music } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-display font-bold">Lyric Video Generator</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {user?.name} ({user?.plan})
            </span>
            <button onClick={logout} className="btn-ghost">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-display font-bold">My Projects</h1>
          <Link to="/project/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {/* Empty State */}
        <div className="card p-12 text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
          <p className="text-gray-400 mb-6">Create your first lyric video to get started</p>
          <Link to="/project/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Project
          </Link>
        </div>

        {/* Project List - TODO: Add real data */}
      </main>
    </div>
  );
}
