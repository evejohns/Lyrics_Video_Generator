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
}

export default function VideoPreview({
  currentTime = 0,
  lyrics = [],
  config,
  aspectRatio = '16:9',
  mode = 'animated',
  staticText = 'Sample lyric text for preview',
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
    <div className="relative w-full" style={{ maxWidth: dimensions.width }}>
      <div
        className={`relative rounded-lg shadow-xl ${overlayEffects} ${
          (config.visualEffects || []).includes('light-rays') ? '' : 'overflow-hidden'
        }`}
        style={{ paddingBottom: dimensions.paddingBottom }}
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

        {/* Lyrics Text */}
        <div className="absolute inset-0 flex items-center justify-center p-8 z-20">
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
              fontSize: `${(config.fontSize || 48) * 0.5}px`,
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
            }}
          >
            {displayText}
          </div>
        </div>
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
