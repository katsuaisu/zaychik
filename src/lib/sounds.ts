const KEY = "gizmo-sound-enabled";

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) !== "false";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, on ? "true" : "false");
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gainValue: number, type: OscillatorType = "sine") {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t = ac.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export type SoundName = "correct" | "wrong" | "flip" | "complete";

export function playSound(name: SoundName) {
  if (!soundEnabled()) return;
  try {
    if (name === "correct") {
      tone(880, 0, 0.14, 0.15);
      tone(1320, 0.08, 0.18, 0.12);
    } else if (name === "wrong") {
      tone(300, 0, 0.18, 0.14, "triangle");
      tone(200, 0.1, 0.22, 0.12, "triangle");
    } else if (name === "flip") {
      tone(620, 0, 0.09, 0.09, "triangle");
    } else {
      [660, 880, 1100, 1320].forEach((f, i) => tone(f, i * 0.09, 0.22, 0.13));
    }
  } catch {
    /* audio unavailable */
  }
}
