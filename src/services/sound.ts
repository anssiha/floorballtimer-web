// Web Audio API arena buzzer synthesizer for floorball/indoor sports

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays an authentic arena horn buzzer sound synthesized directly via Web Audio API.
 * Uses detuned dual sawtooth oscillators passed through a resonant filter for a punchy stadium horn blast.
 */
export function playArenaHorn(durationSec = 1.3): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master gain envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    // Instant aggressive attack
    masterGain.gain.linearRampToValueAtTime(0.85, now + 0.04);
    // Sustain
    masterGain.gain.setValueAtTime(0.85, now + durationSec - 0.15);
    // Quick release
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    // Filter to give that authentic indoor horn acoustic resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(850, now);
    filter.Q.setValueAtTime(3.5, now);

    // Oscillator 1: Primary fundamental pitch (approx 145 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(145, now);

    // Oscillator 2: Detuned fifth (approx 218 Hz) for dense stadium acoustic texture
    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(218, now);

    // Oscillator 3: Sub bass punch (72.5 Hz)
    const osc3 = ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(72.5, now);

    // Connect nodes
    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Play oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);
    osc3.stop(now + durationSec);
  } catch (err) {
    console.warn('Audio playback failed or was blocked by browser policy:', err);
  }
}
