import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface WaveformProps {
  audioUrl: string;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
  onReady?: (duration: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface WaveformHandle {
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
}

const Waveform = forwardRef<WaveformHandle, WaveformProps>(
  (
    {
      audioUrl,
      height = 128,
      waveColor = '#4B5563',
      progressColor = '#8B5CF6',
      cursorColor = '#8B5CF6',
      onReady,
      onTimeUpdate,
    }: WaveformProps,
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      pause: () => {
        wavesurferRef.current?.pause();
      },
      play: () => {
        wavesurferRef.current?.play();
      },
      seekTo: (time: number) => {
        if (wavesurferRef.current && duration > 0) {
          wavesurferRef.current.seekTo(time / duration);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      // Initialize WaveSurfer
      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor,
        progressColor,
        cursorColor,
        height,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        cursorWidth: 2,
        normalize: true,
        responsive: true,
      });

      wavesurferRef.current = wavesurfer;

      // Load audio
      wavesurfer.load(audioUrl);

      // Event listeners
      wavesurfer.on('ready', () => {
        setLoading(false);
        const audioDuration = wavesurfer.getDuration();
        setDuration(audioDuration);
        onReady?.(audioDuration);
      });

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));

      wavesurfer.on('audioprocess', () => {
        const time = wavesurfer.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      });

      wavesurfer.on('seeking', () => {
        const time = wavesurfer.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
      });

      return () => {
        wavesurfer.destroy();
      };
    }, [audioUrl, height, waveColor, progressColor, cursorColor]);

    const handlePlayPause = () => {
      wavesurferRef.current?.playPause();
    };

    const handleSkipBackward = () => {
      if (wavesurferRef.current) {
        const newTime = Math.max(0, currentTime - 5);
        wavesurferRef.current.seekTo(newTime / duration);
      }
    };

    const handleSkipForward = () => {
      if (wavesurferRef.current) {
        const newTime = Math.min(duration, currentTime + 5);
        wavesurferRef.current.seekTo(newTime / duration);
      }
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="w-full">
        {/* Waveform container */}
        <div
          ref={containerRef}
          className={`w-full rounded-lg overflow-hidden bg-gray-900/50 ${loading ? 'animate-pulse' : ''}`}
        />

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkipBackward}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              disabled={loading}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="currentColor" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
            </button>

            <button
              onClick={handleSkipForward}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              disabled={loading}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    );
  }
);

Waveform.displayName = 'Waveform';

export default Waveform;
