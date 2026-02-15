import { useEffect, useState } from 'react';
import { templates } from '../data/templates';

interface VideoPreviewProps {
  currentTime?: number;
  lyrics?: Array<{
    text: string;
    startTime: number | null;
    endTime: number | null;
  }>;
  config: {
    template?: string;
    fontFamily?: string;
    fontSize?: number;
    animation?: string;
    animations?: string[]; // Multiple animations support
    backgroundEffects?: string[];
    visualEffects?: string[];
  };
  aspectRatio?: '16:9' | '9:16' | '1:1';
  mode?: 'static' | 'animated';
  staticText?: string;
  albumArtUrl?: string | null;
  showEndingCard?: boolean;
  showTitleCard?: boolean;
  artist?: string;
  title?: string;
}

export default function VideoPreview({
  currentTime = 0,
  lyrics = [],
  config,
  aspectRatio = '16:9',
  mode = 'animated',
  staticText = 'Sample lyric text for preview',
  albumArtUrl = null,
  showEndingCard = false,
  showTitleCard = false,
  artist = '',
  title = '',
}: VideoPreviewProps) {
  const [currentLyric, setCurrentLyric] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Get template config
  const template = templates.find((t) => t.id === config.template) || templates[0];
  const backgroundColors = template.gradient.join(', ');
  const backgroundType = template.config.background.gradientType || 'linear';

  // Find current lyric based on time (animated mode only)
  useEffect(() => {
    if (mode === 'static') {
      setCurrentLyric(staticText);
      return;
    }

    const current = lyrics.find((lyric) => {
      if (!lyric.startTime) return false;
      const endTime = lyric.endTime || lyric.startTime + 5;
      return currentTime >= lyric.startTime && currentTime < endTime;
    });

    if (current?.text !== currentLyric) {
      setCurrentLyric(current?.text || '');
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }
  }, [currentTime, lyrics, mode, staticText]);

  // Calculate aspect ratio dimensions
  const aspectRatioMap = {
    '16:9': { width: '100%', paddingBottom: '56.25%' },
    '9:16': { width: '56.25%', paddingBottom: '100%' },
    '1:1': { width: '100%', paddingBottom: '100%' },
  };
  const dimensions = aspectRatioMap[aspectRatio];
  const isVertical = aspectRatio === '9:16';
  const isSquare = aspectRatio === '1:1';
  // Scale factor for font sizes in preview: narrower formats need smaller text
  const previewFontScale = isVertical ? 0.35 : 0.5;

  // Build animation classes (support multiple simultaneous effects)
  const getAnimationClasses = () => {
    if (mode !== 'animated' || !isAnimating) return '';

    const classes: string[] = [];

    // Text animations - use new multi-select array if available, fall back to single animation
    const textAnimations = config.animations || (config.animation ? [config.animation] : []);
    textAnimations.forEach((anim) => {
      const animMap: Record<string, string> = {
        fade: 'animate-fadeIn',
        slide: 'animate-slideUp',
        pop: 'animate-pop',
        bounce: 'animate-bounce-once',
        typewriter: 'animate-typewriter',
        zoom: 'animate-zoomIn',
        rotate: 'animate-rotate',
        wave: 'animate-wave',
        glitch: 'animate-glitch',
      };
      if (animMap[anim]) classes.push(animMap[anim]);
    });

    return classes.join(' ');
  };

  const animationClass = getAnimationClasses();

  // Get continuous text effects (always applied, not just during animation)
  const getContinuousTextEffects = () => {
    const visualEffects = config.visualEffects || [];
    const classes: string[] = [];

    const effectMap: Record<string, string> = {
      sparkle: 'animate-sparkle',
      glow: 'animate-glow',
    };

    visualEffects.forEach((effect) => {
      if (effectMap[effect]) classes.push(effectMap[effect]);
    });

    return classes.join(' ');
  };

  const continuousTextEffects = getContinuousTextEffects();

  // Build overlay effect classes (container-level)
  const getOverlayEffects = () => {
    const effects = config.visualEffects || [];
    const classes: string[] = [];

    const effectMap: Record<string, string> = {
      'vignette': 'effect-vignette',
      'film-grain': 'effect-film-grain',
      'scanlines': 'effect-scanlines',
      'particles': 'effect-particles',
      'light-rays': 'effect-light-rays',
    };

    effects.forEach((effect) => {
      if (effectMap[effect]) classes.push(effectMap[effect]);
    });

    return classes.join(' ');
  };

  const overlayEffects = getOverlayEffects();

  // Text highlight style
  const getTextHighlight = () => {
    const effects = config.visualEffects || [];
    if (effects.includes('text-box')) return 'text-highlight-box';
    if (effects.includes('text-bar')) return 'text-highlight-bar';
    return '';
  };

  const textHighlight = getTextHighlight();

  const displayText =
    mode === 'static'
      ? currentLyric
      : currentLyric || (lyrics.length > 0 ? 'Play audio to see lyrics...' : 'Add lyrics in the Lyrics tab');

  // Get pattern from template config
  const backgroundPattern = template.config.background.pattern || '';

  // Get decorative elements from template config
  const decorativeElements = template.config.effects?.decorativeShapes || [];

  // Text style effects (glitch, neon, 3d, etc.)
  const textStyleEffect = template.config.text.styleEffect || '';

  // Calculate optimal text and outline colors based on background luminance
  const getOptimalColors = () => {
    // Parse hex colors from gradient and calculate luminance
    const calculateLuminance = (hexColor: string): number => {
      // Remove # if present
      const hex = hexColor.replace('#', '');

      // Parse RGB values
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      // Apply sRGB gamma correction
      const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
      const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
      const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

      // Calculate relative luminance
      return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
    };

    // Calculate luminance of all gradient colors
    const luminances = template.gradient.map(color => calculateLuminance(color));

    // Use MAXIMUM luminance instead of average for vibrant gradients
    // If any color is bright, we need dark text for readability
    const maxLuminance = Math.max(...luminances);

    // For dark backgrounds: white text with black outline + very strong dark shadow
    // For bright backgrounds: black text with white outline + very strong light shadow
    // Using threshold of 0.35 - if brightest color has luminance >= 0.35, use dark text
    // ALWAYS apply thick outline (6px minimum) for maximum readability on complex backgrounds
    if (maxLuminance < 0.35) {
      return {
        text: '#FFFFFF',
        outline: '#000000',
        outlineWidth: 6,
        shadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.8)',
      };
    } else {
      return {
        text: '#000000',
        outline: '#FFFFFF',
        outlineWidth: 6,
        shadow: '0 0 30px rgba(255,255,255,1), 0 0 20px rgba(255,255,255,0.95), 0 6px 12px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.7)',
      };
    }
  };

  const optimalColors = getOptimalColors();

  return (
    <div className="relative w-full flex justify-center" style={{ maxWidth: dimensions.width }}>
      <div
        className={`relative rounded-lg shadow-xl ${overlayEffects} ${
          (config.visualEffects || []).includes('light-rays') ? '' : 'overflow-hidden'
        }`}
        style={{ paddingBottom: dimensions.paddingBottom, width: isVertical ? '56.25%' : '100%' }}
      >
        {/* Base Gradient Background */}
        <div
          className={`absolute inset-0 z-0 ${(config.backgroundEffects || []).map((effect) => {
            const effectMap: Record<string, string> = {
              'gradient-shift': 'animate-gradient-shift',
              pulse: 'animate-pulse',
              'ken-burns': 'animate-ken-burns',
              'color-wave': 'animate-color-wave',
            };
            return effectMap[effect] || '';
          }).join(' ')}`}
          style={{
            background:
              backgroundType === 'radial'
                ? `radial-gradient(circle, ${backgroundColors})`
                : `linear-gradient(135deg, ${backgroundColors})`,
          }}
        />

        {/* Pattern Overlay */}
        {backgroundPattern && (
          <div
            className={`absolute inset-0 z-[1] ${backgroundPattern}`}
          />
        )}

        {/* Decorative Geometric Shapes */}
        {decorativeElements.length > 0 && (
          <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
            {decorativeElements.map((shape: any, index: number) => {
              const shapeStyles: Record<string, React.CSSProperties> = {
                circle: {
                  width: shape.size || '200px',
                  height: shape.size || '200px',
                  borderRadius: '50%',
                  background: shape.color || 'rgba(255,255,255,0.1)',
                },
                square: {
                  width: shape.size || '150px',
                  height: shape.size || '150px',
                  background: shape.color || 'rgba(255,255,255,0.1)',
                },
                triangle: {
                  width: 0,
                  height: 0,
                  borderLeft: `${parseInt(shape.size || '100') / 2}px solid transparent`,
                  borderRight: `${parseInt(shape.size || '100') / 2}px solid transparent`,
                  borderBottom: `${shape.size || '100px'} solid ${shape.color || 'rgba(255,255,255,0.1)'}`,
                },
                star: {
                  width: shape.size || '100px',
                  height: shape.size || '100px',
                  background: 'transparent',
                  fontSize: shape.size || '100px',
                  lineHeight: 1,
                  color: shape.color || 'rgba(255,255,255,0.15)',
                },
              };

              return (
                <div
                  key={index}
                  className={`absolute shape-floating ${shape.animation || 'animate-float-slow'}`}
                  style={{
                    ...shapeStyles[shape.type || 'circle'],
                    top: shape.top || '10%',
                    left: shape.left || '10%',
                    transform: shape.rotate ? `rotate(${shape.rotate}deg)` : 'none',
                    animationDelay: `${index * 0.5}s`,
                  }}
                >
                  {shape.type === 'star' && '★'}
                  {shape.type === 'emoji' && shape.emoji}
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Particles */}
        {(config.visualEffects || []).includes('particles') && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: `${Math.random() * 20 + 10}px`,
                  height: `${Math.random() * 20 + 10}px`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Title Card Overlay */}
        {showTitleCard && (
          <div className="absolute inset-0 flex items-center justify-center p-4 z-20" style={{ gap: '16px', flexDirection: isVertical ? 'column' : 'row' }}>
            {/* Text Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isVertical ? 'center' : 'flex-start', gap: '0px', maxWidth: '80%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
              {/* Artist Name */}
              {artist && (
                <div
                  style={{
                    fontFamily: config.fontFamily || 'Inter',
                    fontSize: `${(config.fontSize || 48) * previewFontScale * 0.5}px`,
                    color: '#FFFFFF',
                    fontWeight: '600',
                    textAlign: isVertical ? 'center' : 'left',
                    textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                    WebkitTextStroke: `${Math.max(1, optimalColors.outlineWidth * 0.4)}px ${optimalColors.outline}`,
                    paintOrder: 'stroke fill',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                  }}
                >
                  {artist}
                </div>
              )}

              {/* Song Title */}
              <div
                style={{
                  fontFamily: config.fontFamily || 'Inter',
                  fontSize: `${(config.fontSize || 48) * previewFontScale}px`,
                  color: '#FFFFFF',
                  fontWeight: '900',
                  textAlign: isVertical ? 'center' : 'left',
                  textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                  WebkitTextStroke: `${optimalColors.outlineWidth}px ${optimalColors.outline}`,
                  paintOrder: 'stroke fill',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                {title || ''}
              </div>

              {/* Lyrics Video label */}
              <div
                style={{
                  fontFamily: config.fontFamily || 'Inter',
                  fontSize: '8px',
                  color: '#FFFFFF',
                  fontWeight: '500',
                  textAlign: 'left',
                  textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                  WebkitTextStroke: `${Math.max(1, optimalColors.outlineWidth * 0.3)}px ${optimalColors.outline}`,
                  paintOrder: 'stroke fill',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginTop: '6px',
                }}
              >
                Lyrics Video
              </div>
            </div>
          </div>
        )}

        {/* Ending Card Overlay */}
        {showEndingCard && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20 gap-2">
            {/* Artist Name */}
            <div
              style={{
                fontFamily: config.fontFamily || 'Inter',
                fontSize: `${(config.fontSize || 48) * previewFontScale * 1.1}px`,
                color: optimalColors.text,
                fontWeight: '900',
                textAlign: 'center',
                textShadow: optimalColors.shadow,
                WebkitTextStroke: `${optimalColors.outlineWidth}px ${optimalColors.outline}`,
                paintOrder: 'stroke fill',
                letterSpacing: '-0.02em',
                maxWidth: '90%',
                lineHeight: 1.2,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {artist || title || ''}
            </div>

            {/* Subscribe Button */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                borderRadius: '6px',
                padding: '4px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(255,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                marginTop: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
              </svg>
              <span
                style={{
                  fontFamily: config.fontFamily || 'Inter',
                  fontSize: '11px',
                  color: '#FFFFFF',
                  fontWeight: '900',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Subscribe
              </span>
            </div>

            {/* Action Icons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
              {/* Like */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={optimalColors.text}>
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </div>
                <span style={{ fontSize: '6px', color: optimalColors.text, fontWeight: '600' }}>Like</span>
              </div>
              {/* Comment */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={optimalColors.text}>
                    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                  </svg>
                </div>
                <span style={{ fontSize: '6px', color: optimalColors.text, fontWeight: '600' }}>Comment</span>
              </div>
              {/* Bell */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={optimalColors.text}>
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </div>
                <span style={{ fontSize: '6px', color: optimalColors.text, fontWeight: '600' }}>Notify</span>
              </div>
            </div>

            {/* Thanks for watching */}
            <div
              style={{
                fontFamily: config.fontFamily || 'Inter',
                fontSize: '8px',
                color: optimalColors.text,
                fontWeight: '500',
                textAlign: 'center',
                textShadow: optimalColors.shadow,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Thanks for watching
            </div>
          </div>
        )}

        {/* Lyrics Text */}
        {!showEndingCard && !showTitleCard && <div className="absolute inset-0 flex items-center justify-center p-8 z-20">
          <div
            data-text={displayText}
            className={`text-center ${animationClass} ${continuousTextEffects} ${textHighlight} ${
              textStyleEffect === 'glitch' ? 'glitch-effect' :
              textStyleEffect === 'neon' ? 'neon-glow' :
              textStyleEffect === '3d' ? 'text-3d' :
              textStyleEffect === 'rgb-split' ? 'rgb-split' :
              textStyleEffect === 'chromatic' ? 'chromatic-aberration' :
              textStyleEffect === 'holographic' ? 'holographic' : ''
            }`}
            style={{
              fontFamily: config.fontFamily || 'Inter',
              fontSize: `${(config.fontSize || 48) * previewFontScale}px`,
              color: textStyleEffect === 'holographic' ? 'transparent' : optimalColors.text,
              fontWeight: template.config.text.weight,
              textShadow: ['glitch', 'neon', '3d', 'rgb-split', 'chromatic', 'holographic'].includes(textStyleEffect)
                ? 'none'
                : optimalColors.shadow,
              // Always apply thick outline for maximum readability on complex backgrounds
              WebkitTextStroke: ['glitch', 'neon', '3d', 'rgb-split', 'chromatic', 'holographic'].includes(textStyleEffect)
                ? 'none'
                : `${optimalColors.outlineWidth}px ${optimalColors.outline}`,
              maxWidth: '90%',
              lineHeight: 1.4,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {displayText}
          </div>
        </div>}

        {/* Music Emoji during instrumental gaps (3+ seconds with no lyrics) */}
        {mode === 'animated' && !showTitleCard && !showEndingCard && !currentLyric && (() => {
          const MIN_GAP = 3;
          let prevEnd = 0;
          let nextStart = Infinity;

          for (const lyric of lyrics) {
            if (!lyric.startTime) continue;
            const lEnd = lyric.endTime || lyric.startTime + 5;
            if (lEnd <= currentTime && lEnd > prevEnd) prevEnd = lEnd;
            if (lyric.startTime > currentTime && lyric.startTime < nextStart) nextStart = lyric.startTime;
          }

          const gapDuration = nextStart - prevEnd;
          if (gapDuration < MIN_GAP) return null;

          return (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div
                style={{
                  fontSize: `${(config.fontSize || 48) * previewFontScale * 1.5}px`,
                  color: optimalColors.text,
                  textShadow: optimalColors.shadow,
                  WebkitTextStroke: `${optimalColors.outlineWidth}px ${optimalColors.outline}`,
                  paintOrder: 'stroke fill',
                  letterSpacing: '0.3em',
                }}
              >
                ♪ ♫ ♪
              </div>
            </div>
          );
        })()}

        {/* Album Art */}
        {albumArtUrl && (
          <div className="absolute bottom-0 right-0 p-2 z-30">
            <img
              src={albumArtUrl}
              alt="Album art"
              className="w-12 h-12 rounded object-cover shadow-lg border border-white/20"
              style={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            />
          </div>
        )}
      </div>

      {/* Mode & Aspect Ratio Label */}
      <div className="absolute top-2 right-2 flex gap-2">
        {mode === 'static' && (
          <div className="bg-purple-500/80 text-white text-xs px-2 py-1 rounded font-medium">
            Static
          </div>
        )}
        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
          {aspectRatio}
        </div>
      </div>
    </div>
  );
}
