export default function ProjectEditor() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-display font-bold mb-6">Project Editor</h1>
      <div className="card p-8">
        <p className="text-gray-400">
          This is where the main editor interface will go, including:
        </p>
        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-400">
          <li>Audio upload & playback</li>
          <li>Lyrics input/sync</li>
          <li>Waveform timeline</li>
          <li>Visual editor with template selection</li>
          <li>Real-time canvas preview</li>
          <li>Export controls</li>
        </ul>
      </div>
    </div>
  );
}
