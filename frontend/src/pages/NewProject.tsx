import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AudioUploader from '../components/AudioUploader';
import Waveform from '../components/Waveform';
import { projectsApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function NewProject() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [step, setStep] = useState<'upload' | 'details'>('upload');
  const [audioData, setAudioData] = useState<{
    file: File;
    url: string;
    duration: number;
    metadata: any;
  } | null>(null);
  const [projectData, setProjectData] = useState({
    title: '',
    artist: '',
  });
  const [creating, setCreating] = useState(false);

  const handleAudioUpload = (data: {
    file: File;
    url: string;
    duration: number;
    metadata: any;
  }) => {
    setAudioData(data);
    setProjectData({
      title: data.metadata.title || '',
      artist: data.metadata.artist || '',
    });
    setStep('details');
  };

  const handleCreateProject = async () => {
    if (!audioData) return;

    setCreating(true);
    try {
      // First, upload the audio file to the backend
      const formData = new FormData();
      formData.append('audio', audioData.file);

      const uploadResponse = await fetch('http://localhost:3000/api/audio/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file');
      }

      const uploadData = await uploadResponse.json();

      // Create the project with the uploaded audio URL
      const projectResponse: any = await projectsApi.create({
        title: projectData.title,
        artist: projectData.artist,
        audioUrl: uploadData.data.url,
        durationSeconds: Math.round(audioData.duration),
        config: {
          template: 'classic-black',
          fontSize: 48,
          fontFamily: 'Inter',
          animation: 'fade',
        },
        status: 'draft',
      });

      toast.success('Project created successfully!');
      navigate(`/project/${projectResponse.data.id}`);
    } catch (error: any) {
      console.error('Failed to create project:', error);
      toast.error(error?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-display font-bold">New Project</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 'upload'
                  ? 'bg-primary-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {step === 'upload' ? '1' : '✓'}
            </div>
            <span className={step === 'upload' ? 'font-semibold' : 'text-gray-400'}>
              Upload Audio
            </span>
          </div>

          <div className="flex-1 h-px bg-gray-700" />

          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                step === 'details'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              2
            </div>
            <span className={step === 'details' ? 'font-semibold' : 'text-gray-400'}>
              Project Details
            </span>
          </div>
        </div>

        {/* Step 1: Upload Audio */}
        {step === 'upload' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Upload Your Audio</h2>
            <p className="text-gray-400 mb-6">
              Start by uploading the audio file for your lyric video
            </p>
            <AudioUploader onUploadComplete={handleAudioUpload} />
          </div>
        )}

        {/* Step 2: Project Details */}
        {step === 'details' && audioData && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Project Details</h2>
              <p className="text-gray-400 mb-6">
                Configure your project settings
              </p>
            </div>

            {/* Audio Preview */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Audio Preview</h3>
              <Waveform audioUrl={audioData.url} />
            </div>

            {/* Project Form */}
            <div className="card p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) =>
                    setProjectData({ ...projectData, title: e.target.value })
                  }
                  className="input"
                  placeholder="Enter song title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Artist <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectData.artist}
                  onChange={(e) =>
                    setProjectData({ ...projectData, artist: e.target.value })
                  }
                  className="input"
                  placeholder="Enter artist name"
                  required
                />
              </div>

              {/* Metadata Info */}
              <div className="bg-gray-900/50 rounded-lg p-4 text-sm">
                <h4 className="font-semibold mb-2">Audio Information</h4>
                <div className="space-y-1 text-gray-400">
                  <p>Duration: {Math.floor(audioData.duration / 60)}:{Math.floor(audioData.duration % 60).toString().padStart(2, '0')}</p>
                  {audioData.metadata.album && <p>Album: {audioData.metadata.album}</p>}
                  {audioData.metadata.year && <p>Year: {audioData.metadata.year}</p>}
                  {audioData.metadata.genre && <p>Genre: {audioData.metadata.genre}</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('upload')}
                className="btn-ghost"
                disabled={creating}
              >
                Back
              </button>
              <button
                onClick={handleCreateProject}
                className="btn-primary flex items-center gap-2"
                disabled={!projectData.title || !projectData.artist || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
