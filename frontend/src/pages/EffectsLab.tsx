import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Shuffle,
  Play,
  Pause,
  Wand2,
  RefreshCw,
  Stars,
  Settings2,
  Palette,
} from 'lucide-react';
import clsx from 'clsx';

type EffectOption = {
  id: string;
  name: string;
  description: string;
  className?: string;
  badge?: string;
};

const lyricSamples = [
  'We light up the dark like a city of stars',
  "Beats in my chest keep calling your name",
  'Gravity fades when the chorus arrives',
  'Waves of color crash in stereo',
  'Neon rain keeps pouring over us',
  'Hold the note until the sunrise hits',
];

const backgroundOptions: EffectOption[] = [
  {
    id: 'aurora-gradient',
    name: 'Aurora Gradient',
    description: 'Multi-stop gradient with slow drift',
    className:
      'bg-gradient-to-br from-primary-600/60 via-indigo-500/50 to-amber-400/50 animate-gradient-shift',
    badge: 'Animated',
  },
  {
    id: 'midnight-grid',
    name: 'Midnight Grid',
    description: 'Neon grid lines over a deep base',
    className: 'bg-dark-900 pattern-grid',
    badge: 'Pattern',
  },
  {
    id: 'starfield',
    name: 'Starfield Drift',
    description: 'Moving star specks with parallax feel',
    className: 'bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 pattern-stars',
    badge: 'Parallax',
  },
  {
    id: 'hologram',
    name: 'Holographic Mist',
    description: 'Soft aurora haze with blur and glow',
    className: 'bg-dark-900/70 effect-glow-blob backdrop-blur-xl',
    badge: 'Soft',
  },
  {
    id: 'retro-synth',
    name: 'Retro Synthwave',
    description: 'Diagonal stripes with slow hue shift',
    className:
      'bg-gradient-to-br from-purple-700/70 via-fuchsia-600/60 to-orange-400/60 pattern-diagonal animate-color-wave',
    badge: 'Hue Shift',
  },
];

const overlayOptions: EffectOption[] = [
  {
    id: 'film-grain',
    name: 'Film Grain',
    description: 'Subtle analog noise texture',
    className: 'effect-film-grain',
  },
  {
    id: 'scanlines',
    name: 'CRT Scanlines',
    description: 'Retro monitor banding',
    className: 'effect-scanlines',
  },
  {
    id: 'vignette',
    name: 'Vignette',
    description: 'Dark edges for focus',
    className: 'effect-vignette',
  },
  {
    id: 'light-rays',
    name: 'Light Rays',
    description: 'Slow rotating beams',
    className: 'effect-light-rays',
  },
  {
    id: 'glass',
    name: 'Glass Frost',
    description: 'Frosted glass overlay',
    className: 'glass-card border border-white/10',
  },
];

const motionOptions: EffectOption[] = [
  {
    id: 'floating-shapes',
    name: 'Floating Shapes',
    description: 'Geometric blobs drifting around',
  },
  {
    id: 'particles',
    name: 'Particles',
    description: 'Tiny sparks rising slowly',
  },
  {
    id: 'beat-flash',
    name: 'Beat Flash',
    description: 'Occasional flash synced to beat',
  },
  {
    id: 'camera-pan',
    name: 'Ken Burns',
    description: 'Slow scale / pan of the frame',
    className: 'animate-ken-burns',
  },
];

const filterOptions: EffectOption[] = [
  {
    id: 'gradient-shift',
    name: 'Gradient Shift',
    description: 'Hue drift across the frame',
    className: 'animate-gradient-shift',
  },
  {
    id: 'color-wave',
    name: 'Color Wave',
    description: 'Hue rotate & saturation wave',
    className: 'animate-color-wave',
  },
  {
    id: 'pulse',
    name: 'Breathing Pulse',
    description: 'Gentle zoom & opacity pulse',
    className: 'animate-pulse',
  },
  {
    id: 'strobe',
    name: 'Strobe',
    description: 'Short, bright flashes',
    className: 'animate-strobe',
  },
];

