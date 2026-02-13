import { useState, useEffect } from 'react';
import { X, Download, Loader2, CheckCircle, AlertCircle, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
}

interface ExportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  file_url?: string;
  thumbnail_url?: string;
}

type PresetSize = {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  aspectRatio: string;
  resolution: '480p' | '720p' | '1080p' | '4k';
};

const PRESET_SIZES: PresetSize[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Landscape 1920×1080',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    resolution: '1080p',
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    description: 'Vertical 1080×1920',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    resolution: '1080p',
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reel',
    description: 'Vertical 1080×1920',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    resolution: '1080p',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Vertical 1080×1920',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    resolution: '1080p',
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    description: 'Square 1080×1080',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    resolution: '1080p',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Landscape 1920×1080',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    resolution: '1080p',
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Landscape 1280×720',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    resolution: '720p',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    description: 'Vertical 1080×1920',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    resolution: '1080p',
  },
];

export default function ExportModal({ isOpen, onClose, projectId, projectTitle }: ExportModalProps) {
  const token = useAuthStore((state) => state.token);
  const [selectedSize, setSelectedSize] = useState<PresetSize>(PRESET_SIZES[0]);
  const [format, setFormat] = useState<'mp4' | 'mov'>('mp4');
  const [generateThumbnail, setGenerateThumbnail] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [thumbnailOnly, setThumbnailOnly] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);

  // Poll for export status
  useEffect(() => {
    if (!exportJob || exportJob.status === 'completed' || exportJob.status === 'failed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/export/${exportJob.id}/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setExportJob(data.data);

          if (data.data.status === 'completed') {
            toast.success(thumbnailOnly ? 'Thumbnail generated!' : 'Video exported successfully!');
            setGeneratingThumbnail(false);
          } else if (data.data.status === 'failed') {
            toast.error(`${thumbnailOnly ? 'Thumbnail generation' : 'Export'} failed: ${data.data.error}`);
            setGeneratingThumbnail(false);
          }
        }
      } catch (error) {
        console.error('Failed to check export status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [exportJob]);

  const handleExport = async () => {
    setExporting(true);
    setThumbnailOnly(false);

    // Debug: Check if token exists
    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      setExporting(false);
      return;
    }

    console.log('Export request:', { projectId, resolution: selectedSize.resolution, format });
    console.log('Token exists:', !!token);

    try {
      const response = await fetch('http://localhost:3000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          resolution: selectedSize.resolution,
          format,
          generateThumbnail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to start export' }));
        console.error('Export failed with status:', response.status, errorData);

        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 400) {
          toast.error(`Invalid request: ${errorData.message || 'Please check your input'}`);
        } else {
          toast.error(errorData.message || 'Failed to start export');
        }
        setExporting(false);
        return;
      }

      const data = await response.json();
      setExportJob(data.data);
      toast.success('Export started! This may take a few minutes.');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to start export');
      setExporting(false);
    }
  };

  const handleGenerateThumbnail = async () => {
    setGeneratingThumbnail(true);
    setThumbnailOnly(true);

    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      setGeneratingThumbnail(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/export/thumbnail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate thumbnail' }));
        toast.error(errorData.message || 'Failed to generate thumbnail');
        setGeneratingThumbnail(false);
        return;
      }

      const data = await response.json();
      setExportJob(data.data);
      toast.success('Thumbnail generation started!');
    } catch (error) {
      console.error('Failed to generate thumbnail:', error);
      toast.error('Failed to generate thumbnail');
      setGeneratingThumbnail(false);
    }
  };

  const handleDownload = () => {
    if (!exportJob?.id) return;

    // Create a temporary link element and trigger download
    const downloadUrl = `http://localhost:3000/api/export/${exportJob.id}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', ''); // This triggers download behavior

    // Add authorization header by creating a fetch request and converting to blob
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download error:', error);
        toast.error('Failed to download file. Please try again.');
      });
  };

  const handleDownloadThumbnail = () => {
    if (!exportJob?.id) return;

    const downloadUrl = `http://localhost:3000/api/export/${exportJob.id}/thumbnail`;
    fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${projectTitle || 'thumbnail'}-thumbnail.jpg`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Thumbnail download error:', error);
        toast.error('Failed to download thumbnail.');
      });
  };

  const handleClose = () => {
    if (exportJob?.status === 'processing' || exportJob?.status === 'queued') {
      if (!confirm('Export is still in progress. Are you sure you want to close?')) {
        return;
      }
    }
    setExportJob(null);
    setExporting(false);
    setGeneratingThumbnail(false);
    setThumbnailOnly(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-xl border border-dark-700 max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Export Video</h2>
            <p className="text-sm text-gray-400 mt-1">{projectTitle}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {!exportJob ? (
            <>
              {/* Export Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Platform & Size</label>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                    {PRESET_SIZES.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedSize.id === size.id
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-semibold text-sm">{size.name}</div>
                          <div
                            className={`text-xs px-2 py-0.5 rounded ${
                              selectedSize.id === size.id
                                ? 'bg-primary-500 text-white'
                                : 'bg-dark-600 text-gray-400'
                            }`}
                          >
                            {size.aspectRatio}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">{size.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormat('mp4')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        format === 'mp4'
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">MP4</div>
                      <div className="text-xs text-gray-400">H.264 (Recommended)</div>
                    </button>
                    <button
                      onClick={() => setFormat('mov')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        format === 'mov'
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-semibold">MOV</div>
                      <div className="text-xs text-gray-400">QuickTime</div>
                    </button>
                  </div>
                </div>

                {/* Thumbnail Option */}
                <div>
                  <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-dark-700 hover:border-gray-600 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={generateThumbnail}
                      onChange={(e) => setGenerateThumbnail(e.target.checked)}
                      className="w-4 h-4 accent-primary-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Generate Thumbnail</div>
                      <div className="text-xs text-gray-400">
                        Create a 1280×720 thumbnail image (JPG)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Export Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-white mb-1">Export Information</p>
                    <ul className="space-y-1 text-gray-400">
                      <li>• Export time depends on video length and resolution</li>
                      <li>• You'll receive a download link when ready</li>
                      <li>• You can close this window during export</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleExport}
                  disabled={exporting || generatingThumbnail}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting Export...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Export Video
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerateThumbnail}
                  disabled={exporting || generatingThumbnail}
                  className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5"
                >
                  {generatingThumbnail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Thumbnail...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4" />
                      Generate Thumbnail Only
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Export Progress */}
              <div className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {exportJob.status === 'queued' && (
                    <>
                      <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                      <div>
                        <p className="font-medium">Queued</p>
                        <p className="text-sm text-gray-400">Waiting to start...</p>
                      </div>
                    </>
                  )}
                  {exportJob.status === 'processing' && (
                    <>
                      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                      <div>
                        <p className="font-medium">Processing</p>
                        <p className="text-sm text-gray-400">
                          {thumbnailOnly ? 'Generating your thumbnail...' : 'Rendering your video...'}
                        </p>
                      </div>
                    </>
                  )}
                  {exportJob.status === 'completed' && (
                    <>
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="font-medium text-green-500">Completed!</p>
                        <p className="text-sm text-gray-400">
                          {thumbnailOnly ? 'Your thumbnail is ready' : 'Your video is ready'}
                        </p>
                      </div>
                    </>
                  )}
                  {exportJob.status === 'failed' && (
                    <>
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      <div>
                        <p className="font-medium text-red-500">
                          {thumbnailOnly ? 'Thumbnail Generation Failed' : 'Export Failed'}
                        </p>
                        <p className="text-sm text-gray-400">{exportJob.error}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {(exportJob.status === 'processing' || exportJob.status === 'queued') && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-medium">{exportJob.progress}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${exportJob.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Download Buttons */}
                {exportJob.status === 'completed' && (
                  <div className="space-y-2">
                    {exportJob.file_url && !thumbnailOnly && (
                      <button
                        onClick={handleDownload}
                        className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                      >
                        <Download className="w-5 h-5" />
                        Download Video
                      </button>
                    )}
                    {exportJob.thumbnail_url && (
                      <button
                        onClick={handleDownloadThumbnail}
                        className={`w-full ${thumbnailOnly ? 'btn-primary py-3' : 'btn-secondary py-2'} flex items-center justify-center gap-2`}
                      >
                        <Image className="w-4 h-4" />
                        Download Thumbnail
                      </button>
                    )}
                  </div>
                )}

                {/* Close Button */}
                {(exportJob.status === 'completed' || exportJob.status === 'failed') && (
                  <button
                    onClick={handleClose}
                    className="w-full btn-secondary py-2"
                  >
                    Close
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
