// PitchTest.jsx
import React, { useEffect, useRef, useState } from "react";

const DEFAULTS = {
  measureWindowSec: 3.0,
  voiceOnsetRmsThreshold: 0.015,
  frameIntervalMs: 60,
  strongCents: 30,
  weakCents: 75,
  strongPercent: 0.6,
  weakPercent: 0.4,
};

function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}
function freqToMidi(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}
function freqToCents(fTarget, fMeasured) {
  if (fMeasured <= 0 || fTarget <= 0) return Infinity;
  return 1200 * Math.log2(fMeasured / fTarget);
}
function midiToNoteName(m) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return names[m % 12] + Math.floor(m / 12 - 1);
}

function generateNoteList() {
  const midiRange = [48, 72]; // C3 ~ C5
  let list = [];
  for (let m = midiRange[0]; m <= midiRange[1]; m++) {
    const name = midiToNoteName(m);
    if (!name.includes("#")) {
      list.push({ note: name, midi: m, freq: midiToFreq(m) });
    }
  }
  return list;
}
const NOTES_TO_TEST = generateNoteList();

function autocorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.001) return { freq: -1, rms };

  let r = new Array(SIZE).fill(0);
  for (let lag = 0; lag < SIZE; lag++) {
    let sum = 0;
    for (let i = 0; i < SIZE - lag; i++) sum += buffer[i] * buffer[i + lag];
    r[lag] = sum;
  }

  let d = 0;
  while (d < SIZE && r[d] > r[d + 1]) d++;
  let maxPos = -1,
    maxVal = -Infinity;
  for (let i = d; i < SIZE; i++) {
    if (r[i] > maxVal) {
      maxVal = r[i];
      maxPos = i;
    }
  }
  if (maxVal <= 0 || maxPos === -1) return { freq: -1, rms };

  const left = r[maxPos - 1] ?? 0;
  const center = r[maxPos];
  const right = r[maxPos + 1] ?? 0;
  const denom = left - 2 * center + right;
  let shift = 0;
  if (denom !== 0) shift = (left - right) / (2 * denom);
  const lag = maxPos + shift;
  const freq = sampleRate / lag;
  return { freq, rms };
}