const textOptions: EffectOption[] = [
  {
    id: 'glow',
    name: 'Neon Glow',
    description: 'Soft neon halo around text',
    className: 'neon-glow text-primary-200',
  },
  {
    id: 'holo',
    name: 'Hologram',
    description: 'Oil-slick prismatic text',
    className: 'holographic',
  },
  {
    id: 'rgb',
    name: 'RGB Split',
    description: 'Chromatic split edges',
    className: 'rgb-split',
  },
  {
    id: 'glitch',
    name: 'Glitch',
    description: 'Jittery duplicated edges',
    className: 'glitch-effect',
  },
];

const backgroundClassMap = Object.fromEntries(backgroundOptions.map(bg => [bg.id, bg.className || '']));
const overlayClassMap = Object.fromEntries(overlayOptions.map(o => [o.id, o.className || '']));
const filterClassMap = Object.fromEntries(filterOptions.map(f => [f.id, f.className || '']));

const presets = [
  {
    id: 'neon-night',
    label: 'Neon Night Drive',
    base: 'retro-synth',
    overlays: ['film-grain', 'scanlines', 'vignette'],
    motion: ['floating-shapes'],
    filters: ['gradient-shift'],
    text: 'glow',
  },
  {
    id: 'cinematic',
    label: 'Cinematic Glow',
    base: 'aurora-gradient',
    overlays: ['vignette', 'light-rays', 'glass'],
    motion: ['camera-pan'],
    filters: ['pulse'],
    text: 'holo',
  },
  {
    id: 'space',
    label: 'Space Dust',
    base: 'starfield',
    overlays: ['film-grain'],
    motion: ['particles', 'floating-shapes'],
    filters: ['color-wave'],
    text: 'rgb',
  },
];

const TogglePill = ({
  active,
  onClick,
  label,
  description,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'w-full text-left px-4 py-3 rounded-lg border transition duration-150',
      active
        ? 'border-primary-500/80 bg-primary-500/10 shadow-[0_0_0_1px_rgba(236,72,153,0.35)]'
        : 'border-dark-700 hover:border-dark-500'
    )}
  >
    <div className="flex items-center justify-between">
      <span className="font-semibold">{label}</span>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-200 border border-primary-500/30">
            {badge}
          </span>
        )}
        <span
          className={clsx(
            'w-2 h-2 rounded-full',
            active ? 'bg-primary-400 shadow-[0_0_0_3px_rgba(236,72,153,0.25)]' : 'bg-dark-600'
          )}
        />
      </div>
    </div>
    <p className="text-sm text-gray-400 mt-1">{description}</p>
  </button>
);

