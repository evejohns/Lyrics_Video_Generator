import { Link } from 'react-router-dom';
import { Plus, Music, Clock, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { projectsApi } from '../lib/api';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Project {
  id: string;
  title: string;
  artist: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response: any = await projectsApi.getAll();
      setProjects(response.data.items || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await projectsApi.delete(id);
      toast.success('Project deleted');
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && projects.length === 0 && (
          <div className="card p-12 text-center">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-gray-400 mb-6">Create your first lyric video to get started</p>
            <Link to="/project/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Project
            </Link>
          </div>
        )}

        {/* Project List */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card hover:border-primary-500 transition-colors">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
                      <p className="text-sm text-gray-400">{project.artist}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(project.id);
                      }}
                      className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'completed'
                          ? 'bg-green-500/10 text-green-500'
                          : project.status === 'processing'
                          ? 'bg-yellow-500/10 text-yellow-500'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <Link
                    to={`/project/${project.id}`}
                    className="mt-4 btn-primary w-full text-center block"
                  >
                    Open Project
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
