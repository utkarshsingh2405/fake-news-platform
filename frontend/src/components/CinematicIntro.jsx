import React, { useState, useEffect, useRef } from 'react';

/**
 * CinematicIntro
 * ─────────────────────────────────────────────────────────────────────
 * Full-screen cinematic splash shown ONCE per browser session.
 *
 * Sequence
 * ────────
 *  0.0s  → Screen is pure black. Binoculars video silently begins loading.
 *  0.5s  → Video fades in  (cinematic letterbox bars stay)
 *  1.5s  → A tiny bright green dot pulses at dead-centre
 *  2.6s  → Dot EXPLODES → GodSEye logo scales from 0 → 100% with glow burst
 *  4.0s  → "GODSEYE" wordmark fades + slides up
 *  5.4s  → "· AI FAKE NEWS DETECTOR ·" types in letter-by-letter
 *  8.0s  → Full overlay fades to black then disappears
 *
 * onDone() is called when the overlay has fully faded out.
 */

const TAGLINE = '· AI FAKE NEWS DETECTOR ·';

const CinematicIntro = ({ onDone }) => {
  // ── Phase state machine ──
  const [phase, setPhase] = useState('black');
  // black → video → dot → logo → wordmark → tagline → fadeout
  const [typedChars, setTypedChars] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [glowBurst, setGlowBurst] = useState(false);
  const typerRef = useRef(null);

  useEffect(() => {
    const timers = [];
    const t = (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

    t(500,  () => setPhase('video'));
    t(1500, () => setPhase('dot'));
    t(2600, () => { setPhase('logo'); setGlowBurst(true); setTimeout(() => setGlowBurst(false), 700); });
    t(4000, () => setPhase('wordmark'));
    t(5400, () => {
      setPhase('tagline');
      let i = 0;
      typerRef.current = setInterval(() => {
        i++;
        setTypedChars(i);
        if (i >= TAGLINE.length) clearInterval(typerRef.current);
      }, 55);
    });
    t(8000, () => {
      setIsFading(true);
      t(8900, () => onDone());
    });

    return () => {
      timers.forEach(clearTimeout);
      if (typerRef.current) clearInterval(typerRef.current);
    };
  }, [onDone]);

  // Derived visibility flags
  const showVideo    = ['video','dot','logo','wordmark','tagline'].includes(phase);
  const showDot      = ['dot','logo','wordmark','tagline'].includes(phase);
  const showLogo     = ['logo','wordmark','tagline'].includes(phase);
  const showWordmark = ['wordmark','tagline'].includes(phase);
  const showTagline  = phase === 'tagline';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.9s ease-in-out',
        pointerEvents: isFading ? 'none' : 'all',
      }}
    >
      {/* ── BINOCULARS VIDEO ── */}
      <video
        autoPlay muted playsInline loop
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          opacity: showVideo ? 1 : 0,
          transition: 'opacity 1.4s ease-in-out',
        }}
      >
        <source src="/videos/Detective_with_binoculars_in_rain_202607021001.mp4" type="video/mp4" />
      </video>

      {/* ── OVERLAYS ── */}
      {/* Letterbox bars */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'11%', background:'#000' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'11%', background:'#000' }} />
      </div>
      {/* Vignette */}
      <div style={{
        position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.82) 100%)',
      }} />
      {/* Glow burst flash when logo appears */}
      <div style={{
        position:'absolute', inset:0, zIndex:4, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(0,255,135,0.35) 0%, transparent 55%)',
        opacity: glowBurst ? 1 : 0,
        transition: 'opacity 0.15s ease-in, opacity 0.6s ease-out',
      }} />
      {/* Ambient green glow (persistent after logo) */}
      <div style={{
        position:'absolute', inset:0, zIndex:3, pointerEvents:'none',
        background:'radial-gradient(ellipse at center, rgba(0,255,135,0.07) 0%, transparent 60%)',
        opacity: showLogo ? 1 : 0,
        transition: 'opacity 1s ease',
        animation: showLogo ? 'introPulse 2.5s ease-in-out infinite' : 'none',
      }} />
      {/* Scanlines */}
      <div style={{
        position:'absolute', inset:0, zIndex:4, pointerEvents:'none',
        backgroundImage:'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
      }} />

      {/* ── CENTRE STAGE ── */}
      <div style={{
        position:'relative', zIndex:10,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        userSelect:'none',
      }}>

        {/* ── DOT / LOGO ZONE ── */}
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'0' }}>

          {/* Glow ring that expands when logo reveals */}
          {showDot && (
            <div style={{
              position:'absolute',
              width: showLogo ? '360px' : '12px',
              height: showLogo ? '360px' : '12px',
              borderRadius:'50%',
              border: showLogo ? '1px solid rgba(0,255,135,0.12)' : 'none',
              boxShadow: showLogo
                ? '0 0 80px 40px rgba(0,255,135,0.08), 0 0 140px 70px rgba(96,239,255,0.05)'
                : '0 0 0 0 rgba(0,255,135,0)',
              background: showLogo ? 'transparent' : '#00FF87',
              transition: 'all 0.75s cubic-bezier(0.16,1,0.3,1)',
              pointerEvents:'none',
            }} />
          )}

          {/* Second pulsing ring */}
          {showLogo && (
            <div style={{
              position:'absolute',
              width:'300px', height:'300px',
              borderRadius:'50%',
              border:'1px solid rgba(96,239,255,0.08)',
              animation:'introRing 2s ease-in-out infinite',
              pointerEvents:'none',
            }} />
          )}

          {/* ── ACTUAL LOGO IMAGE ── */}
          <img
            src="/godseye_emblem.png"
            alt="GodSEye"
            style={{
              width: '240px',
              height: '240px',
              objectFit: 'contain',
              opacity: showLogo ? 1 : 0,
              transform: showLogo ? 'scale(1)' : 'scale(0.05)',
              transition: 'opacity 0.5s ease 0.05s, transform 0.75s cubic-bezier(0.16,1,0.3,1)',
              filter: showLogo
                ? 'drop-shadow(0 0 40px rgba(0,255,135,0.55)) drop-shadow(0 0 80px rgba(96,239,255,0.25)) brightness(1.1)'
                : 'none',
              animation: showLogo ? 'introFloat 3.5s ease-in-out infinite' : 'none',
            }}
          />
        </div>

        {/* ── GODSEYE WORDMARK ── */}
        <div style={{
          marginTop: showWordmark ? '1.75rem' : '0.5rem',
          opacity: showWordmark ? 1 : 0,
          transform: showWordmark ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.92)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <span style={{
            fontFamily:"'Outfit', sans-serif",
            fontSize:'clamp(2.8rem, 9vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            background:'linear-gradient(135deg, #00FF87 0%, #60EFFF 40%, #ffffff 55%, #60EFFF 70%, #00FF87 100%)',
            WebkitBackgroundClip:'text',
            WebkitTextFillColor:'transparent',
            backgroundSize:'250% auto',
            animation: showWordmark ? 'introShimmer 3s linear infinite' : 'none',
            display:'block',
            textAlign:'center',
            lineHeight:1,
          }}>
            GODSEYE
          </span>
        </div>

        {/* ── TAGLINE TYPEWRITER ── */}
        <div style={{
          height:'2rem',
          marginTop: showTagline ? '0.75rem' : '0.25rem',
          display:'flex', alignItems:'center', justifyContent:'center',
          overflow:'hidden',
        }}>
          {showTagline && (
            <span style={{
              fontFamily:"'Inter', sans-serif",
              fontSize:'clamp(0.6rem, 1.8vw, 0.85rem)',
              fontWeight: 700,
              letterSpacing:'0.4em',
              textTransform:'uppercase',
              color:'rgba(148,163,184,0.85)',
              display:'flex', alignItems:'center',
            }}>
              {TAGLINE.slice(0, typedChars)}
              {typedChars < TAGLINE.length && (
                <span style={{
                  display:'inline-block', width:'2px', height:'0.9em',
                  background:'#00FF87', marginLeft:'2px',
                  animation:'introCaret 0.75s step-end infinite',
                }} />
              )}
            </span>
          )}
        </div>

        {/* ── SKIP BUTTON ── */}
        <button
          onClick={() => { setIsFading(true); setTimeout(() => onDone(), 900); }}
          style={{
            marginTop:'3.5rem',
            fontSize:'0.6rem', fontWeight:600,
            letterSpacing:'0.25em', textTransform:'uppercase',
            color:'rgba(71,85,105,0.7)',
            background:'none',
            border:'1px solid rgba(71,85,105,0.25)',
            borderRadius:'999px',
            padding:'0.3rem 1.2rem',
            cursor:'pointer',
            transition:'color 0.3s, border-color 0.3s',
            opacity: showVideo ? 1 : 0,
            transition: 'opacity 1s ease, color 0.3s, border-color 0.3s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color='#00FF87';
            e.currentTarget.style.borderColor='rgba(0,255,135,0.45)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color='rgba(71,85,105,0.7)';
            e.currentTarget.style.borderColor='rgba(71,85,105,0.25)';
          }}
        >
          Skip Intro ›
        </button>
      </div>

      {/* ── KEYFRAMES ── */}
      <style>{`
        @keyframes introPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes introFloat {
          0%, 100% { transform: scale(1) translateY(0px);   filter: drop-shadow(0 0 40px rgba(0,255,135,0.55)) brightness(1.1); }
          50%       { transform: scale(1.04) translateY(-8px); filter: drop-shadow(0 0 55px rgba(0,255,135,0.75)) brightness(1.2); }
        }
        @keyframes introShimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 250% center; }
        }
        @keyframes introCaret {
          0%, 100% { opacity: 0; }
          50%       { opacity: 1; }
        }
        @keyframes introRing {
          0%   { transform: scale(1);    opacity: 0.5; }
          50%  { transform: scale(1.08); opacity: 0.2; }
          100% { transform: scale(1);    opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default CinematicIntro;
