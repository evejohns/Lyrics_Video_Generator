import { useState, useRef, DragEvent } from 'react';
import { Upload, Music, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as mm from 'music-metadata';

interface AudioUploaderProps {
  onUploadComplete: (audioData: {
    file: File;
    url: string;
    duration: number;
    metadata: {
      title?: string;
      artist?: string;
      album?: string;
    };
  }) => void;
}

const ACCEPTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/flac', 'audio/ogg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function AudioUploader({ onUploadComplete }: AudioUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return 'Invalid file format. Please upload MP3, WAV, M4A, FLAC, or OGG files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 50MB limit.';
    }
    return null;
  };

  const extractMetadata = async (file: File): Promise<{ duration: number; metadata: any }> => {
    try {
      // Parse audio metadata using music-metadata
      const metadata = await mm.parseBlob(file);

      return {
        duration: metadata.format.duration || 0,
        metadata: {
          title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.common.artist || 'Unknown Artist',
          album: metadata.common.album || 'Unknown Album',
          year: metadata.common.year,
          genre: metadata.common.genre?.join(', '),
          bitrate: metadata.format.bitrate,
          sampleRate: metadata.format.sampleRate,
        },
      };
    } catch (error) {
      console.warn('Failed to extract metadata, using fallback:', error);

      // Fallback: Use HTML5 Audio API for basic duration
      return new Promise((resolve) => {
        const audio = new Audio();
        const url = URL.createObjectURL(file);

        audio.addEventListener('loadedmetadata', () => {
          resolve({
            duration: audio.duration,
            metadata: {
              title: file.name.replace(/\.[^/.]+$/, ''),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
            },
          });
          URL.revokeObjectURL(url);
        });

        audio.addEventListener('error', () => {
          resolve({
            duration: 0,
            metadata: {
              title: file.name.replace(/\.[^/.]+$/, ''),
              artist: 'Unknown Artist',
              album: 'Unknown Album',
            },
          });
          URL.revokeObjectURL(url);
        });

        audio.src = url;
      });
    }
  };

  const handleFile = async (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }

    setFile(selectedFile);
    setUploading(true);

    try {
      // Extract metadata first
      const { duration, metadata } = await extractMetadata(selectedFile);

      // Simulate upload progress (will be replaced with actual upload)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Create temporary URL for audio playback
      const audioUrl = URL.createObjectURL(selectedFile);

      // Complete upload
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);

        onUploadComplete({
          file: selectedFile,
          url: audioUrl,
          duration,
          metadata,
        });

        toast.success('Audio uploaded successfully!');
        setUploading(false);
      }, 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload audio file');
      setUploading(false);
      setFile(null);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFile(droppedFiles[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFile(selectedFiles[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (file && !uploading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Music className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="font-semibold">{file.name}</h3>
              <p className="text-sm text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-sm text-green-400">Audio uploaded successfully!</p>
        </div>
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-primary-500 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">{file?.name}</h3>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-400">Uploading... {uploadProgress}%</p>
      </div>
    );
  }

  return (
    <div
      className={`card p-8 border-2 border-dashed transition-all ${
        isDragging
          ? 'border-primary-500 bg-primary-500/5'
          : 'border-gray-700 hover:border-gray-600'
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.flac,.ogg"
        onChange={handleFileInput}
        className="hidden"
      />

      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/10 flex items-center justify-center">
          <Upload className="w-8 h-8 text-primary-500" />
        </div>

        <h3 className="text-xl font-semibold mb-2">Upload Audio File</h3>
        <p className="text-gray-400 mb-6">
          Drag and drop your audio file here, or click to browse
        </p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary mb-6"
        >
          Choose File
        </button>

        <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-900/50 rounded-lg p-4">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <p className="mb-1">Supported formats: MP3, WAV, M4A, FLAC, OGG</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>
      </div>
    </div>
  );
}
