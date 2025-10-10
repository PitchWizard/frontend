// PitchTestpiano.jsx (완성본)
import React, { useEffect, useRef, useState } from "react";

const DEFAULTS = {
  measureWindowSec: 2.5, // ✅ 사용자가 음을 낼 수 있는 측정 시간
  voiceOnsetRmsThreshold: 0.015,
  frameIntervalMs: 60,
  strongCents: 30,
  weakCents: 75,
  strongPercent: 0.6, // ✅ strong 판정 기준 (0.6 == 60%)
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
  const midiRange = [48, 84]; // ✅ C3~C6
  let list = [];
  for (let m = midiRange[0]; m <= midiRange[1]; m++) {
    const name = midiToNoteName(m);
    if (!name.includes("#")) list.push({ note: name, midi: m, freq: midiToFreq(m) });
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

// ===== WAV 인코딩 =====
function interleave(buffers, totalLen) {
  const result = new Float32Array(totalLen);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return view;
}
function encodeWAV(float32Array, sampleRate) {
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + float32Array.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + float32Array.length * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, float32Array.length * bytesPerSample, true);
  const pcm = floatTo16BitPCM(float32Array);
  for (let i = 0; i < pcm.byteLength; i++) view.setUint8(44 + i, pcm.getUint8(i));
  return new Blob([view], { type: "audio/wav" });
}

// ✅ 추가: 테시투라 계산 함수
function estimateTessitura(results, opts = {}) {
  const { strongThreshold = 0.6, minNotes = 3, maxAllowedGaps = 1 } = opts;
  const strongMask = results.map((r) => r.strong >= strongThreshold);
  const segments = [];
  let i = 0;

  while (i < results.length) {
    if (!strongMask[i]) {
      i++;
      continue;
    }
    let start = i;
    let end = i;
    let gaps = 0;
    i++;
    while (i < results.length) {
      if (strongMask[i]) {
        end = i;
        gaps = 0;
      } else {
        gaps++;
        if (gaps > maxAllowedGaps) break;
      }
      i++;
    }
    const included = [];
    for (let k = start; k <= end; k++) if (strongMask[k]) included.push(k);
    if (included.length >= minNotes) {
      const idxLow = included[0];
      const idxHigh = included[included.length - 1];
      const notes = included.map((idx) => results[idx].note);
      const avgStrong = included.reduce((s, idx) => s + results[idx].strong, 0) / included.length;
      segments.push({
        low: results[idxLow].note,
        high: results[idxHigh].note,
        notes,
        length: included.length,
        avgStrong,
      });
    }
  }
  if (segments.length === 0) return { tessitura: null, segments };
  segments.sort((a, b) => b.length - a.length || b.avgStrong - a.avgStrong);
  return { tessitura: segments[0], segments };
}

export default function PitchTestPiano() {
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const canvasRef = useRef(null);

  const recBuffers = useRef([]);
  const recLength = useRef(0);
  const isRecording = useRef(false);

  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [pitchHistory, setPitchHistory] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [tessitura, setTessitura] = useState(null); // ✅ 추가: 테시투라 상태

  useEffect(() => () => stopAll(), []);
  useEffect(() => drawCanvas(), [pitchHistory, currentNote]);

  async function initAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;
    const mic = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    mic.connect(analyser);
    analyserRef.current = analyser;

    const node = ctx.createScriptProcessor(4096, 1, 1);
    node.onaudioprocess = (e) => {
      if (!isRecording.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const copy = new Float32Array(input.length);
      copy.set(input);
      recBuffers.current.push(copy);
      recLength.current += copy.length;
    };
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;
    node.connect(silentGain);
    silentGain.connect(ctx.destination);
    mic.connect(node);
  }

  function startRecording() {
    recBuffers.current = [];
    recLength.current = 0;
    isRecording.current = true;
    setDownloadUrl(null);
  }
  function stopRecording() {
    if (!isRecording.current) return;
    isRecording.current = false;
    const ctx = audioCtxRef.current;
    const data = interleave(recBuffers.current, recLength.current);
    const wavBlob = encodeWAV(data, ctx.sampleRate);
    const url = URL.createObjectURL(wavBlob);
    setDownloadUrl(url);

    // ✅ 서버 업로드 (주석처리)
    /*
    const formData = new FormData();
    formData.append("file", wavBlob, "pitchtest.wav");
    formData.append("meta", JSON.stringify({ results, tessitura, params: DEFAULTS }));
    fetch("/upload", { method: "POST", body: formData });
    */

    recBuffers.current = [];
    recLength.current = 0;
  }

  function playTone(freq, duration = 1.2) {
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc2.type = "triangle";
    const mixGain = ctx.createGain();
    mixGain.gain.value = 0.6;
    osc.connect(mixGain);
    osc2.connect(mixGain);
    mixGain.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.02);
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

    await new Promise((r) => setTimeout(r, 800));
    playTone(noteObj.freq, 1.2);
    await new Promise((r) => setTimeout(r, 1400));

    const frames = [];
    const history = [];
    const startTime = ctx.currentTime;
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

    const total = frames.length || 1;
    const strong = frames.filter((c) => c <= DEFAULTS.strongCents).length / total;
    const weak = frames.filter((c) => c <= DEFAULTS.weakCents).length / total;
    let grade = "Fail";
    if (strong >= DEFAULTS.strongPercent) grade = "Strong OK";
    else if (weak >= DEFAULTS.weakPercent) grade = "Weak OK";
    return { note: noteObj.note, strong, weak, grade };
  }

  async function startSequence() {
    setResults([]);
    setStatus("running");
    await initAudio();
    startRecording();

    const res = [];
    for (const n of NOTES_TO_TEST) {
      const r = await runNoteTest(n);
      res.push(r);
      setResults([...res]);
      await new Promise((s) => setTimeout(s, 400));
    }

    stopRecording();

    // ✅ 테시투라 분석
    const { tessitura, segments } = estimateTessitura(res, {
      strongThreshold: DEFAULTS.strongPercent,
      minNotes: 3,
      maxAllowedGaps: 1,
    });
    setTessitura(tessitura);
    console.log("🎼 Tessitura 분석 결과:", tessitura);
    console.log("📊 모든 구간:", segments);

    // ✅ 서버로 보낼 데이터 구조 출력
    const payload = {
      results: res,        // 음별 strong/weak/grade 등
      tessitura,           // 프론트 계산 결과
      params: DEFAULTS,    // 측정 기준값들
    };
    console.log("📤 서버로 전송할 데이터 예시:", JSON.stringify(payload, null, 2));


    setStatus("done");
  }

  

  function stopAll() {
    stopRecording();
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setStatus("idle");
  }

  // 그래프 C2~C7
  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width,
      height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    const minMidi = 36; // C2
    const maxMidi = 96; // C7

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

    if (currentNote) {
      const noteObj = NOTES_TO_TEST.find((x) => x.note === currentNote);
      if (noteObj) {
        const y = ((maxMidi - noteObj.midi) / (maxMidi - minMidi)) * height;
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "blue";
    ctx.beginPath();
    pitchHistory.forEach((f, i) => {
      const m = freqToMidi(f);
      const y = ((maxMidi - m) / (maxMidi - minMidi)) * height;
      const x = (i / Math.max(1, pitchHistory.length - 1)) * width;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1000, margin: 16 }}>
      <h2>🎹 사용자 음역대 테스트 (C3–C6)</h2>
      <div>
        <button onClick={startSequence} disabled={status === "running"}>
          테스트 시작
        </button>
        <button onClick={stopAll}>중단</button>
      </div>
      <div>
        상태: {status} {currentNote && `(현재: ${currentNote})`}
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={600}
        style={{ border: "1px solid black", marginTop: 10 }}
      />

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

      {tessitura && (
        <div style={{ marginTop: 20 }}>
          <h3>🎤 분석된 테시투라</h3>
          <p>
            <strong>
              {tessitura.low} ~ {tessitura.high}
            </strong>{" "}
            (평균 강도 {(tessitura.avgStrong * 100).toFixed(1)}%)
          </p>
        </div>
      )}

      {downloadUrl && (
        <div style={{ marginTop: 12 }}>
          <h4>녹음 파일</h4>
          <a href={downloadUrl} download={`pitchtest_${Date.now()}.wav`}>
            WAV 다운로드
          </a>
        </div>
      )}
    </div>
  );
}