const EffectsLab = () => {
  const [selectedBase, setSelectedBase] = useState(backgroundOptions[0].id);
  const [activeOverlays, setActiveOverlays] = useState<string[]>(['film-grain', 'vignette']);
  const [activeMotion, setActiveMotion] = useState<string[]>(['floating-shapes']);
  const [activeFilters, setActiveFilters] = useState<string[]>(['gradient-shift']);
  const [activeText, setActiveText] = useState<string>('glow');
  const [sampleIndex, setSampleIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(false);
  const [flashPulse, setFlashPulse] = useState(false);

  const galleryPresets = useMemo(() => {
    const adjectives = [
      'Neon',
      'Midnight',
      'Crystal',
      'Velvet',
      'Solar',
      'Lunar',
      'Electric',
      'Glass',
      'Amber',
      'Indigo',
    ];
    const nouns = [
      'Drive',
      'Bloom',
      'Mirage',
      'Pulse',
      'Sky',
      'River',
      'Night',
      'Galaxy',
      'Circuit',
      'Dream',
    ];
    const moods = ['rush', 'drift', 'echo', 'flare', 'wave', 'storm', 'bloom', 'spark', 'glow', 'haze'];
    const vibeNotes = [
      'EDM drop energy',
      'lofi study glow',
      'cinematic trailer',
      'pop shimmer',
      'retro arcade',
      'ambient drift',
      'emo night',
      'future bass',
      'house groove',
      'trap bounce',
    ];

    return Array.from({ length: 50 }).map((_, i) => {
      const base = backgroundOptions[i % backgroundOptions.length].id;
      const overlayA = overlayOptions[i % overlayOptions.length].id;
      const overlayB = overlayOptions[(i + 2) % overlayOptions.length].id;
      const motion: string[] = [motionOptions[i % motionOptions.length].id];
      if (i % 5 === 0) motion.push('beat-flash');
      if (i % 7 === 0) motion.push('particles');

      const filters: string[] = [filterOptions[i % filterOptions.length].id];
      if (i % 6 === 0) filters.push('color-wave');
      if (i % 9 === 0) filters.push('pulse');

      const text = textOptions[i % textOptions.length].id;
      const label = `${adjectives[i % adjectives.length]} ${nouns[Math.floor(i / adjectives.length) % nouns.length]}`;
      const mood = `${moods[i % moods.length]} · ${vibeNotes[i % vibeNotes.length]}`;

      return {
        id: `preset-${i + 1}`,
        label,
        base,
        overlays: Array.from(new Set([overlayA, overlayB])),
        motion: Array.from(new Set(motion)),
        filters: Array.from(new Set(filters)),
        text,
        mood,
      };
    });
  }, []);

  const currentBase = backgroundOptions.find(b => b.id === selectedBase)!;

  // Beat flash loop
  useEffect(() => {
    if (!activeMotion.includes('beat-flash')) return;
    const interval = setInterval(() => {
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 140);
    }, 1700);
    return () => clearInterval(interval);
  }, [activeMotion]);

  // Auto-cycle presets when toggled on
  useEffect(() => {
    if (!autoCycle) return;
    let idx = 0;
    const id = setInterval(() => {
      const preset = presets[idx % presets.length];
      applyPreset(preset.id);
      setSampleIndex(prev => (prev + 1) % lyricSamples.length);
      idx += 1;
    }, 4500);
    return () => clearInterval(id);
  }, [autoCycle]);

  const setFromPreset = (preset: { base: string; overlays: string[]; motion: string[]; filters: string[]; text: string }) => {
    setSelectedBase(preset.base);
    setActiveOverlays(preset.overlays);
    setActiveMotion(preset.motion);
    setActiveFilters(preset.filters);
    setActiveText(preset.text);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    setFromPreset(preset);
  };

  const applyPresetFromGallery = (preset: {
    base: string;
    overlays: string[];
    motion: string[];
    filters: string[];
    text: string;
  }) => setFromPreset(preset);

  const toggleOverlay = (id: string) => {
    setActiveOverlays(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleMotion = (id: string) => {
    setActiveMotion(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleFilter = (id: string) => {
    setActiveFilters(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const lyric = lyricSamples[sampleIndex];

  const floatingShapes = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        size: 80 + Math.random() * 120,
        left: `${10 + Math.random() * 70}%`,
        top: `${5 + Math.random() * 70}%`,
        delay: Math.random() * 5,
        hue: 180 + i * 20 + Math.random() * 40,
      })),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 35 }).map(() => ({
        size: Math.random() * 3 + 1,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 6 + Math.random() * 6,
        delay: Math.random() * 4,
      })),
    []
  );

  const backgroundClasses = clsx(
    'relative overflow-hidden rounded-2xl h-[460px] border border-dark-700 shadow-2xl',
    currentBase.className,
    activeFilters.map(id => filterOptions.find(f => f.id === id)?.className),
    activeMotion.includes('camera-pan') && 'animate-ken-burns'
  );

  const lyricTextClass = clsx(
    'text-3xl md:text-4xl font-display font-bold text-center drop-shadow-lg px-6',
    textOptions.find(t => t.id === activeText)?.className
  );

  return (
    <div className="min-h-screen px-4 py-10 bg-dark-900">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-primary-300 uppercase tracking-wide text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> Effects Lab
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">Lyrics Background Playground</h1>
          <p className="text-gray-400 max-w-3xl">
            Preview every background trick we can do with this stack—animated gradients, particles, scanlines,
            floating shapes, color waves, strobes, and more. Mix & match layers, hit random, or load a preset and see it live.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className={clsx(
                'btn-secondary flex items-center gap-2',
                autoCycle && 'border border-primary-500/60 bg-primary-500/10'
              )}
              onClick={() => setAutoCycle(v => !v)}
            >
              {autoCycle ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoCycle ? 'Stop autoplay' : 'Autoplay presets'}
            </button>
            <button
              className="btn-secondary flex items-center gap-2"
              onClick={() => setSampleIndex(i => (i + 1) % lyricSamples.length)}
            >
              <RefreshCw className="w-4 h-4" /> Swap lyric line
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={() => applyPreset(presets[Math.floor(Math.random() * presets.length)].id)}
            >
              <Shuffle className="w-4 h-4" /> Random preset
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[2fr,1.2fr] gap-6">
          <div className="space-y-4">
            <div className={backgroundClasses}>
              {/* overlays */}
              <div className={clsx('absolute inset-0', activeOverlays.map(id => overlayOptions.find(o => o.id === id)?.className))} />

              {/* glow blobs for hologram base */}
              {selectedBase === 'hologram' && (
                <div className="absolute inset-0 effect-glow-blob opacity-80" />
              )}

              {/* floating shapes */}
              {activeMotion.includes('floating-shapes') && (
                <div className="absolute inset-0">
                  {floatingShapes.map((shape, idx) => (
                    <motion.div
                      key={idx}
                      className="shape-floating rounded-full mix-blend-screen"
                      style={{
                        width: shape.size,
                        height: shape.size,
                        left: shape.left,
                        top: shape.top,
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), transparent 60%), hsla(${shape.hue}, 80%, 60%, 0.22)`,
                        filter: 'blur(1px)',
                      }}
                      animate={{ y: [-10, 20, -15], rotate: [0, 30, -15, 0] }}
                      transition={{ duration: 14 + idx * 0.5, repeat: Infinity, ease: 'easeInOut', delay: shape.delay }}
                    />
                  ))}
                </div>
              )}

              {/* particles */}
              {activeMotion.includes('particles') && (
                <div className="absolute inset-0">
                  {particles.map((p, idx) => (
                    <motion.span
                      key={idx}
                      className="absolute rounded-full bg-white/70"
                      style={{ width: p.size, height: p.size, left: p.left, top: p.top }}
                      animate={{ y: ['0%', '-12%'], opacity: [0.2, 0.8, 0] }}
                      transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeOut' }}
                    />
                  ))}
                </div>
              )}

              {/* flash beat */}
              <AnimatePresence>
                {activeMotion.includes('beat-flash') && flashPulse && (
                  <motion.div
                    className="absolute inset-0 bg-white/15 mix-blend-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.9 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  />
                )}
              </AnimatePresence>

              {/* lyric text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 backdrop-blur">
                    <Stars className="w-4 h-4 text-primary-300" />
                    <span className="text-xs uppercase tracking-[0.2em] text-gray-300">Live preview</span>
                  </div>
                  <div className="relative">
                    <p className={lyricTextClass} data-text={lyric}>
                      {lyric}
                    </p>
                  </div>
                </div>
              </div>

              {/* border highlight */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5" />
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {presets.map(preset => (
                <button
                  key={preset.id}
                  className="card p-3 hover:border-primary-500/60 transition flex items-center gap-3"
                  onClick={() => applyPreset(preset.id)}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-500/15 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary-300" />
                  </div>
                  <div>
                    <div className="font-semibold">{preset.label}</div>
                    <div className="text-xs text-gray-400">{preset.overlays.length} overlays · {preset.motion.length} motion</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-5">
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold uppercase tracking-wide">
                <Layers className="w-4 h-4" /> Layers
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold">
                    <Palette className="w-4 h-4" /> Backgrounds (pick one)
                  </div>
                  <div className="space-y-2">
                    {backgroundOptions.map(bg => (
                      <TogglePill
                        key={bg.id}
                        active={selectedBase === bg.id}
                        onClick={() => setSelectedBase(bg.id)}
                        label={bg.name}
                        description={bg.description}
                        badge={bg.badge}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold">
                    <Settings2 className="w-4 h-4" /> Overlays (multi-select)
                  </div>
                  <div className="space-y-2">
                    {overlayOptions.map(overlay => (
                      <TogglePill
                        key={overlay.id}
                        active={activeOverlays.includes(overlay.id)}
                        onClick={() => toggleOverlay(overlay.id)}
                        label={overlay.name}
                        description={overlay.description}
                        badge={overlay.badge}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold">
                    <Sparkles className="w-4 h-4" /> Motion / Energy
                  </div>
                  <div className="space-y-2">
                    {motionOptions.map(item => (
                      <TogglePill
                        key={item.id}
                        active={activeMotion.includes(item.id)}
                        onClick={() => toggleMotion(item.id)}
                        label={item.name}
                        description={item.description}
                        badge={item.badge}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold">
                    <Settings2 className="w-4 h-4" /> Color / Filters
                  </div>
                  <div className="space-y-2">
                    {filterOptions.map(item => (
                      <TogglePill
                        key={item.id}
                        active={activeFilters.includes(item.id)}
                        onClick={() => toggleFilter(item.id)}
                        label={item.name}
                        description={item.description}
                        badge={item.badge}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 text-gray-200 font-semibold">
                    <Layers className="w-4 h-4" /> Text Treatment (pick one)
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {textOptions.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveText(t.id)}
                        className={clsx(
                          'px-3 py-3 rounded-lg border text-left transition',
                          activeText === t.id
                            ? 'border-primary-500/70 bg-primary-500/10'
                            : 'border-dark-700 hover:border-dark-500'
                        )}
                      >
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-sm text-gray-400">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 space-y-3">
              <div className="text-sm text-gray-300 font-semibold uppercase tracking-wide flex items-center gap-2">
                <Shuffle className="w-4 h-4" /> Quick ideas
              </div>
              <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
                <li>Flash + scanlines for high-energy EDM hooks.</li>
                <li>Glass + vignette + pulse for ballads and slow jams.</li>
                <li>Particles + starfield + gradient shift for dreamy synthwave.</li>
                <li>Floating shapes + color wave for playful pop moments.</li>
                <li>Ken Burns + light rays to mimic camera movement on photos.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Massive preset gallery */}
        <section className="space-y-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary-300 font-semibold">
              <Layers className="w-4 h-4" /> 50 Ready-Made Presets
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-display font-bold">Hover to preview, click to load onto the stage</h2>
              <div className="text-sm text-gray-400">Tiles mix backgrounds, overlays, motion, filters, and text treatments.</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {galleryPresets.map(preset => {
              const previewClasses = clsx(
                'relative aspect-video w-full rounded-xl overflow-hidden border border-dark-700 bg-dark-800 group',
                backgroundClassMap[preset.base],
                preset.filters.map(f => filterClassMap[f]),
                preset.motion.includes('camera-pan') && 'animate-ken-burns'
              );

              return (
                <motion.button
                  key={preset.id}
                  onClick={() => applyPresetFromGallery(preset)}
                  className="card p-0 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary-500/60"
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <div className={previewClasses}>
                    <div className={clsx('absolute inset-0', preset.overlays.map(o => overlayClassMap[o]))} />

                    {preset.motion.includes('floating-shapes') && (
                      <div className="absolute inset-0 opacity-60">
                        <div className="shape-floating animate-float-slow w-24 h-24 bg-primary-500/20 rounded-full" style={{ left: '10%', top: '20%' }} />
                        <div className="shape-floating animate-float-medium w-16 h-16 bg-blue-400/20 rounded-full" style={{ left: '70%', top: '40%' }} />
                        <div className="shape-floating animate-spin-slow w-12 h-12 border border-white/20 rounded-full" style={{ left: '45%', top: '65%' }} />
                      </div>
                    )}

                    {preset.motion.includes('particles') && (
                      <div className="absolute inset-0 effect-particles">
                        <div className="absolute inset-0 pattern-stars opacity-70" />
                      </div>
                    )}

                    {preset.motion.includes('beat-flash') && (
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-60 transition" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-sm text-gray-200">
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-xs text-gray-400">{preset.motion.length} motions · {preset.overlays.length} overlays</div>
                    </div>
                  </div>
                  <div className="p-3 text-left space-y-1">
                    <div className="text-sm text-gray-300">{preset.mood}</div>
                    <div className="text-xs text-gray-500">
                      Base: {preset.base} · Filters: {preset.filters.join(', ')} · Text: {preset.text}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EffectsLab;
