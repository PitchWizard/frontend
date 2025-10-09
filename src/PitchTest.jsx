// RecorderAssessmentSequence.jsx
import React, { useEffect, useRef, useState } from "react";

// =================== 기본 설정 ===================
const DEFAULTS = {
  measureWindowSec: 3.0,
  voiceOnsetRmsThreshold: 0.01,
  frameIntervalMs: 60,
  strongCents: 30,
  weakCents: 75,
  strongPercent: 0.6,
  weakPercent: 0.4,
};

// MIDI ↔ Frequency 변환
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

// 온음 리스트 생성 (C3~C5)
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

// =================== Pitch Detection ===================
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
export default function RecorderAssessmentSequence() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);

  useEffect(() => {
    return () => stopAll();
  }, []);

  useEffect(() => {
    drawCanvas();
  }, [pitchHistory, currentNote]);

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

  function playTone(freq, duration = 1.0) {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duration);
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
    // Step2: play reference tone
    playTone(noteObj.freq, 1.0);
    await new Promise((r) => setTimeout(r, 1200));

    // Step3: wait for voice onset (실제로 부르기 시작할 때까지 대기)
    let onsetDetected = false;
    const onsetDeadline = ctx.currentTime + 3.0;
    while (ctx.currentTime < onsetDeadline && !onsetDetected) {
      analyser.getFloatTimeDomainData(timeDomain);
      let rms = Math.sqrt(timeDomain.reduce((a, v) => a + v * v, 0) / bufferLen);
      if (rms > DEFAULTS.voiceOnsetRmsThreshold) onsetDetected = true;
      else await new Promise((r) => setTimeout(r, 100));
    }

    // Step4: measure window (onset 이후부터 시작)
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

    // Step5: analyze
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

  // ===== Canvas Drawing =====
  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Y축 범위 (C2 ~ C6)
    const minMidi = 36; // C2
    const maxMidi = 84; // C6

    // 그리드 + 옥타브 구분
    for (let m = minMidi; m <= maxMidi; m++) {
      const y = ((maxMidi - m) / (maxMidi - minMidi)) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);

      if (m % 12 === 0) {
        ctx.strokeStyle = "#b1b1b1ff";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "black";
        ctx.fillText(midiToNoteName(m), 5, y - 2);
      } else {
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // 기준음 빨간 선
    if (currentNote) {
      const currentObj = NOTES_TO_TEST.find((n) => n.note === currentNote);
      if (currentObj) {
        const y = ((maxMidi - currentObj.midi) / (maxMidi - minMidi)) * height;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // 사용자 피치 파란 라인
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
      <h2>사용자 음역대 테스트</h2>
      <div style={{ marginBottom: 10 }}>
        <button onClick={startSequence} disabled={status === "running"}>
          테스트 시작
        </button>
        <button onClick={stopAll}>중단</button>
      </div>
      <div>
        상태: {status} {currentNote && `(현재: ${currentNote})`}
      </div>

      {/* 그래프 */}
      <h3>실시간 피치 그래프</h3>
      <canvas ref={canvasRef} width={1000} height={500} style={{ border: "1px solid black" }} />

      {/* 결과 테이블 */}
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
            <tr key={i}>
              <td>{r.note}</td>
              <td>{(r.strong * 100).toFixed(0)}%</td>
              <td>{(r.weak * 100).toFixed(0)}%</td>
              <td>{r.grade}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 색 블록 요약 시각화 */}
      <h3>요약 색 블록</h3>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
        {results.map((r, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 30,
                height: 50,
                background:
                  r.grade === "Strong OK"
                    ? "green"
                    : r.grade === "Weak OK"
                    ? "orange"
                    : "red",
              }}
            ></div>
            <div style={{ fontSize: 12 }}>{r.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
