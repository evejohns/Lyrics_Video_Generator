import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import VideoPreview from './VideoPreview';

interface StoryboardPreviewProps {
  lyrics: Array<{
    text: string;
    startTime: number | null;
    endTime: number | null;
  }>;
  config: {
    template?: string;
    fontFamily?: string;
    fontSize?: number;
    animation?: string;
    animations?: string[];
    backgroundEffects?: string[];
    visualEffects?: string[];
  };
  aspectRatio: '16:9' | '9:16' | '1:1';
  onClose: () => void;
  onExport: () => void;
}

export default function StoryboardPreview({
  lyrics,
  config,
  aspectRatio,
  onClose,
  onExport,
}: StoryboardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  const validLyrics = lyrics.filter((lyric) => lyric.text.trim() !== '');

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(validLyrics.length - 1, prev + 1));
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark-700">
        <div>
          <h2 className="text-2xl font-bold text-gradient">Storyboard Preview</h2>
          <p className="text-sm text-gray-400 mt-1">
            {validLyrics.length} scenes • Preview before exporting
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Single View
            </button>
          </div>
          <button
            onClick={onExport}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Export Video
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'grid' ? (
          // Grid View - Show all scenes
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {validLyrics.map((lyric, index) => (
              <div
                key={index}
                className="card p-4 hover:border-primary-500 transition-all cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index);
                  setViewMode('single');
                }}
              >
                {/* Scene Number & Time */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary-400">
                    Scene {index + 1}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(lyric.startTime)} - {formatTime(lyric.endTime)}
                  </span>
                </div>

                {/* Preview */}
                <div className="mb-3 opacity-90 hover:opacity-100 transition-opacity">
                  <VideoPreview
                    lyrics={[lyric]}
                    config={config}
                    aspectRatio={aspectRatio}
                    mode="static"
                    staticText={lyric.text}
                  />
                </div>

                {/* Lyric Text */}
                <p className="text-sm text-gray-300 line-clamp-2 text-center">
                  {lyric.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // Single View - Show one scene at a time
          <div className="max-w-5xl mx-auto">
            {/* Scene Info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Scene {currentIndex + 1} of {validLyrics.length}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {formatTime(validLyrics[currentIndex]?.startTime)} -{' '}
                  {formatTime(validLyrics[currentIndex]?.endTime)}
                </p>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 min-w-[80px] text-center">
                  {currentIndex + 1} / {validLyrics.length}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === validLyrics.length - 1}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Preview */}
            <div className="mb-6">
              <VideoPreview
                lyrics={[validLyrics[currentIndex]]}
                config={config}
                aspectRatio={aspectRatio}
                mode="static"
                staticText={validLyrics[currentIndex]?.text}
              />
            </div>

            {/* Lyric Text */}
            <div className="card p-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">Lyric Text</h4>
              <p className="text-lg text-white leading-relaxed">
                {validLyrics[currentIndex]?.text}
              </p>
            </div>

            {/* Scene Thumbnails */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">All Scenes</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                {validLyrics.map((lyric, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-primary-500 ring-2 ring-primary-500/50'
                        : 'border-dark-600 hover:border-dark-500'
                    }`}
                  >
                    <div className="aspect-video bg-dark-800">
                      <VideoPreview
                        lyrics={[lyric]}
                        config={config}
                        aspectRatio={aspectRatio}
                        mode="static"
                        staticText={lyric.text}
                      />
                    </div>
                    <div className="bg-dark-800 px-2 py-1">
                      <p className="text-xs text-gray-400 text-center">
                        Scene {index + 1}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-dark-700 p-6 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <p>
            <span className="font-semibold text-white">{validLyrics.length}</span> scenes ready for
            export
          </p>
          <p className="text-xs mt-1">
            Each scene shows exactly how it will appear in your video
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="btn-secondary">
            Back to Editor
          </button>
          <button onClick={onExport} className="btn-primary flex items-center gap-2">
            <Play className="w-4 h-4" />
            Export Full Video
          </button>
        </div>
      </div>
    </div>
  );
}
