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
  artist?: string;
  title?: string;
}

export default function StoryboardPreview({
  lyrics,
  config,
  aspectRatio,
  onClose,
  onExport,
  artist = '',
  title = '',
}: StoryboardPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');

  const validLyrics = lyrics.filter((lyric) => lyric.text.trim() !== '');

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const totalScenes = validLyrics.length + 2; // +1 for title card, +1 for ending card
  const isTitleCard = (index: number) => index === 0;
  const isEndingCard = (index: number) => index === totalScenes - 1;
  const getLyricIndex = (index: number) => index - 1; // offset by 1 for title card

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(totalScenes - 1, prev + 1));
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
            {validLyrics.length + 1} scenes • Preview before exporting
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
            {/* Title Card Scene */}
            <div
              className="card p-4 hover:border-primary-500 transition-all cursor-pointer"
              onClick={() => {
                setCurrentIndex(0);
                setViewMode('single');
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-400">
                  Intro
                </span>
                <span className="text-xs text-gray-500">
                  Title Card
                </span>
              </div>
              <div className="mb-3 opacity-90 hover:opacity-100 transition-opacity">
                <VideoPreview
                  lyrics={[]}
                  config={config}
                  aspectRatio={aspectRatio}
                  mode="static"
                  staticText=""
                  showTitleCard={true}
                  artist={artist}
                  title={title}
                />
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 text-center">
                {title} {artist ? `- ${artist}` : ''}
              </p>
            </div>

            {validLyrics.map((lyric, index) => (
              <div
                key={index}
                className="card p-4 hover:border-primary-500 transition-all cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index + 1);
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

            {/* Ending Card Scene */}
            <div
              className="card p-4 hover:border-primary-500 transition-all cursor-pointer"
              onClick={() => {
                setCurrentIndex(totalScenes - 1);
                setViewMode('single');
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-red-400">
                  Ending
                </span>
                <span className="text-xs text-gray-500">
                  Outro Card
                </span>
              </div>
              <div className="mb-3 opacity-90 hover:opacity-100 transition-opacity">
                <VideoPreview
                  lyrics={[]}
                  config={config}
                  aspectRatio={aspectRatio}
                  mode="static"
                  staticText=""
                  showEndingCard={true}
                  artist={artist}
                  title={title}
                />
              </div>
              <p className="text-sm text-gray-300 line-clamp-2 text-center">
                Subscribe / Like / Comment
              </p>
            </div>
          </div>
        ) : (
          // Single View - Show one scene at a time
          <div className="max-w-5xl mx-auto">
            {/* Scene Info */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {isTitleCard(currentIndex) ? 'Title Card' : isEndingCard(currentIndex) ? 'Ending Card' : `Scene ${getLyricIndex(currentIndex) + 1}`} of {totalScenes}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {isTitleCard(currentIndex)
                    ? 'Intro • Title Card'
                    : isEndingCard(currentIndex)
                    ? 'Outro • Subscribe / Like / Comment'
                    : `${formatTime(validLyrics[getLyricIndex(currentIndex)]?.startTime)} - ${formatTime(validLyrics[getLyricIndex(currentIndex)]?.endTime)}`
                  }
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
                  {currentIndex + 1} / {totalScenes}
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === totalScenes - 1}
                  className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Large Preview */}
            <div className="mb-6">
              {isTitleCard(currentIndex) ? (
                <VideoPreview
                  lyrics={[]}
                  config={config}
                  aspectRatio={aspectRatio}
                  mode="static"
                  staticText=""
                  showTitleCard={true}
                  artist={artist}
                  title={title}
                />
              ) : isEndingCard(currentIndex) ? (
                <VideoPreview
                  lyrics={[]}
                  config={config}
                  aspectRatio={aspectRatio}
                  mode="static"
                  staticText=""
                  showEndingCard={true}
                  artist={artist}
                  title={title}
                />
              ) : (
                <VideoPreview
                  lyrics={[validLyrics[getLyricIndex(currentIndex)]]}
                  config={config}
                  aspectRatio={aspectRatio}
                  mode="static"
                  staticText={validLyrics[getLyricIndex(currentIndex)]?.text}
                />
              )}
            </div>

            {/* Lyric Text */}
            <div className="card p-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-2">
                {isTitleCard(currentIndex) ? 'Title Card' : isEndingCard(currentIndex) ? 'Ending Card' : 'Lyric Text'}
              </h4>
              <p className="text-lg text-white leading-relaxed">
                {isTitleCard(currentIndex)
                  ? `${title || ''} ${artist ? `- ${artist}` : ''} • Official Lyric Video`
                  : isEndingCard(currentIndex)
                  ? `${artist || title || ''} • Subscribe / Like / Comment / Notify`
                  : validLyrics[getLyricIndex(currentIndex)]?.text
                }
              </p>
            </div>

            {/* Scene Thumbnails */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">All Scenes</h4>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
                {/* Title Card Thumbnail */}
                <button
                  onClick={() => setCurrentIndex(0)}
                  className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === 0
                      ? 'border-blue-500 ring-2 ring-blue-500/50'
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <div className="aspect-video bg-dark-800">
                    <VideoPreview
                      lyrics={[]}
                      config={config}
                      aspectRatio={aspectRatio}
                      mode="static"
                      staticText=""
                      showTitleCard={true}
                      artist={artist}
                      title={title}
                    />
                  </div>
                  <div className="bg-dark-800 px-2 py-1">
                    <p className="text-xs text-blue-400 text-center">
                      Intro
                    </p>
                  </div>
                </button>
                {validLyrics.map((lyric, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index + 1)}
                    className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                      index + 1 === currentIndex
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
                {/* Ending Card Thumbnail */}
                <button
                  onClick={() => setCurrentIndex(totalScenes - 1)}
                  className={`flex-shrink-0 w-32 rounded-lg overflow-hidden border-2 transition-all ${
                    currentIndex === totalScenes - 1
                      ? 'border-red-500 ring-2 ring-red-500/50'
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <div className="aspect-video bg-dark-800">
                    <VideoPreview
                      lyrics={[]}
                      config={config}
                      aspectRatio={aspectRatio}
                      mode="static"
                      staticText=""
                      showEndingCard={true}
                      artist={artist}
                      title={title}
                    />
                  </div>
                  <div className="bg-dark-800 px-2 py-1">
                    <p className="text-xs text-red-400 text-center">
                      Ending
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-dark-700 p-6 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <p>
            <span className="font-semibold text-white">{totalScenes}</span> scenes ready for
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
