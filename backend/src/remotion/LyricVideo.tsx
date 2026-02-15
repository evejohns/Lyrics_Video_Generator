import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, interpolate, spring, delayRender, continueRender } from 'remotion';
import { templates } from './templates';

// Google Fonts URL for all fonts used in templates and user font picker
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700;800;900&display=swap';

interface LyricLine {
  text: string;
  start_time: number | null;
  end_time: number | null;
}

interface LyricVideoProps {
  lyrics: LyricLine[];
  audioUrl: string;
  template: any;
  config: any; // Full VideoConfig with background, text, effects, etc.
  albumArtUrl?: string; // Album cover art URL
  title?: string; // Song title
  artist?: string; // Artist name
}

export const LyricVideo: React.FC<LyricVideoProps> = ({
  lyrics,
  audioUrl,
  template,
  config,
  albumArtUrl,
  title,
  artist,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Compute responsive scale factor based on the shorter dimension
  // 1080p landscape (1920x1080): scale=1, 1080p vertical (1080x1920): scale=1, 4K: scale=2
  const scale = Math.min(width, height) / 1080;
  const isVertical = height > width;

  // Delay rendering until Google Fonts are loaded
  const [fontHandle] = React.useState(() => delayRender('Loading Google Fonts'));
  React.useEffect(() => {
    const fontFamily = config.fontFamily || 'Inter';
    // Use document.fonts API to wait for the font to be ready
    document.fonts.ready.then(() => {
      // Also explicitly check that our target font loaded
      return document.fonts.load(`800 48px "${fontFamily}"`);
    }).then(() => {
      continueRender(fontHandle);
    }).catch((err) => {
      console.error('Font loading error:', err);
      // Continue anyway so render doesn't hang
      continueRender(fontHandle);
    });
  }, [fontHandle, config.fontFamily]);

  // Delay rendering until album art image is loaded (critical for thumbnails)
  const [albumArtHandle] = React.useState(() =>
    albumArtUrl ? delayRender('Loading album art image') : null
  );
  const [albumArtLoaded, setAlbumArtLoaded] = React.useState(!albumArtUrl);
  React.useEffect(() => {
    if (!albumArtUrl || !albumArtHandle) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setAlbumArtLoaded(true);
      continueRender(albumArtHandle);
    };
    img.onerror = (err) => {
      console.error('Album art loading error:', err);
      setAlbumArtLoaded(true);
      continueRender(albumArtHandle);
    };
    img.src = albumArtUrl;
    // Timeout fallback to prevent hanging
    const timeout = setTimeout(() => {
      if (!albumArtLoaded) {
        console.warn('Album art loading timed out, continuing render');
        setAlbumArtLoaded(true);
        continueRender(albumArtHandle);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [albumArtUrl, albumArtHandle]);

  // Convert frame to seconds
  const currentTime = frame / fps;

  // Opening title card: first 2 seconds
  const TITLE_CARD_DURATION = 2;
  const showTitleCard = currentTime < TITLE_CARD_DURATION;

  // Ending card: last 5 seconds of video
  const ENDING_CARD_DURATION = 5;
  const { durationInFrames } = useVideoConfig();
  const totalDurationSec = durationInFrames / fps;
  const endingCardStart = totalDurationSec - ENDING_CARD_DURATION;
  const showEndingCard = currentTime >= endingCardStart;

  // Find current lyric based on time
  const currentLyric = lyrics.find((lyric) => {
    if (!lyric.start_time) return false;
    const endTime = lyric.end_time || lyric.start_time + 5;
    return currentTime >= lyric.start_time && currentTime < endTime;
  });

  // Look up template by ID (same as VideoPreview does)
  const templateData: any = templates.find((t: any) => t.id === config.template) || templates[0];

  // Use template data for rendering (same as preview)
  const backgroundColors = templateData.gradient.join(', ');
  const backgroundType = templateData.config.background?.gradientType || 'linear';
  const backgroundPattern = templateData.config.background?.pattern || '';
  const decorativeElements = templateData.config.effects?.decorativeShapes || [];

  // Calculate optimal text color
  const calculateLuminance = (hexColor: string): number => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
  };

  // Use template colors for luminance calculation
  const luminances = templateData.gradient.map((color: string) => calculateLuminance(color));
  const maxLuminance = Math.max(...luminances);

  // Calculate optimal text and outline colors based on background luminance
  // This matches the VideoPreview component's approach for consistent look
  const textColor = maxLuminance < 0.35 ? '#FFFFFF' : '#000000';
  const outlineColor = maxLuminance < 0.35 ? '#000000' : '#FFFFFF';
  const outlineWidth = 6;

  // Heavy multi-layer shadow matching VideoPreview for maximum readability
  const textShadow = maxLuminance < 0.35
    ? '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.8)'
    : '0 0 30px rgba(255,255,255,1), 0 0 20px rgba(255,255,255,0.95), 0 6px 12px rgba(255,255,255,0.9), 0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.7)';

  // Only show text if there's a current lyric
  const displayText = currentLyric?.text || '';

  // User-selected font settings (from ProjectEditor config, matching VideoPreview)
  // These override template defaults when the user has customized them
  const userFontFamily = config.fontFamily || templateData.config.text?.font || 'Inter, Arial, sans-serif';
  const userFontSize = config.fontSize || templateData.config.text?.size || 64;
  const userFontWeight = templateData.config.text?.weight || '800';

  // Text style effects from template (glitch, neon, 3d, etc.)
  const textStyleEffect = templateData.config.text?.styleEffect || '';

  // Get background effects from config
  const backgroundEffects = config.backgroundEffects || [];

  // Get visual effects from config (sparkle, light-rays, etc.)
  const visualEffects = config.visualEffects || [];
  const hasSparkle = visualEffects.includes('sparkle');
  const hasLightRays = visualEffects.includes('light-rays');

  // Animation calculations with Remotion's interpolate for smoother transitions
  // Gradient Shift: 8 seconds cycle using interpolate
  const gradientCycleFrame = frame % (fps * 8);
  const gradientPosition = interpolate(
    gradientCycleFrame,
    [0, fps * 2, fps * 4, fps * 6, fps * 8],
    [50, 100, 50, 0, 50],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Color Wave: 10 seconds cycle with smooth interpolation
  const colorCycleFrame = frame % (fps * 10);
  const hueRotation = interpolate(
    colorCycleFrame,
    [0, fps * 10],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const saturation = interpolate(
    colorCycleFrame,
    [0, fps * 2.5, fps * 5, fps * 7.5, fps * 10],
    [1, 1.2, 1, 0.8, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Apply background animations
  const hasGradientShift = backgroundEffects.includes('gradient-shift');
  const hasColorWave = backgroundEffects.includes('color-wave');

  // Build filter string for color wave
  const backgroundFilter = hasColorWave
    ? `hue-rotate(${hueRotation}deg) saturate(${saturation})`
    : 'none';

  // Sparkle effect: brightness + drop-shadow pulsing on text (1.5s cycle)
  const sparkleCycleFrame = frame % (fps * 1.5);
  const sparkleBrightness = hasSparkle
    ? interpolate(
        sparkleCycleFrame,
        [0, fps * 0.75, fps * 1.5],
        [1, 1.3, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 1;
  const sparkleGlow = hasSparkle
    ? interpolate(
        sparkleCycleFrame,
        [0, fps * 0.75, fps * 1.5],
        [0, 8, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // Light rays: rotating conic gradient (20s cycle)
  const lightRaysCycleFrame = frame % (fps * 20);
  const lightRaysRotation = interpolate(
    lightRaysCycleFrame,
    [0, fps * 20],
    [0, 360],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Build text style effect inline styles (replicate CSS effects for Remotion)
  // Shared between lyrics and music emoji for consistent styling
  const hasStyleEffect = ['glitch', 'neon', '3d', 'rgb-split', 'chromatic', 'holographic'].includes(textStyleEffect);
  const getEffectStyles = (): React.CSSProperties => {
    const cycleFrame = frame % (fps * 2);
    const effectProgress = cycleFrame / (fps * 2);
    const effectSin = Math.sin(effectProgress * Math.PI * 2);

    switch (textStyleEffect) {
      case 'rgb-split': {
        const offset = 2 + effectSin * 2;
        return { textShadow: `${-offset}px 0 red, ${offset}px 0 cyan` };
      }
      case 'chromatic': {
        const offset = 2 + effectSin * 2;
        return { textShadow: `${-offset}px 0 rgba(255,0,0,0.8), ${offset}px 0 rgba(0,255,255,0.8)` };
      }
      case 'neon': {
        const brightness = 1 + Math.sin(effectProgress * Math.PI * 2) * 0.3;
        return {
          textShadow: `0 0 ${5 * brightness}px currentColor, 0 0 ${10 * brightness}px currentColor, 0 0 ${20 * brightness}px currentColor, 0 0 ${40 * brightness}px currentColor`,
          filter: `brightness(${brightness})`,
        };
      }
      case '3d':
        return { textShadow: '1px 1px 0 rgba(0,0,0,0.3), 2px 2px 0 rgba(0,0,0,0.25), 3px 3px 0 rgba(0,0,0,0.2), 4px 4px 0 rgba(0,0,0,0.15), 5px 5px 0 rgba(0,0,0,0.1), 6px 6px 10px rgba(0,0,0,0.5)' };
      case 'glitch': {
        const glitchX = effectSin * 2;
        return { textShadow: `${-glitchX}px ${glitchX}px 0 #ff00c1, ${glitchX}px ${-glitchX}px 0 #3498db` };
      }
      case 'holographic': {
        const bgPos = effectProgress * 400;
        return {
          background: `linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ff0080, #ff8c00)`,
          backgroundSize: '400% 400%',
          backgroundPosition: `${bgPos}% 50%`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        };
      }
      default:
        return {};
    }
  };
  const effectStyles = hasStyleEffect ? getEffectStyles() : {};

  return (
    <AbsoluteFill>
      {/* Load Google Fonts for Remotion headless Chrome rendering */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href={GOOGLE_FONTS_URL} rel="stylesheet" />

      {/* Audio */}
      <Audio src={audioUrl} />

      {/* Background Gradient */}
      <AbsoluteFill
        style={{
          background:
            backgroundType === 'radial'
              ? `radial-gradient(circle, ${backgroundColors})`
              : `linear-gradient(135deg, ${backgroundColors})`,
          backgroundSize: hasGradientShift ? '200% 200%' : '100% 100%',
          backgroundPosition: hasGradientShift ? `${gradientPosition}% 50%` : '0% 0%',
          filter: backgroundFilter,
        }}
      />

      {/* Pattern Overlays — render each pattern class found in the template */}
      {backgroundPattern.includes('pattern-grid') && (
        <AbsoluteFill
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-dots') && (
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-diagonal') && (
        <AbsoluteFill
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-circles') && (
        <AbsoluteFill
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-waves') && (() => {
        // Animated waves: SVG wave pattern that scrolls horizontally
        const waveCycleDuration = fps * 3;
        const waveCycleFrame = frame % waveCycleDuration;
        const waveOffset = interpolate(waveCycleFrame, [0, waveCycleDuration], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <AbsoluteFill
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q 25 0, 50 10 T 100 10' stroke='rgba(255,255,255,0.1)' stroke-width='2' fill='none'/%3E%3C/svg%3E\")",
              backgroundSize: '100px 20px',
              backgroundPosition: `${waveOffset}px 0`,
            }}
          />
        );
      })()}
      {backgroundPattern.includes('pattern-stars') && (() => {
        const starsCycleDuration = fps * 20;
        const starsCycleFrame = frame % starsCycleDuration;
        const starsOffset = interpolate(starsCycleFrame, [0, starsCycleDuration], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return (
          <AbsoluteFill
            style={{
              backgroundImage: 'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent), radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent), radial-gradient(2px 2px at 90% 60%, white, transparent), radial-gradient(1px 1px at 33% 80%, white, transparent), radial-gradient(1px 1px at 70% 20%, white, transparent)',
              backgroundSize: '200px 200px',
              backgroundPosition: `${starsOffset}% ${starsOffset}%`,
              opacity: 0.6,
            }}
          />
        );
      })()}
      {backgroundPattern.includes('pattern-hexagons') && (
        <AbsoluteFill
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 17.5 L60 52.5 L30 70 L0 52.5 L0 17.5 Z' fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='2'/%3E%3C/svg%3E\")",
            backgroundSize: '60px 104px',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-triangles') && (
        <AbsoluteFill
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 60 L0 60 Z' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='2'/%3E%3C/svg%3E\")",
            backgroundSize: '60px 60px',
          }}
        />
      )}
      {backgroundPattern.includes('pattern-hearts') && (
        <AbsoluteFill
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,35 C20,35 5,25 5,15 C5,10 8,7 12,7 C15,7 18,9 20,12 C22,9 25,7 28,7 C32,7 35,10 35,15 C35,25 20,35 20,35 Z' fill='none' stroke='rgba(255,182,193,0.1)' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Film Grain Effect — uses inline SVG for reliable rendering in headless Chromium */}
      {templateData.config.effects?.filmGrain && (() => {
        // Use a unique seed per frame for animated grain
        const seed = frame % 100;
        return (
          <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.5 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <filter id={`grain-${seed}`}>
                <feTurbulence type="fractalNoise" baseFrequency="3.5" numOctaves="4" seed={seed} />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter={`url(#grain-${seed})`} opacity="0.2" />
            </svg>
          </AbsoluteFill>
        );
      })()}

      {/* VHS Effect — scanlines + color offset */}
      {templateData.config.effects?.vhsEffect && (
        <AbsoluteFill
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
            backgroundSize: '100% 3px',
            pointerEvents: 'none',
            opacity: 0.4,
          }}
        />
      )}

      {/* Light Rays Effect — rotating conic gradient overlay */}
      {hasLightRays && (
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(255, 255, 255, 0.1) 30deg,
              transparent 60deg,
              rgba(255, 255, 255, 0.1) 90deg,
              transparent 120deg,
              rgba(255, 255, 255, 0.1) 150deg,
              transparent 180deg,
              rgba(255, 255, 255, 0.1) 210deg,
              transparent 240deg,
              rgba(255, 255, 255, 0.1) 270deg,
              transparent 300deg,
              rgba(255, 255, 255, 0.1) 330deg,
              transparent 360deg
            )`,
            transform: `rotate(${lightRaysRotation}deg)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Decorative Elements with Animation Matching Preview */}
      {decorativeElements.map((shape: any, index: number) => {
        // Match animation behavior to CSS classes used in preview
        const animationType = shape.animation || 'animate-float-slow';
        const baseRotation = shape.rotate || 0;

        // Different animation patterns based on shape.animation property
        let floatX = 0;
        let floatY = 0;
        let floatRotate = 0;
        let floatOpacity = 0.4;

        if (animationType === 'animate-float-slow') {
          // Match CSS: float animation, 15s duration, 2x scale for 1920x1080
          const cycleDuration = fps * 15;
          const cycleFrame = (frame + index * fps * 3) % cycleDuration;

          // CSS keyframes: 0%/100% -> 25% -> 50% -> 75% (scaled 2x)
          floatX = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 40, -40, 60, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatY = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, -60, -120, -80, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatRotate = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 90, 180, 270, 360],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatOpacity = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0.3, 0.6, 0.4, 0.7, 0.3],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
        } else if (animationType === 'animate-float-medium') {
          // Match CSS: float animation, 10s duration, 2x scale for 1920x1080
          const cycleDuration = fps * 10;
          const cycleFrame = (frame + index * fps * 2) % cycleDuration;

          // CSS keyframes: 0%/100% -> 25% -> 50% -> 75% (scaled 2x)
          floatX = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 40, -40, 60, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatY = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, -60, -120, -80, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatRotate = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 90, 180, 270, 360],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatOpacity = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0.3, 0.6, 0.4, 0.7, 0.3],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
        } else if (animationType === 'animate-float-fast') {
          // Match CSS: float animation, 6s duration (fast), 2x scale for 1920x1080
          const cycleDuration = fps * 6;
          const cycleFrame = (frame + index * fps * 1.5) % cycleDuration;

          floatX = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 40, -40, 60, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatY = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, -60, -120, -80, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatRotate = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0, 90, 180, 270, 360],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatOpacity = interpolate(
            cycleFrame,
            [0, cycleDuration * 0.25, cycleDuration * 0.5, cycleDuration * 0.75, cycleDuration],
            [0.3, 0.6, 0.4, 0.7, 0.3],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
        } else if (animationType === 'animate-spin-slow') {
          // Match CSS: spin animation, 20s duration
          const cycleDuration = fps * 20;
          const cycleFrame = (frame + index * fps * 2) % cycleDuration;

          floatRotate = interpolate(
            cycleFrame,
            [0, cycleDuration],
            [0, 360],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          floatX = 0;
          floatY = 0;
          floatOpacity = 0.4;
        } else if (animationType === 'none') {
          // Static - no animation
          floatX = 0;
          floatY = 0;
          floatRotate = 0;
          floatOpacity = 0.4;
        }

        // Scale shapes proportionally to video dimensions
        const scaleSize = (size: string) => {
          const px = parseInt(size);
          return `${Math.round(px * scale * 2)}px`;
        };

        const shapeStyle: React.CSSProperties = {
          position: 'absolute',
          top: shape.top || '10%',
          left: shape.left || '10%',
          width: scaleSize(shape.size || '200px'),
          height: scaleSize(shape.size || '200px'),
          borderRadius: shape.type === 'circle' ? '50%' : '0',
          backgroundColor: shape.color || 'rgba(255,255,255,0.1)',
          opacity: floatOpacity,
          transform: `translate(${floatX}px, ${floatY}px) rotate(${baseRotation + floatRotate}deg)`,
        };

        // Handle different shape types
        if (shape.type === 'emoji' || shape.type === 'star') {
          // Render emoji or star as text
          const displayChar = shape.type === 'star' ? '★' : shape.emoji || '⭐';
          return (
            <div
              key={index}
              style={{
                ...shapeStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: scaleSize(shape.size || '80px'),
                backgroundColor: 'transparent',
              }}
            >
              {displayChar}
            </div>
          );
        }

        if (shape.type === 'triangle') {
          const scaledSize = parseInt(shape.size || '100') * 2;
          shapeStyle.width = '0';
          shapeStyle.height = '0';
          shapeStyle.borderLeft = `${scaledSize / 2}px solid transparent`;
          shapeStyle.borderRight = `${scaledSize / 2}px solid transparent`;
          shapeStyle.borderBottom = `${scaledSize}px solid ${shape.color || 'rgba(255,255,255,0.1)'}`;
          shapeStyle.backgroundColor = 'transparent';
        }

        return <div key={index} style={shapeStyle} />;
      })}

      {/* Vignette overlay for title card */}
      {showTitleCard && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Opening Title Card or Lyrics Text */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${Math.round(40 * scale)}px`,
        }}
      >
        {(() => {
          // Show title card for first 2 seconds
          if (showTitleCard && title) {
            const titleCardOpacity = interpolate(
              frame,
              [0, 15, fps * 1.7, fps * 2],
              [0, 1, 1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            // Staggered entrance animations (fast enough to be fully visible by frame 30)
            const titleY = interpolate(frame, [0, 12], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const titleScale = spring({ frame, fps, config: { damping: 80, stiffness: 200, mass: 0.4 } });
            const subtitleOpacity = interpolate(frame, [5, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const artistOpacity = interpolate(frame, [8, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            const artistY = interpolate(frame, [8, 18], [20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

            const albumArtScale = spring({ frame: Math.max(0, frame - 2), fps, config: { damping: 80, stiffness: 200, mass: 0.4 } });

            const fontFamily = userFontFamily;
            const baseFontSize = userFontSize;

            // For vertical: stack album art above text; for landscape: side by side
            const albumArtSize = Math.round((isVertical ? 280 : 480) * scale);
            const titleGap = Math.round((isVertical ? 40 : 100) * scale);

            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: isVertical ? 'column' : 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: albumArtUrl ? `${titleGap}px` : '0px',
                  opacity: titleCardOpacity,
                  width: '100%',
                }}
              >
                {/* Album Art */}
                {albumArtUrl && (
                  <div
                    style={{
                      flexShrink: 0,
                      transform: `scale(${albumArtScale})`,
                    }}
                  >
                    <img
                      src={albumArtUrl}
                      crossOrigin="anonymous"
                      alt="Album Art"
                      style={{
                        width: `${albumArtSize}px`,
                        height: `${albumArtSize}px`,
                        borderRadius: `${Math.round(24 * scale)}px`,
                        objectFit: 'cover',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 10px 30px rgba(0,0,0,0.25)',
                        border: `${Math.round(4 * scale)}px solid rgba(255,255,255,0.15)`,
                      }}
                    />
                  </div>
                )}

                {/* Text Info */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: (albumArtUrl && !isVertical) ? 'flex-start' : 'center',
                    gap: '0px',
                    maxWidth: (albumArtUrl && !isVertical) ? '55%' : '85%',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {/* Artist Name */}
                  {artist && (
                    <div
                      style={{
                        fontFamily,
                        fontSize: `${baseFontSize * 0.75}px`,
                        color: '#FFFFFF',
                        fontWeight: '600',
                        textAlign: (albumArtUrl && !isVertical) ? 'left' : 'center',
                        textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                        WebkitTextStroke: `${Math.max(1, outlineWidth * 0.4)}px ${outlineColor}`,
                        paintOrder: 'stroke fill',
                        opacity: artistOpacity,
                        transform: `translateY(${artistY}px)`,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        marginBottom: `${Math.round(16 * scale)}px`,
                      }}
                    >
                      {artist}
                    </div>
                  )}

                  {/* Song Title */}
                  <div
                    style={{
                      fontFamily,
                      fontSize: `${(isVertical ? baseFontSize * 1.2 : (albumArtUrl ? baseFontSize * 1.6 : baseFontSize * 1.8))}px`,
                      color: '#FFFFFF',
                      fontWeight: '900',
                      textAlign: (albumArtUrl && !isVertical) ? 'left' : 'center',
                      textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                      WebkitTextStroke: `${outlineWidth}px ${outlineColor}`,
                      paintOrder: 'stroke fill',
                      lineHeight: 1.05,
                      letterSpacing: '-0.02em',
                      transform: `translateY(${titleY}px) scale(${titleScale})`,
                    }}
                  >
                    {title}
                  </div>

                  {/* "Lyrics Video" label */}
                  <div
                    style={{
                      fontFamily,
                      fontSize: `${baseFontSize * 0.55}px`,
                      color: '#FFFFFF',
                      fontWeight: '500',
                      textAlign: (albumArtUrl && !isVertical) ? 'left' : 'center',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      opacity: subtitleOpacity * 0.7,
                      textShadow: '0 0 30px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.95), 0 6px 12px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.85)',
                      WebkitTextStroke: `${Math.max(1, outlineWidth * 0.3)}px ${outlineColor}`,
                      paintOrder: 'stroke fill',
                      marginTop: `${Math.round(24 * scale)}px`,
                    }}
                  >
                    Lyric Video
                  </div>
                </div>
              </div>
            );
          }

          // Show lyrics after title card
          if (!currentLyric) return null;

          // Calculate frames since lyric started
          const lyricStartFrame = currentLyric.start_time! * fps;
          const lyricEndTime = currentLyric.end_time || currentLyric.start_time! + 5;
          const lyricEndFrame = lyricEndTime * fps;
          const framesSinceLyricStart = frame - lyricStartFrame;

          // Get template animation type
          const animationType = templateData.config.text?.animation || 'fade';
          const animDuration = (templateData.config.text?.animationDuration || 0.5) * fps;

          // Calculate entrance animation based on template animation type
          let entranceTransform = '';
          let entranceOpacity = 1;

          // Scale animation distances proportionally to font size for visibility at 1920x1080
          const moveAmount = Math.max(20, userFontSize * 0.5); // e.g. 64px font → 32px movement
          const waveAmount = Math.max(15, userFontSize * 0.35); // e.g. 64px font → 22px wave

          switch (animationType) {
            case 'fade': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, animDuration], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = '';
              break;
            }
            case 'slide': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, animDuration], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const slideY = interpolate(
                framesSinceLyricStart, [0, animDuration], [moveAmount, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `translateY(${slideY}px)`;
              break;
            }
            case 'pop': {
              const popScale = spring({
                frame: framesSinceLyricStart, fps,
                config: { damping: 60, stiffness: 300, mass: 0.5 },
              });
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, 5], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `scale(${0.7 + popScale * 0.3})`;
              break;
            }
            case 'bounce': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, animDuration], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const bounceY = interpolate(
                framesSinceLyricStart,
                [0, animDuration * 0.5, animDuration * 0.7, animDuration],
                [-moveAmount, moveAmount * 0.3, -moveAmount * 0.15, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `translateY(${bounceY}px)`;
              break;
            }
            case 'zoom': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, animDuration], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const zoomScale = interpolate(
                framesSinceLyricStart, [0, animDuration], [0.3, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `scale(${zoomScale})`;
              break;
            }
            case 'rotate': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, animDuration], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const rotDeg = interpolate(
                framesSinceLyricStart, [0, animDuration], [-180, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const rotScale = interpolate(
                framesSinceLyricStart, [0, animDuration], [0.6, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `rotate(${rotDeg}deg) scale(${rotScale})`;
              break;
            }
            case 'wave': {
              // Wave entrance: one full oscillation cycle then stay still
              // Use longer duration (0.8s matching CSS) for more visible wave
              const waveDur = Math.max(1, Math.floor(fps * 0.8));
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, 8], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const waveProgress = Math.min(framesSinceLyricStart, waveDur) / waveDur;
              const waveY = Math.sin(waveProgress * Math.PI * 2) * waveAmount;
              entranceTransform = `translateY(${waveY}px)`;
              break;
            }
            case 'glitch': {
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, 5], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              // Glitch movement during entrance
              const glitchAmount = Math.max(8, userFontSize * 0.15);
              if (framesSinceLyricStart < animDuration) {
                const glitchProgress = framesSinceLyricStart / animDuration;
                const glitchPhase = glitchProgress * 5;
                const glitchX = Math.sin(glitchPhase * Math.PI) * glitchAmount * (1 - glitchProgress);
                const glitchY = Math.cos(glitchPhase * Math.PI) * glitchAmount * (1 - glitchProgress);
                entranceOpacity = 0.7 + glitchProgress * 0.3;
                entranceTransform = `translate(${glitchX}px, ${glitchY}px)`;
              } else {
                entranceTransform = '';
              }
              break;
            }
            default: {
              // Fallback: simple spring scale + fade
              const defaultScale = spring({
                frame: framesSinceLyricStart, fps,
                config: { damping: 100, stiffness: 200, mass: 0.5 },
              });
              entranceOpacity = interpolate(
                framesSinceLyricStart, [0, 15], [0, 1],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              const defaultY = interpolate(
                framesSinceLyricStart, [0, 20], [moveAmount * 0.6, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              );
              entranceTransform = `scale(${defaultScale}) translateY(${defaultY}px)`;
              break;
            }
          }

          // Exit animation: fade out in last 15 frames
          const exitOpacity = interpolate(
            frame,
            [lyricEndFrame - 15, lyricEndFrame],
            [1, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          // Combine entrance and exit opacity
          const finalOpacity = Math.min(entranceOpacity, exitOpacity);

          // Build sparkle filter for text
          const sparkleFilter = hasSparkle
            ? `brightness(${sparkleBrightness}) drop-shadow(0 0 ${sparkleGlow}px ${textColor})`
            : '';

          return (
            <div
              style={{
                fontFamily: userFontFamily,
                fontSize: `${userFontSize}px`,
                color: textStyleEffect === 'holographic' ? 'transparent' : textColor,
                fontWeight: userFontWeight,
                textAlign: 'center',
                textShadow: hasStyleEffect ? 'none' : textShadow,
                WebkitTextStroke: hasStyleEffect ? `${Math.max(2, outlineWidth * 0.5)}px ${outlineColor}` : `${outlineWidth}px ${outlineColor}`,
                paintOrder: 'stroke fill',
                maxWidth: '90%',
                lineHeight: 1.4,
                letterSpacing: '-0.02em',
                transform: entranceTransform,
                opacity: finalOpacity,
                filter: sparkleFilter || undefined,
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
                ...effectStyles,
              }}
            >
              {displayText}
            </div>
          );
        })()}
      </AbsoluteFill>

      {/* Music Emoji during instrumental gaps (3+ seconds with no lyrics) */}
      {(() => {
        if (showTitleCard || showEndingCard || currentLyric) return null;

        const MIN_GAP = 3;
        let prevEnd = TITLE_CARD_DURATION;
        let nextStart = endingCardStart;

        for (const lyric of lyrics) {
          if (!lyric.start_time) continue;
          const lEnd = lyric.end_time || lyric.start_time + 5;
          if (lEnd <= currentTime && lEnd > prevEnd) prevEnd = lEnd;
          if (lyric.start_time > currentTime && lyric.start_time < nextStart) nextStart = lyric.start_time;
        }

        const gapDuration = nextStart - prevEnd;
        if (gapDuration < MIN_GAP) return null;

        const timeInGap = currentTime - prevEnd;
        const fadeIn = interpolate(timeInGap, [0, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const fadeOut = interpolate(currentTime, [prevEnd + gapDuration - 0.5, prevEnd + gapDuration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

        return (
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: Math.min(fadeIn, fadeOut),
            }}
          >
            <div
              style={{
                fontFamily: userFontFamily,
                fontSize: `${userFontSize * 1.5}px`,
                fontWeight: userFontWeight,
                color: textStyleEffect === 'holographic' ? 'transparent' : textColor,
                textShadow: hasStyleEffect ? 'none' : textShadow,
                WebkitTextStroke: hasStyleEffect ? `${Math.max(2, outlineWidth * 0.5)}px ${outlineColor}` : `${outlineWidth}px ${outlineColor}`,
                paintOrder: 'stroke fill',
                letterSpacing: '0.3em',
                filter: hasSparkle ? `brightness(${sparkleBrightness}) drop-shadow(0 0 ${sparkleGlow}px ${textColor})` : undefined,
                ...effectStyles,
              }}
            >
              ♪ ♫
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* Ending Card - Subscribe / Like / Comment / Bell */}
      {showEndingCard && (() => {
        const endingFrame = frame - endingCardStart * fps;

        // Overall fade in
        const cardOpacity = interpolate(
          endingFrame,
          [0, 20],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Artist name drops in from top
        const artistY = interpolate(
          endingFrame,
          [0, 25],
          [-80, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const artistScale = spring({
          frame: endingFrame,
          fps,
          config: { damping: 80, stiffness: 180, mass: 0.6 },
        });

        // Subscribe button pops in (delayed)
        const subScale = spring({
          frame: Math.max(0, endingFrame - 15),
          fps,
          config: { damping: 60, stiffness: 200, mass: 0.5 },
        });
        const subRotate = interpolate(
          endingFrame,
          [15, 35],
          [-5, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Subscribe button pulse after appearing
        const subPulse = endingFrame > 45
          ? 1 + Math.sin((endingFrame - 45) * 0.15) * 0.04
          : 1;

        // Action buttons stagger in (like, comment, bell)
        const likeScale = spring({
          frame: Math.max(0, endingFrame - 30),
          fps,
          config: { damping: 70, stiffness: 220, mass: 0.4 },
        });
        const commentScale = spring({
          frame: Math.max(0, endingFrame - 38),
          fps,
          config: { damping: 70, stiffness: 220, mass: 0.4 },
        });
        const bellScale = spring({
          frame: Math.max(0, endingFrame - 46),
          fps,
          config: { damping: 70, stiffness: 220, mass: 0.4 },
        });

        // Bell ring animation
        const bellRing = endingFrame > 60
          ? Math.sin((endingFrame - 60) * 0.4) * 15 * Math.max(0, 1 - (endingFrame - 60) * 0.02)
          : 0;

        // "Thanks for watching" fade in
        const thanksOpacity = interpolate(
          endingFrame,
          [50, 70],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const thanksY = interpolate(
          endingFrame,
          [50, 70],
          [20, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Fade out at the very end
        const fadeOut = interpolate(
          endingFrame,
          [fps * ENDING_CARD_DURATION - 20, fps * ENDING_CARD_DURATION],
          [1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const finalCardOpacity = cardOpacity * fadeOut;

        const fontFamily = userFontFamily;

        const iconSize = Math.round(90 * scale);

        const actionBtnStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${Math.round(12 * scale)}px`,
        };

        const iconCircleStyle: React.CSSProperties = {
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          border: `${Math.round(2 * scale)}px solid rgba(255,255,255,0.2)`,
        };

        const iconLabelStyle: React.CSSProperties = {
          fontFamily,
          fontSize: `${Math.round(20 * scale)}px`,
          color: textColor,
          fontWeight: '600',
          textShadow,
          letterSpacing: '0.03em',
        };

        return (
          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: `${Math.round(40 * scale)}px`,
              opacity: finalCardOpacity,
              padding: `${Math.round(40 * scale)}px`,
            }}
          >
            {/* Artist Name */}
            <div
              style={{
                fontFamily,
                fontSize: `${Math.round(90 * scale)}px`,
                color: textColor,
                fontWeight: '900',
                textAlign: 'center',
                textShadow,
                WebkitTextStroke: `${outlineWidth}px ${outlineColor}`,
                paintOrder: 'stroke fill',
                letterSpacing: '-0.02em',
                transform: `translateY(${artistY}px) scale(${artistScale})`,
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
                transform: `scale(${subScale * subPulse}) rotate(${subRotate}deg)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
                  borderRadius: `${Math.round(16 * scale)}px`,
                  padding: `${Math.round(24 * scale)}px ${Math.round(72 * scale)}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${Math.round(18 * scale)}px`,
                  boxShadow: '0 8px 32px rgba(255,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                  border: `${Math.round(3 * scale)}px solid rgba(255,255,255,0.2)`,
                }}
              >
                {/* Play button icon */}
                <svg width={Math.round(40 * scale)} height={Math.round(40 * scale)} viewBox="0 0 24 24" fill="white">
                  <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
                </svg>
                <span
                  style={{
                    fontFamily,
                    fontSize: `${Math.round(42 * scale)}px`,
                    color: '#FFFFFF',
                    fontWeight: '900',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Subscribe
                </span>
              </div>
            </div>

            {/* Action Buttons Row: Like, Comment, Bell */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: `${Math.round(64 * scale)}px`,
              }}
            >
              {/* Like */}
              <div style={{ ...actionBtnStyle, transform: `scale(${likeScale})` }}>
                <div style={iconCircleStyle}>
                  <svg width={Math.round(44 * scale)} height={Math.round(44 * scale)} viewBox="0 0 24 24" fill={textColor}>
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                  </svg>
                </div>
                <span style={iconLabelStyle}>Like</span>
              </div>

              {/* Comment */}
              <div style={{ ...actionBtnStyle, transform: `scale(${commentScale})` }}>
                <div style={iconCircleStyle}>
                  <svg width={Math.round(44 * scale)} height={Math.round(44 * scale)} viewBox="0 0 24 24" fill={textColor}>
                    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
                  </svg>
                </div>
                <span style={iconLabelStyle}>Comment</span>
              </div>

              {/* Notification Bell */}
              <div style={{ ...actionBtnStyle, transform: `scale(${bellScale}) rotate(${bellRing}deg)` }}>
                <div style={iconCircleStyle}>
                  <svg width={Math.round(44 * scale)} height={Math.round(44 * scale)} viewBox="0 0 24 24" fill={textColor}>
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                </div>
                <span style={iconLabelStyle}>Notify</span>
              </div>
            </div>

            {/* Thanks for watching */}
            <div
              style={{
                fontFamily,
                fontSize: `${Math.round(32 * scale)}px`,
                color: textColor,
                fontWeight: '500',
                textAlign: 'center',
                textShadow,
                opacity: thanksOpacity,
                transform: `translateY(${thanksY}px)`,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Thanks for watching
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* Album Art - Bottom Right Corner with Remotion animations (hidden during title card) */}
      {albumArtUrl && !showTitleCard && (() => {
        // Entrance animation: fade in and scale up over first 45 frames (1.5s)
        const entranceProgress = spring({
          frame,
          fps,
          config: {
            damping: 200,
            stiffness: 100,
            mass: 0.5,
          },
        });

        // Gentle breathing animation: scale between 1.0 and 1.05
        const breathingProgress = (frame % (fps * 4)) / (fps * 4);
        const breathingScale = 1 + Math.sin(breathingProgress * Math.PI * 2) * 0.025;

        // Combine entrance and breathing
        const totalScale = entranceProgress * breathingScale;

        // Fade in opacity
        const opacity = interpolate(frame, [0, 30], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <AbsoluteFill
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: `${Math.round(40 * scale)}px`,
              pointerEvents: 'none',
            }}
          >
            <img
              src={albumArtUrl}
              crossOrigin="anonymous"
              alt="Album Art"
              style={{
                width: `${Math.round(120 * scale)}px`,
                height: `${Math.round(120 * scale)}px`,
                borderRadius: `${Math.round(12 * scale)}px`,
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3)',
                border: `${Math.round(3 * scale)}px solid rgba(255, 255, 255, 0.2)`,
                transform: `scale(${totalScale})`,
                opacity,
              }}
            />
          </AbsoluteFill>
        );
      })()}
    </AbsoluteFill>
  );
};
