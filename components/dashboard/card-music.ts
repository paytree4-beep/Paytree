// components/dashboard/card-music.ts
//
// An original, royalty-free tune made in the browser (Web Audio), so the
// "Pay me here" video has music without any copyright worries. A bouncy pop
// hook (played twice), bass, kick, claps and hats, bell sparkles at the end,
// and a little "pop" when each apple lands. 120 BPM: one beat is half a second,
// which is what the dancing apples follow.

export const TUNE_BPM = 120;
export const TUNE_SECONDS = 16.2;
const BEAT = 60 / TUNE_BPM;

// Am, F, C, G (MIDI notes, one chord per bar) and their bass notes
const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
];
const BASS = [45, 41, 36, 43];
// The hook: 4 bars, (note, start beat, length in beats)
const HOOK: [number, number, number][] = [
  [76, 0, 0.5], [76, 0.75, 0.25], [79, 1, 0.5], [81, 1.5, 0.5], [79, 2, 1], [76, 3, 0.5], [74, 3.5, 0.5],
  [72, 4, 0.5], [72, 4.75, 0.25], [76, 5, 0.5], [77, 5.5, 0.5], [76, 6, 1], [72, 7, 0.5], [74, 7.5, 0.5],
  [76, 8, 0.5], [79, 8.5, 0.5], [84, 9, 1], [81, 10, 0.5], [79, 10.5, 0.5], [76, 11, 0.5], [74, 11.5, 0.5],
  [79, 12, 0.5], [76, 12.5, 0.5], [72, 13, 3],
];

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** A bright, plucky synth note (filtered saw wave with a quick decay). */
function lead(ctx: BaseAudioContext, out: AudioNode, midi: number, at: number, len: number, vol: number, cutoff = 4200, decay = 0.2) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = hz(midi);
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.004);
  g.gain.setTargetAtTime(0, at + 0.004, decay);
  osc.connect(filter).connect(g).connect(out);
  osc.start(at);
  osc.stop(at + Math.max(0.35, len) + 0.1);
}

/** A glassy bell (two sine waves, one shaking the other). */
function bell(ctx: BaseAudioContext, out: AudioNode, midi: number, at: number, len: number, vol: number) {
  const carrier = ctx.createOscillator();
  const modulator = ctx.createOscillator();
  const modGain = ctx.createGain();
  const g = ctx.createGain();
  const f = hz(midi);
  carrier.type = "sine";
  carrier.frequency.value = f;
  modulator.type = "sine";
  modulator.frequency.value = f * 3.5;
  modGain.gain.setValueAtTime(f * 5.25, at);
  modGain.gain.setTargetAtTime(0, at, 0.25);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.003);
  g.gain.setTargetAtTime(0, at + 0.003, len * 0.45);
  modulator.connect(modGain).connect(carrier.frequency);
  carrier.connect(g).connect(out);
  carrier.start(at);
  modulator.start(at);
  carrier.stop(at + len + 0.2);
  modulator.stop(at + len + 0.2);
}

let softClip: Float32Array | null = null;
function clipCurve(): Float32Array {
  if (!softClip) {
    softClip = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) softClip[i] = Math.tanh(2.2 * ((i / 1023) * 2 - 1));
  }
  return softClip;
}

/** A round, slightly warm bass note. */
function bass(ctx: BaseAudioContext, out: AudioNode, midi: number, at: number, len: number, vol = 0.5) {
  const osc = ctx.createOscillator();
  const shaper = ctx.createWaveShaper();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = hz(midi);
  // The curve needs a plain ArrayBuffer-backed array, which a fresh copy is.
  shaper.curve = new Float32Array(clipCurve());
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.01);
  g.gain.setTargetAtTime(0, at + 0.01, len * 0.6);
  osc.connect(shaper).connect(g).connect(out);
  osc.start(at);
  osc.stop(at + len + 0.1);
}

function kick(ctx: BaseAudioContext, out: AudioNode, at: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(165, at);
  osc.frequency.setTargetAtTime(45, at, 1 / 30);
  g.gain.setValueAtTime(0.5, at);
  g.gain.setTargetAtTime(0, at, 0.09);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + 0.4);
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();
function noise(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseCache.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 99;
    for (let i = 0; i < data.length; i++) {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      data[i] = (seed / 4294967296) * 2 - 1;
    }
    noiseCache.set(ctx, buffer);
  }
  return buffer;
}