// =================== Component ===================
export default function PitchTest() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);

  useEffect(() => () => stopAll(), []);
  useEffect(() => drawCanvas(), [pitchHistory, currentNote]);

  async function initAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    audioCtxRef.current = audioCtx;

    const micSource = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    micSource.connect(analyser);
    analyserRef.current = analyser;
  }

  function stopAll() {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setStatus("idle");
    setCurrentNote(null);
    setPitchHistory([]);
  }

  // 🎹 피아노 음 버전 (Envelope 길게)
  function playTone(freq, duration = 2.0) {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // 음색 조합 (사인 + 삼각)
    osc.type = "sine";
    osc2.type = "triangle";

    const mixGain = ctx.createGain();
    mixGain.gain.value = 0.6;

    osc.connect(mixGain);
    osc2.connect(mixGain);
    mixGain.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    // 피아노 느낌: attack 빠르게, decay 천천히
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.02); // 빠른 어택
    gain.gain.exponentialRampToValueAtTime(0.4, now + 0.4);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);

    osc.frequency.value = freq;
    osc2.frequency.value = freq;
    osc.start();
    osc2.start();
    osc.stop(now + duration);
    osc2.stop(now + duration);
  }

  async function runNoteTest(noteObj) {
    setCurrentNote(noteObj.note);
    setPitchHistory([]);
    const analyser = analyserRef.current;
    const bufferLen = analyser.fftSize;
    const timeDomain = new Float32Array(bufferLen);
    const ctx = audioCtxRef.current;

    // Step1: count-in
    await new Promise((r) => setTimeout(r, 1000));

    // Step2: play reference tone (피아노 음)
    playTone(noteObj.freq, 2.0);
    await new Promise((r) => setTimeout(r, 2300)); // 피아노 소리 끝날 때까지 대기

    // Step3: voice onset 감지 (피아노 소리 뒤에)
    let onsetDetected = false;
    const onsetDeadline = ctx.currentTime + 4.0;
    while (ctx.currentTime < onsetDeadline && !onsetDetected) {
      analyser.getFloatTimeDomainData(timeDomain);
      let rms = Math.sqrt(timeDomain.reduce((a, v) => a + v * v, 0) / bufferLen);
      if (rms > DEFAULTS.voiceOnsetRmsThreshold) onsetDetected = true;
      else await new Promise((r) => setTimeout(r, 100));
    }

    // Step4: 피치 측정 (onset 이후부터)
    const frames = [];
    const history = [];
    const startTime = ctx.currentTime;
    if (onsetDetected) {
      while (ctx.currentTime - startTime < DEFAULTS.measureWindowSec) {
        analyser.getFloatTimeDomainData(timeDomain);
        const { freq } = autocorrelate(timeDomain, ctx.sampleRate);
        if (freq > 0) {
          const cents = Math.abs(freqToCents(noteObj.freq, freq));
          frames.push(cents);
          history.push(freq);
          setPitchHistory([...history]);
        }
        await new Promise((r) => setTimeout(r, DEFAULTS.frameIntervalMs));
      }
    }

    // Step5: 판정
    const total = frames.length || 1;
    const strong = frames.filter((c) => c <= DEFAULTS.strongCents).length / total;
    const weak = frames.filter((c) => c <= DEFAULTS.weakCents).length / total;
    let grade = "Fail";
    if (strong >= DEFAULTS.strongPercent) grade = "Strong OK";
    else if (weak >= DEFAULTS.weakPercent) grade = "Weak OK";

    return { note: noteObj.note, freq: noteObj.freq, strong, weak, grade };
  }

  async function startSequence() {
    setResults([]);
    setStatus("running");
    await initAudio();
    const res = [];
    for (let note of NOTES_TO_TEST) {
      const r = await runNoteTest(note);
      res.push(r);
      setResults([...res]);
      await new Promise((s) => setTimeout(s, 800));
    }
    setStatus("done");
  }

  // ====== 시각화 ======
  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const minMidi = 36; // C2
    const maxMidi = 84; // C6

    // 옥타브 라인 (진한 회색)
    for (let m = minMidi; m <= maxMidi; m++) {
      const y = ((maxMidi - m) / (maxMidi - minMidi)) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.strokeStyle = m % 12 === 0 ? "#777" : "#ddd";
      ctx.lineWidth = m % 12 === 0 ? 2 : 1;
      ctx.stroke();
      if (m % 12 === 0) {
        ctx.fillStyle = "black";
        ctx.font = "12px sans-serif";
        ctx.fillText(midiToNoteName(m), 5, y - 2);
      }
    }

    // 기준음 빨간 선
    if (currentNote) {
      const n = NOTES_TO_TEST.find((x) => x.note === currentNote);
      if (n) {
        const y = ((maxMidi - n.midi) / (maxMidi - minMidi)) * height;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 사용자 피치 궤적 (파란 곡선)
    ctx.strokeStyle = "blue";
    ctx.beginPath();
    pitchHistory.forEach((f, i) => {
      const m = freqToMidi(f);
      const y = ((maxMidi - m) / (maxMidi - minMidi)) * height;
      const x = (i / pitchHistory.length) * width;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1000, margin: 16 }}>
      <h2>🎹 피아노 음 버전 피치 테스트</h2>
      <div style={{ marginBottom: 10 }}>
        <button onClick={startSequence} disabled={status === "running"}>
          테스트 시작
        </button>
        <button onClick={stopAll}>중단</button>
      </div>
      <div>
        상태: {status} {currentNote && `(현재: ${currentNote})`}
      </div>

      <h3>실시간 피치 그래프</h3>
      <canvas ref={canvasRef} width={1000} height={600} style={{ border: "1px solid black" }} />

      <h3>결과 테이블</h3>
      <table border="1" cellPadding="5" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>음</th>
            <th>Strong%</th>
            <th>Weak%</th>
            <th>판정</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={i}
              style={{
                background:
                  r.grade === "Strong OK"
                    ? "#9cff9c"
                    : r.grade === "Weak OK"
                    ? "#ffe699"
                    : "#ff9999",
              }}
            >
              <td>{r.note}</td>
              <td>{(r.strong * 100).toFixed(0)}%</td>
              <td>{(r.weak * 100).toFixed(0)}%</td>
              <td>{r.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
