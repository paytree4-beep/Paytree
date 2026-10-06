// components/dashboard/card-music.ts
//
// A short, cheerful, royalty-free tune made in the browser (Web Audio), so the
// "Pay me here" video has music without any copyright worries. Warm chords,
// a marimba-like melody, soft bass, and a little "pop" when each apple lands.

const BPM = 104;
const BEAT = 60 / BPM;

// C major, I-V-vi-IV: C, G, Am, F (MIDI notes)
const CHORDS = [
  [60, 64, 67],
  [55, 59, 62],
  [57, 60, 64],
  [53, 57, 60],
];
const BASS = [36, 43, 45, 41];
// Two-bar melody phrase per chord, in beats (note, start beat, length beats)
const MELODY: [number, number, number][] = [
  [72, 0, 0.5], [76, 0.5, 0.5], [79, 1, 1], [76, 2, 0.5], [74, 2.5, 0.5], [72, 3, 1],
  [74, 4, 0.5], [79, 4.5, 0.5], [83, 5, 1], [79, 6, 0.5], [77, 6.5, 0.5], [74, 7, 1],
  [76, 8, 0.5], [79, 8.5, 0.5], [84, 9, 1], [81, 10, 0.5], [79, 10.5, 0.5], [76, 11, 1],
  [77, 12, 0.5], [81, 12.5, 0.5], [84, 13, 0.75], [81, 13.75, 0.25], [79, 14, 1], [77, 15, 1],
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function pluck(ctx: BaseAudioContext, out: AudioNode, midi: number, at: number, len: number, vol: number) {
  // Marimba-ish: sine + a quiet overtone, fast attack, gentle decay.
  [1, 4].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = hz(midi) * mult;
    const peak = vol * (i === 0 ? 1 : 0.18);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.35, len * 1.6));
    osc.connect(g).connect(out);
    osc.start(at);
    osc.stop(at + Math.max(0.4, len * 1.7));
  });
}

function pad(ctx: BaseAudioContext, out: AudioNode, notes: number[], at: number, len: number) {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1400;
  filter.connect(out);
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = hz(n);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.045, at + 0.25);
    g.gain.setValueAtTime(0.045, at + len - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, at + len);
    osc.connect(g).connect(filter);
    osc.start(at);
    osc.stop(at + len + 0.05);
  });
}

function bass(ctx: BaseAudioContext, out: AudioNode, midi: number, at: number, len: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + len + 0.05);
}

/** A soft "pop" for an apple landing. */
function pop(ctx: BaseAudioContext, out: AudioNode, at: number, pitch: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch * 2.2, at);
  osc.frequency.exponentialRampToValueAtTime(pitch, at + 0.08);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.16, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + 0.2);
}

/**
 * Schedules the whole tune on `ctx`, starting at `start`, for `seconds`.
 * `landings` are the times (in seconds from start) when apples hit the ground.
 */
export function scheduleTune(ctx: BaseAudioContext, out: AudioNode, start: number, seconds: number, landings: number[]) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.linearRampToValueAtTime(0.9, start + 0.4);
  master.gain.setValueAtTime(0.9, start + seconds - 1.2);
  master.gain.linearRampToValueAtTime(0.0001, start + seconds);
  master.connect(out);

  const bars = Math.ceil(seconds / (BEAT * 4));
  for (let bar = 0; bar < bars; bar++) {
    const at = start + bar * BEAT * 4;
    const chord = bar % 4;
    pad(ctx, master, CHORDS[chord], at, BEAT * 4);
    bass(ctx, master, BASS[chord], at, BEAT * 1.6);
    bass(ctx, master, BASS[chord], at + BEAT * 2, BEAT * 1.6);
  }
  MELODY.forEach(([note, beat, len]) => {
    for (let loop = 0; loop * 16 * BEAT < seconds; loop++) {
      const at = start + (loop * 16 + beat) * BEAT;
      if (at - start < seconds - 0.5) pluck(ctx, master, note, at, len * BEAT, 0.16);
    }
  });
  landings.forEach((t, i) => pop(ctx, master, start + t, 520 + (i % 5) * 70));
}
