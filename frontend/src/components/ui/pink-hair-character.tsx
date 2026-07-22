"use client";

import { useMemo, useState, useEffect, useId } from 'react';

export interface MousePos {
  x: number;
  y: number;
}

export interface PinkHairCharacterProps {
  mode: string;
  emailLength: number;
  showPassword?: boolean;
  mousePos?: MousePos;
  isSubmitting?: boolean;
  hasError?: boolean;
  className?: string;
}

export function PinkHairCharacter({ 
  mode, 
  emailLength, 
  showPassword = false, 
  mousePos = { x: 0, y: 0 }, 
  isSubmitting = false,
  hasError = false,
  className = "h-40 w-40" 
}: PinkHairCharacterProps) {
  const uniqueId = useId();
  const hairGradId = `hairGrad-${uniqueId.replace(/:/g, '')}`;
  const skinGradId = `skinGrad-${uniqueId.replace(/:/g, '')}`;
  const characterGlowId = `characterGlow-${uniqueId.replace(/:/g, '')}`;

  const hairGrad = `url(#${hairGradId})`;
  const skinGrad = `url(#${skinGradId})`;
  const characterGlow = `url(#${characterGlowId})`;

  const [idleState, setIdleState] = useState<'active' | 'music'>('active');
  const [loopTrigger, setLoopTrigger] = useState<number>(0);

  useEffect(() => {
    if (mode !== 'idle') {
      setIdleState('active');
      return;
    }

    setIdleState('active');

    // Timer for music mode (starts after 5 seconds of inactivity)
    const musicTimer = setTimeout(() => {
      setIdleState('music');
    }, 5000);

    // Timer to reset back to normal active state and loop (starts after 8 seconds - music mode lasts 3 seconds)
    const resetTimer = setTimeout(() => {
      setLoopTrigger(prev => prev + 1);
    }, 8000);

    return () => {
      clearTimeout(musicTimer);
      clearTimeout(resetTimer);
    };
  }, [mousePos, mode, loopTrigger]);

  const eyeOffset = useMemo<{ x: number; y: number }>(() => {
    if (mode !== 'email') return { x: 0, y: 0 };
    // The input is located to the right and slightly down from the mascot
    const xBase = Math.max(3, Math.min(8, 3 + (emailLength * 0.15)));
    const yBase = 2; // Look down slightly at the input field
    return { x: xBase, y: yBase };
  }, [emailLength, mode]);

  const finalEyeOffset = useMemo<{ x: number; y: number }>(() => {
    if (mode === 'email') return eyeOffset;
    if (mode === 'idle' && idleState === 'active') return { x: mousePos.x * 5, y: mousePos.y * 3 };
    return { x: 0, y: 0 };
  }, [mode, eyeOffset, mousePos, idleState]);

  const isPassword = mode === 'password';
  const isCovering = isPassword && !showPassword;
  const isPeeking = isPassword && showPassword;

  // Calculate head tilt and translate based on mouse position
  const headTransform = useMemo<string>(() => {
    if (isCovering) return 'translate(0px, 0px) rotate(0deg)';
    if (idleState === 'music') return 'translate(0px, 0px) rotate(0deg)'; // Handled by keyframe
    const rx = mousePos.x * 4; // max 4 degrees rotation
    const tx = mousePos.x * 3; // max 3px horizontal translation
    const ty = mousePos.y * 2; // max 2px vertical translation
    return `translate(${tx}px, ${ty}px) rotate(${rx}deg)`;
  }, [mousePos, isCovering, idleState]);

  const mouthPath = useMemo<string>(() => {
    if (hasError) {
      // Worry/sad curve
      return "M104 151 Q 110 145 116 151";
    }
    if (isSubmitting) {
      // Smiling mouth open
      return "M104 146 Q 110 154 116 146";
    }
    if (isCovering) {
      // Small surprised mouth
      return "M107 149 Q 110 152 113 149";
    }
    if (isPeeking) {
      // Cheeky mouth
      return "M105 148 Q 110 153 115 148";
    }
    if (mode === 'email') {
      return "M105 148 Q 110 151 115 148";
    }
    if (idleState === 'music') {
      // Open mouth singing/humming
      return "M105 146 Q 110 152 115 146";
    }
    return "M106 149 Q 110 152 114 149";
  }, [mode, isCovering, isPeeking, isSubmitting, hasError, idleState]);

  // Determine neon class based on states
  const neonClass = useMemo<string>(() => {
    if (hasError) return "animate-neon-error";
    if (idleState === 'music') return "animate-rgb-rainbow";
    return "animate-neon";
  }, [hasError, idleState]);

  return (
    <div className={`mx-auto relative character-container ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes character-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.7%); }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes heart-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        @keyframes blink {
          0%, 96%, 100% { transform: scaleY(1); }
          98% { transform: scaleY(0.1); }
        }
        @keyframes neon-pulse {
          0%, 100% { filter: drop-shadow(0 0 1px #D4AF37) drop-shadow(0 0 3px #D4AF37); opacity: 0.8; }
          50% { filter: drop-shadow(0 0 3px #D4AF37) drop-shadow(0 0 8px #D4AF37); opacity: 1; }
        }
        @keyframes neon-pulse-error {
          0%, 100% { filter: drop-shadow(0 0 1px #FF3B30) drop-shadow(0 0 3px #FF3B30); }
          50% { filter: drop-shadow(0 0 3px #FF3B30) drop-shadow(0 0 8px #FF3B30); }
        }
        @keyframes neon-pulse-fast {
          0%, 100% { filter: drop-shadow(0 0 2px #00F0FF) drop-shadow(0 0 5px #00F0FF); opacity: 0.9; }
          50% { filter: drop-shadow(0 0 5px #00F0FF) drop-shadow(0 0 12px #00F0FF); opacity: 1; }
        }
        @keyframes music-sway {
          0%, 100% { transform: translate(0, 0) rotate(-2.5deg); }
          50% { transform: translate(0, 0.5%) rotate(2.5deg); }
        }
        @keyframes rgb-rainbow {
          0% { stroke: #FF007F; filter: drop-shadow(0 0 1px #FF007F); }
          33% { stroke: #00F0FF; filter: drop-shadow(0 0 1px #00F0FF); }
          66% { stroke: #39FF14; filter: drop-shadow(0 0 1px #39FF14); }
          100% { stroke: #FF007F; filter: drop-shadow(0 0 1px #FF007F); }
        }
        @keyframes rgb-rainbow-fill {
          0% { fill: #FF007F; filter: drop-shadow(0 0 1px #FF007F); }
          33% { fill: #00F0FF; filter: drop-shadow(0 0 1px #00F0FF); }
          66% { fill: #39FF14; filter: drop-shadow(0 0 1px #39FF14); }
          100% { fill: #FF007F; filter: drop-shadow(0 0 1px #FF007F); }
        }
        @keyframes note-float-left {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translate(-6.8%, -13.6%) scale(1); opacity: 0; }
        }
        @keyframes note-float-right {
          0% { transform: translate(0, 0) scale(0.6); opacity: 0; }
          30% { opacity: 0.8; }
          100% { transform: translate(6.8%, -13.6%) scale(1); opacity: 0; }
        }
        
        .animate-character { 
          animation: character-float 4s ease-in-out infinite; 
          transform-box: view-box;
          transform-origin: 50% 50%;
        }
        .animate-sparkle { 
          animation: sparkle-twinkle 3s ease-in-out infinite; 
          transform-box: view-box;
          transform-origin: center;
        }
        .animate-heart { 
          animation: heart-pulse 2.5s ease-in-out infinite; 
          transform-box: view-box;
          transform-origin: center;
        }
        .animate-blink { 
          animation: blink 5s infinite;
          transform-origin: 50% 55.5%;
          transform-box: view-box;
        }
        .animate-neon {
          animation: neon-pulse 2s ease-in-out infinite;
        }
        .animate-neon-error {
          animation: neon-pulse-error 1s ease-in-out infinite;
        }
        .animate-rgb-rainbow {
          animation: rgb-rainbow 3s linear infinite;
        }
        rect.animate-rgb-rainbow {
          animation: rgb-rainbow-fill 3s linear infinite;
          stroke: #3A202A !important;
        }
        .animate-headsway {
          animation: music-sway 1.2s ease-in-out infinite;
          transform-box: view-box;
          transform-origin: 50% 65.9%;
        }
        .animate-note-l {
          animation: note-float-left 2s ease-in-out infinite;
          transform-box: view-box;
        }
        .animate-note-r {
          animation: note-float-right 2s ease-in-out infinite;
          transform-box: view-box;
        }
        .head-group {
          transform-box: view-box;
          transform-origin: 50% 65.9%;
        }

        /* Hover Interactive Effects */
        .character-container {
          cursor: pointer;
        }
        .character-container:hover .animate-neon {
          animation: neon-pulse-fast 0.8s ease-in-out infinite;
          stroke: #00F0FF !important;
        }
        .character-container:hover rect.animate-neon {
          fill: #00F0FF !important;
          stroke: #3A202A !important;
        }
        .character-container:hover .blush-cheek {
          opacity: 0.95;
          fill: #FF7A90;
        }
        .character-container:hover .sparkle-path {
          fill: #00F0FF;
        }
        .animate-headsway .blush-cheek {
          opacity: 0.95 !important;
          fill: #FF7A90 !important;
        }

        /* Dark / Light Mode Styles */
        .character-glow-flood {
          flood-color: #AA7C11;
          transition: flood-color 0.3s ease;
        }
        html.dark .character-glow-flood,
        :global(.dark) .character-glow-flood,
        .dark .character-glow-flood {
          flood-color: #D4AF37;
        }

        .sparkle-path {
          fill: #AA7C11;
          transition: fill 0.3s ease;
        }
        html.dark .sparkle-path,
        :global(.dark) .sparkle-path,
        .dark .sparkle-path {
          fill: #D4AF37;
        }

        .heart-path {
          fill: #800020;
          transition: fill 0.3s ease;
        }
        html.dark .heart-path,
        :global(.dark) .heart-path,
        .dark .heart-path {
          fill: #FF7A90;
        }
      `}} />

      <svg
        viewBox="0 0 220 220"
        role="img"
        aria-label="Nhân vật nàng thơ tóc hồng"
        className="h-full w-full overflow-visible animate-character"
      >
        <defs>
          <linearGradient id={hairGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F9C6D5" />
            <stop offset="100%" stopColor="#EAA3B6" />
          </linearGradient>
          <linearGradient id={skinGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF3ED" />
            <stop offset="100%" stopColor="#FDE8E1" />
          </linearGradient>
          <filter id={characterGlowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
            <feFlood floodOpacity={0.8} result="color" className="character-glow-flood" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="animate-sparkle" style={{ animationDelay: '0s' }}>
          <path d="M30 60 L 32 55 L 37 53 L 32 51 L 30 46 L 28 51 L 23 53 L 28 55 Z" className="sparkle-path" filter={characterGlow} />
        </g>
        <g className="animate-sparkle" style={{ animationDelay: '1.5s' }}>
          <path d="M190 80 L 192 75 L 197 73 L 192 71 L 190 66 L 188 71 L 183 73 L 188 75 Z" className="sparkle-path" filter={characterGlow} />
        </g>
        <g className="animate-heart" style={{ animationDelay: '0.5s' }}>
          <path d="M40 100 C 40 95, 45 90, 50 90 C 55 90, 60 95, 60 100 C 60 110, 50 120, 50 120 C 50 120, 40 110, 40 100" className="heart-path" filter={characterGlow} />
        </g>
        <g className="animate-heart" style={{ animationDelay: '2s' }}>
          <path d="M170 140 C 170 135, 175 130, 180 130 C 185 130, 190 135, 190 140 C 190 150, 180 160, 180 160 C 180 160, 170 150, 170 140" className="heart-path" filter={characterGlow} />
        </g>

        {/* Floating Music Notes during music mode */}
        {idleState === 'music' && (
          <g>
            {/* Left Note */}
            <path d="M22 80 A 2 2 0 1 1 20 77 L 20 70 L 26 70 L 26 73 L 20 73 M 20 70" fill="#00F0FF" className="animate-note-l" style={{ animationDelay: '0s' }} />
            <path d="M18 90 A 2 2 0 1 1 16 87 L 16 80 L 22 80 L 22 83 L 16 83 M 16 80" fill="#FF007F" className="animate-note-l" style={{ animationDelay: '0.8s' }} />
            
            {/* Right Note */}
            <path d="M198 80 A 2 2 0 1 1 196 77 L 196 70 L 202 70 L 202 73 L 196 73 M 196 70" fill="#39FF14" className="animate-note-r" style={{ animationDelay: '0.4s' }} />
            <path d="M202 90 A 2 2 0 1 1 200 87 L 200 80 L 206 80 L 206 83 L 200 83 M 200 80" fill="#00F0FF" className="animate-note-r" style={{ animationDelay: '1.2s' }} />
          </g>
        )}

        <g filter={characterGlow}>
          {/* Hair Back */}
          <path d="M65 25 C 40 25, 25 70, 30 140 C 33 190, 40 220, 40 220 L 180 220 C 180 220, 187 190, 190 140 C 195 70, 180 25, 155 25 C 130 15, 90 15, 65 25 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" />
          
          {/* BODY / TECHWEAR HOODIE */}
          {/* Hoodie Base */}
          <path d="M48 172 C 43 185, 38 220, 38 220 L 182 220 C 182 220, 177 185, 172 172 C 142 162, 78 162, 48 172 Z" fill="#1C1D22" stroke="#3A202A" strokeWidth="2.5" />
          
          {/* Hoodie Collar/Neck opening */}
          <path d="M72 162 C 62 175, 58 220, 58 220 L 162 220 C 162 220, 158 175, 148 162 C 133 154, 87 154, 72 162 Z" fill="#2E3038" stroke="#3A202A" strokeWidth="2" />
          
          {/* Neon Stripe lines on hoodie */}
          <path d="M78 175 L 78 220" fill="none" stroke={hasError ? "#FF3B30" : "#D4AF37"} strokeWidth="2" className={neonClass} />
          <path d="M142 175 L 142 220" fill="none" stroke={hasError ? "#FF3B30" : "#D4AF37"} strokeWidth="2" className={neonClass} />
          
          {/* Hoodie Zipper */}
          <path d="M110 162 L 110 205" fill="none" stroke="#3A202A" strokeWidth="3" strokeLinecap="round" />
          <path d="M110 164 L 110 185" fill="none" stroke={hasError ? "#FF3B30" : "#D4AF37"} strokeWidth="1.5" strokeLinecap="round" className={neonClass} />
          
          {/* Neck */}
          <path d="M98 145 L 98 165 C 106 170, 114 170, 122 165 L 122 145 Z" fill={skinGrad} stroke="#3A202A" strokeWidth="2" />
          <path d="M98 145 C 106 155, 114 155, 122 145" fill="none" stroke="#D1B3AA" strokeWidth="2.5" />

          {/* DYNAMIC INTERACTIVE HEAD GROUP */}
          <g 
            style={{ transform: headTransform, transformOrigin: '50% 65.9%', transformBox: 'view-box', transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }} 
            className={`head-group ${idleState === 'music' ? 'animate-headsway' : ''}`}
          >
            {/* Face Base */}
            <path d="M50 100 C 50 40, 80 30, 110 30 C 140 30, 170 40, 170 100 C 170 145, 140 165, 110 165 C 80 165, 50 145, 50 100 Z" fill={skinGrad} stroke="#3A202A" strokeWidth="2.5" />
            
            {/* GAMING HEADSET */}
            {/* Headband */}
            <path d="M 62 48 A 66 66 0 0 1 158 48" fill="none" stroke="#25262B" strokeWidth="7" strokeLinecap="round" />
            <path d="M 66 48 A 62 62 0 0 1 154 48" fill="none" stroke={hasError ? "#FF3B30" : "#D4AF37"} strokeWidth="2" strokeLinecap="round" className={neonClass} />
            
            {/* Left Ear Cup */}
            <rect x="36" y="86" width="16" height="38" rx="8" fill="#1C1D22" stroke="#3A202A" strokeWidth="2.5" />
            <rect x="42" y="93" width="5" height="24" rx="2.5" fill={hasError ? "#FF3B30" : "#D4AF37"} className={neonClass} />
            
            {/* Right Ear Cup */}
            <rect x="168" y="86" width="16" height="38" rx="8" fill="#1C1D22" stroke="#3A202A" strokeWidth="2.5" />
            <rect x="172" y="93" width="5" height="24" rx="2.5" fill={hasError ? "#FF3B30" : "#D4AF37"} className={neonClass} />

            {/* Blush cheeks */}
            <ellipse cx={75} cy={132} rx={12} ry={6} fill="#FFA5B5" opacity={0.6} className="blush-cheek" style={{ transition: 'all 0.3s ease' }} />
            <ellipse cx={145} cy={132} rx={12} ry={6} fill="#FFA5B5" opacity={0.6} className="blush-cheek" style={{ transition: 'all 0.3s ease' }} />
            <path d="M70 132 L 75 128 M 75 133 L 80 129 M 80 134 L 85 130" fill="none" stroke="#FF7A90" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />
            <path d="M135 130 L 140 134 M 140 129 L 145 133 M 145 128 L 150 132" fill="none" stroke="#FF7A90" strokeWidth="1.5" strokeLinecap="round" opacity={0.5} />

            {/* EYES */}
            {!isCovering && (
              <g className={`transition-transform duration-300 ${isPeeking ? 'translate-y-1' : ''}`}>
                {isSubmitting ? (
                  // Closed Happy Eyes when submitting
                  <g>
                    <path d="M60 120 Q 79 110 98 120" fill="none" stroke="#251515" strokeWidth="5.5" strokeLinecap="round" />
                    <path d="M160 120 Q 141 110 122 120" fill="none" stroke="#251515" strokeWidth="5.5" strokeLinecap="round" />
                  </g>
                ) : (
                  // Default eyes with blinking
                  <>
                    <g transform={`translate(${finalEyeOffset.x}, ${finalEyeOffset.y})`} style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <g className="animate-blink">
                        <path d="M60 115 C 70 100, 90 100, 98 115" fill="none" stroke="#251515" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M60 115 C 55 120, 55 125, 58 130" fill="none" stroke="#251515" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M65 95 Q 77 90 90 95" fill="none" stroke="#C47A8A" strokeWidth="2" strokeLinecap="round" />
                        <ellipse cx={79} cy={122} rx={14} ry={18} fill="#5F3A2A" />
                        <ellipse cx={79} cy={122} rx={8} ry={11} fill="#2A150F" />
                        <circle cx={73} cy={112} r={6} fill="#FFF" />
                        <circle cx={86} cy={132} r={3} fill="#FFF" opacity={0.8} />
                        <path d="M68 128 C 75 140, 88 135, 90 125 C 88 133, 75 135, 68 128 Z" fill="#995E40" opacity={0.8} />
                      </g>
                    </g>
                    <g transform={`translate(${finalEyeOffset.x}, ${finalEyeOffset.y})`} style={{ transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <g className="animate-blink">
                        <path d="M160 115 C 150 100, 130 100, 122 115" fill="none" stroke="#251515" strokeWidth="4.5" strokeLinecap="round" />
                        <path d="M160 115 C 165 120, 165 125, 162 130" fill="none" stroke="#251515" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M155 95 Q 143 90 130 95" fill="none" stroke="#C47A8A" strokeWidth="2" strokeLinecap="round" />
                        <ellipse cx={141} cy={122} rx={14} ry={18} fill="#5F3A2A" />
                        <ellipse cx={141} cy={122} rx={8} ry={11} fill="#2A150F" />
                        <circle cx={147} cy={112} r={6} fill="#FFF" />
                        <circle cx={134} cy={132} r={3} fill="#FFF" opacity={0.8} />
                        <path d="M152 128 C 145 140, 132 135, 130 125 C 132 133, 145 135, 152 128 Z" fill="#995E40" opacity={0.8} />
                      </g>
                    </g>
                  </>
                )}
              </g>
            )}

            {/* Nose & Mouth */}
            <circle cx={110} cy={138} r={1.5} fill="#4A3025" />
            <path d={mouthPath} fill="none" stroke="#4A3025" strokeWidth={2.5} strokeLinecap="round" />
            
            {/* Hair Front */}
            <path d="M60 50 Q 110 15 160 50 C 145 45, 75 45, 60 50 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" strokeLinejoin="round" />
            <path d="M55 50 C 45 120, 45 180, 50 220 C 55 180, 65 140, 75 110 C 80 80, 70 60, 60 50 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" strokeLinejoin="round" />
            <path d="M165 50 C 175 120, 175 180, 170 220 C 165 180, 155 140, 145 110 C 140 80, 150 60, 160 50 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" strokeLinejoin="round" />
            <path d="M110 35 C 100 65, 90 85, 95 105 C 85 90, 75 80, 70 85 C 65 80, 60 70, 55 50 C 70 40, 90 35, 110 35 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" strokeLinejoin="round" />
            <path d="M110 35 C 120 65, 130 85, 125 105 C 135 90, 145 80, 150 85 C 155 80, 160 70, 165 50 C 150 40, 130 35, 110 35 Z" fill={hairGrad} stroke="#3A202A" strokeWidth="2" strokeLinejoin="round" />

            {/* HANDS (Password Cover) */}
            <g 
              style={{ 
                transform: isPassword ? 'translateY(0px)' : 'translateY(55px)', 
                opacity: isPassword ? 1 : 0, 
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                transformBox: 'view-box'
              }}
            >
              <g 
                style={{ 
                  transform: isPeeking ? 'translateY(15px)' : 'translateY(0px)', 
                  transition: 'transform 0.3s ease',
                  transformBox: 'view-box'
                }}
              >
                <path d="M35 220 C 40 170, 55 140, 75 140 C 95 140, 95 180, 65 220 Z" fill={skinGrad} stroke="#3A202A" strokeWidth="2.5" strokeLinejoin="round" />
                <ellipse cx={80} cy={130} rx={14} ry={18} fill={skinGrad} stroke="#3A202A" strokeWidth="2.5" />
                <path d="M185 220 C 180 170, 165 140, 145 140 C 125 140, 125 180, 155 220 Z" fill={skinGrad} stroke="#3A202A" strokeWidth="2.5" strokeLinejoin="round" />
                <ellipse cx={140} cy={130} rx={14} ry={18} fill={skinGrad} stroke="#3A202A" strokeWidth="2.5" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