function hat(ctx: BaseAudioContext, out: AudioNode, at: number) {
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noise(ctx);
  filter.type = "highpass";
  filter.frequency.value = 7000;
  g.gain.setValueAtTime(0.14, at);
  g.gain.setTargetAtTime(0, at, 0.015);
  src.connect(filter).connect(g).connect(out);
  src.start(at);
  src.stop(at + 0.15);
}

function clap(ctx: BaseAudioContext, out: AudioNode, at: number) {
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  src.buffer = noise(ctx);
  filter.type = "bandpass";
  filter.frequency.value = 2450;
  filter.Q.value = 0.65;
  g.gain.setValueAtTime(0.35, at);
  g.gain.setTargetAtTime(0, at, 0.05);
  src.connect(filter).connect(g).connect(out);
  src.start(at);
  src.stop(at + 0.25);
}

/** A soft "pop" for an apple landing. */
function pop(ctx: BaseAudioContext, out: AudioNode, at: number, pitch: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(pitch * 2.2, at);
  osc.frequency.exponentialRampToValueAtTime(pitch, at + 0.08);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.1, at + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
  osc.connect(g).connect(out);
  osc.start(at);
  osc.stop(at + 0.2);
}

/**
 * Schedules the whole tune on `ctx`, starting at `start`, for `seconds`.
 * `landings` are the times (in seconds from start) when apples hit the ground.
 *
 * The notes are handed to the audio engine a little at a time (not all at once),
 * because phones can drop sounds when hundreds are queued in one go.
 */
export function scheduleTune(ctx: BaseAudioContext, out: AudioNode, start: number, seconds: number, landings: number[]) {
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, start);
  master.gain.linearRampToValueAtTime(0.58, start + 0.05);
  master.gain.setValueAtTime(0.58, start + seconds - 0.9);
  master.gain.linearRampToValueAtTime(0.0001, start + seconds);
  master.connect(out);

  // Everything to play, as (time in seconds from the start, what to do).
  const jobs: { at: number; run: () => void }[] = [];
  const job = (beat: number, run: (at: number) => void) => {
    const at = start + beat * BEAT;
    jobs.push({ at, run: () => run(at) });
  };

  // The hook is played twice: 8 bars of 4 beats.
  for (let rep = 0; rep < 2; rep++) {
    const offset = rep * 16;
    for (let bar = 0; bar < 4; bar++) {
      const base = offset + bar * 4;
      const chord = CHORDS[bar];
      // Off-beat chord stabs
      for (let k = 1; k < 8; k += 2) job(base + k / 2, (at) => chord.forEach((n) => lead(ctx, master, n + 12, at, 0.2, 0.08, 2200, 0.07)));
      // Bouncy bass
      [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((b) => job(base + b, (at) => bass(ctx, master, BASS[bar], at, BEAT * 0.45)));
      // Drums: kick on every beat, claps on 2 and 4, hats between
      for (let b = 0; b < 4; b++) job(base + b, (at) => kick(ctx, master, at));
      job(base + 1, (at) => clap(ctx, master, at));
      job(base + 3, (at) => clap(ctx, master, at));
      for (let h = 0; h < 8; h++) job(base + h / 2 + 0.25, (at) => hat(ctx, master, at));
    }
    HOOK.forEach(([note, beat, len]) =>
      job(offset + beat, (at) => {
        lead(ctx, master, note, at, Math.max(0.3, len * BEAT * 1.4), 0.3);
        bell(ctx, master, note + 12, at, 0.8, 0.09);
      }),
    );
  }
  // A shower of bells to finish
  [84, 88, 91, 96].forEach((n, i) => job(31.5 + (i * 0.05) / BEAT, (at) => bell(ctx, master, n, at, 1.4, 0.14)));
  landings.forEach((t, i) => jobs.push({ at: start + t, run: () => pop(ctx, master, start + t, 520 + (i % 5) * 70) }));
  jobs.sort((x, y) => x.at - y.at);

  // Hand over everything that starts within the next 1.5 seconds, every 200 ms.
  let next = 0;
  // An offline render (no real-time clock) gets everything at once.
  const offline = typeof OfflineAudioContext !== "undefined" && ctx instanceof OfflineAudioContext;
  const feed = () => {
    while (next < jobs.length && (offline || jobs[next].at < ctx.currentTime + 1.5)) {
      try {
        jobs[next].run();
      } catch {
        // one failed note must never silence the rest
      }
      next += 1;
    }
    return next >= jobs.length;
  };
  if (feed()) return;
  const timer = setInterval(() => {
    if (feed() || (ctx as AudioContext).state === "closed") clearInterval(timer);
  }, 200);
}
