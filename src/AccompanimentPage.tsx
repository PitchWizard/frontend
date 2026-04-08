import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, MicOff, Play, Search, Square, X } from "lucide-react";
import { PitchDetector } from "pitchy";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
  user: any;
};

type Song = {
  song_id: number;
  title: string;
  artist: string;
  midi_min: number;
  midi_median: number;
  midi_max: number;
};

type PitchFrames = {
  hop_ms: number;
  times: number[];
  hz: (number | null)[];
};

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

function midiToNoteName(midi: number): string {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const oct = Math.floor(midi / 12) - 1;
  return names[midi % 12] + oct;
}

export default function AccompanimentPage({ onBack, isDarkMode, user }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showList, setShowList] = useState(false);
  const [semitones, setSemitones] = useState(0);
  const [pitchFrames, setPitchFrames] = useState<PitchFrames | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isEchoOn, setIsEchoOn] = useState(false);
  const [userPitch, setUserPitch] = useState<number | null>(null);
  const echoGainRef = useRef<GainNode | null>(null);
  const semitonesRef = useRef(semitones);
  const [originalPitch, setOriginalPitch] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const mainRafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 피치 히스토리 (Canvas용)
  const userPitchHistory = useRef<(number | null)[]>([]);
  const origPitchHistory = useRef<(number | null)[]>([]);
  const MAX_HISTORY = 300;

  // stale closure 방지용 refs
  const isPlayingRef = useRef(false);
  const pitchFramesRef = useRef<PitchFrames | null>(null);
  const isMicOnRef = useRef(false);
  const detectorRef = useRef<ReturnType<typeof PitchDetector.forFloat32Array> | null>(null);
  const micBufRef = useRef<Float32Array | null>(null);

  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const cardBg = isDarkMode ? "bg-white/5" : "bg-black/5";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";

  // 곡 목록 로드
  useEffect(() => {
    axios.get(`${BASE_URL}/songs`).then((r) => setSongs(r.data));
  }, []);

  // 곡 선택 시 피치 프레임 로드
  useEffect(() => {
    if (!selectedSong) return;
    axios
      .get(`${BASE_URL}/songs/${selectedSong.song_id}/pitch-frames`)
      .then((r) => setPitchFrames(r.data))
      .catch(() => setPitchFrames(null));
  }, [selectedSong]);

  // 마이크 상태 변경 시
  useEffect(() => {
    if (!isMicOn) {
      stopMic();
      return;
    }
    startMic();
    return () => stopMic();
  }, [isMicOn]);

  // semitones ref 동기화
  useEffect(() => { semitonesRef.current = semitones; }, [semitones]);

  // state → ref 동기화 (RAF 루프 stale closure 방지)
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { pitchFramesRef.current = pitchFrames; }, [pitchFrames]);
  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);

  // 통합 RAF 루프: origPitch + userPitch + canvas를 같은 프레임에서 처리
  useEffect(() => {
    function loop() {
      // 1) 원곡 피치 (재생 중일 때만)
      const pf = pitchFramesRef.current;
      if (isPlayingRef.current && pf) {
        const t = audioRef.current?.currentTime ?? 0;
        const idx = Math.round((t * 1000) / pf.hop_ms);
        const hz = idx < pf.hz.length ? pf.hz[idx] : null;
        const midi = hz ? hzToMidi(hz) : null;
        setOriginalPitch(midi);
        origPitchHistory.current.push(midi);
        if (origPitchHistory.current.length > MAX_HISTORY)
          origPitchHistory.current.shift();
      }

      // 2) 마이크 피치 (마이크 켜져 있을 때만)
      if (isMicOnRef.current && analyserRef.current && audioCtxRef.current && detectorRef.current && micBufRef.current) {
        const buf = micBufRef.current as Float32Array<ArrayBuffer>;
        analyserRef.current.getFloatTimeDomainData(buf);
        const [freq, clarity] = detectorRef.current.findPitch(buf, audioCtxRef.current.sampleRate);
        const raw = clarity > 0.8 && freq > 60 ? hzToMidi(freq) : null;

        const history = userPitchHistory.current;
        let midi = raw;
        if (midi === null && history.length > 0) {
          const recent = history.slice(-3);
          const lastValid = [...recent].reverse().find((v) => v !== null);
          if (lastValid !== undefined) midi = lastValid;
        }
        setUserPitch(midi);
        userPitchHistory.current.push(midi);
        if (userPitchHistory.current.length > MAX_HISTORY)
          userPitchHistory.current.shift();
      }

      // 3) Canvas 렌더
      drawCanvas();

      mainRafRef.current = requestAnimationFrame(loop);
    }

    mainRafRef.current = requestAnimationFrame(loop);
    return () => {
      if (mainRafRef.current) cancelAnimationFrame(mainRafRef.current);
    };
  }, [isDarkMode]);

  async function startMic() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const mic = ctx.createMediaStreamSource(stream);

    // 피치 분석용 analyser
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    mic.connect(analyser);
    analyserRef.current = analyser;

    // 에코 체인: mic → delay → feedbackGain → delay(루프) → wetGain → destination
    const delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.01;
    const feedbackGain = ctx.createGain();
    feedbackGain.gain.value = 0.4;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0; // 초기엔 꺼진 상태
    echoGainRef.current = wetGain;

    mic.connect(delay);
    delay.connect(feedbackGain);
    feedbackGain.connect(delay); // 피드백 루프
    delay.connect(wetGain);
    wetGain.connect(ctx.destination);

    // 통합 RAF 루프에서 사용할 detector/buf를 ref에 저장
    detectorRef.current = PitchDetector.forFloat32Array(analyser.fftSize);
    micBufRef.current = new Float32Array(analyser.fftSize);
  }

  function toggleEcho() {
    const gain = echoGainRef.current;
    if (!gain) return;
    const next = !isEchoOn;
    gain.gain.value = next ? 0.8 : 0;
    setIsEchoOn(next);
  }

  function stopMic() {
    detectorRef.current = null;
    micBufRef.current = null;
    if (echoGainRef.current) {
      echoGainRef.current.gain.value = 0;
      echoGainRef.current.disconnect();
      echoGainRef.current = null;
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setIsEchoOn(false);
    setUserPitch(null);
  }

  function drawCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 배경
    ctx.fillStyle = isDarkMode ? "#111" : "#f5f5f5";
    ctx.fillRect(0, 0, W, H);

    // 보컬 음역대 기준으로 범위 좁힘 (C3~C6)
    const MIDI_MIN = 48, MIDI_MAX = 72;
    function midiToY(m: number) {
      return H - ((m - MIDI_MIN) / (MIDI_MAX - MIDI_MIN)) * H;
    }

    // 반음 단위 가이드라인
    for (let m = MIDI_MIN; m <= MIDI_MAX; m++) {
      const isOctave = m % 12 === 0;
      const isC = m % 12 === 0;
      const y = midiToY(m);
      ctx.strokeStyle = isOctave
        ? (isDarkMode ? "#444" : "#bbb")
        : (isDarkMode ? "#222" : "#e5e5e5");
      ctx.lineWidth = isOctave ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      if (isC) {
        ctx.fillStyle = isDarkMode ? "#777" : "#888";
        ctx.font = "bold 12px monospace";
        ctx.fillText(midiToNoteName(m), 6, y - 4);
      }
    }

    const step = W / MAX_HISTORY;

    const MIDI_CENTER = (MIDI_MIN + MIDI_MAX) / 2;

    function drawTrack(
      c: CanvasRenderingContext2D,
      history: (number | null)[],
      color: string,
      dotColor: string,
      lineWidth: number,
      fillNull?: number,
    ) {
      const ctx = c;
      const N = history.length;
      // 오른쪽 끝 = 현재 시점, 왼쪽으로 갈수록 과거
      function xOf(i: number) {
        return W - (N - 1 - i) * step;
      }

      // 선
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      let started = false;
      history.forEach((m, i) => {
        const val = (m === null || m < MIDI_MIN || m > MIDI_MAX) ? (fillNull ?? null) : m;
        if (val === null) { started = false; return; }
        const x = xOf(i), y = midiToY(val);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 점 (실제 피치값 있을 때만)
      ctx.fillStyle = dotColor;
      history.forEach((m, i) => {
        if (m === null || m < MIDI_MIN || m > MIDI_MAX) return;
        const x = xOf(i), y = midiToY(m);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 원곡 피치 (초록) — semitones 반영 + null 구간은 중앙선
    const semi = semitonesRef.current;
    const shiftedOrig = origPitchHistory.current.map((m) => m !== null ? m + semi : null);
    drawTrack(ctx, shiftedOrig, "#00d9b1", "#00ffce", 2.5, MIDI_CENTER);
    // 사용자 피치 (흰/파랑)
    drawTrack(
      ctx,
      userPitchHistory.current,
      isDarkMode ? "rgba(255,255,255,0.9)" : "#4c6ef5",
      isDarkMode ? "#fff" : "#4c6ef5",
      3,
    );

    // 현재 위치 (항상 오른쪽 끝)
    const hasData = origPitchHistory.current.length > 0 || userPitchHistory.current.length > 0;
    if (hasData) {
      ctx.strokeStyle = isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W, 0);
      ctx.lineTo(W, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  async function playWithSemitones(song: Song, semi: number) {
    const url = `${BASE_URL}/songs/${song.song_id}/accompaniment?semitones=${semi}`;
    if (!audioRef.current) audioRef.current = new Audio();
    else audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.onended = () => setIsPlaying(false);
    await audioRef.current.play();
    setIsPlaying(true);
    userPitchHistory.current = [];
    origPitchHistory.current = [];
  }

  async function togglePlay() {
    if (!selectedSong) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    await playWithSemitones(selectedSong, semitones);
  }

  async function changeSemitones(val: number) {
    setSemitones(val);
    if (isPlaying && selectedSong) {
      await playWithSemitones(selectedSong, val);
    }
  }

  // 사용자 추천 키
  const recommendedKey = selectedSong && user?.midi_median
    ? Math.round(user.midi_median - selectedSong.midi_median)
    : null;

  const diff = userPitch !== null && originalPitch !== null
    ? Math.round((userPitch - (originalPitch + semitones)) * 10) / 10
    : null;

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: "url('https://cdn.pixabay.com/photo/2022/07/10/01/47/grades-7312021_1280.jpg')" }}
    >
      <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? "bg-black/80" : "bg-white/70"}`} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border} ${headerBg}`}>
          <div className="w-[85%] mx-auto px-12 py-6 flex items-center justify-between">
            <button onClick={onBack} className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"}`}>
              <ArrowLeft className={`w-6 h-6 ${textColor}`} />
            </button>
            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>PitchWizard</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="pt-36 pb-16 px-10 w-[85%] mx-auto flex-1 space-y-6">
          <h2 className={`text-[36px] font-bold ${textColor}`}>반주 & 실시간 피치</h2>

          {/* 곡 검색 */}
          <div className={`rounded-2xl border ${border} ${cardBg} p-6 backdrop-blur-xl`}>
            <p className={`text-sm font-medium mb-3 ${subTextColor}`}>곡 검색</p>
            <div className="relative">
              <div className={`flex items-center gap-3 rounded-xl border ${border} px-4 py-3 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                <Search className={`w-4 h-4 flex-shrink-0 ${subTextColor}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowList(true); }}
                  onFocus={() => setShowList(true)}
                  placeholder="제목 또는 가수 검색"
                  className={`flex-1 bg-transparent outline-none text-[15px] ${textColor} placeholder:${subTextColor}`}
                />
                {selectedSong && (
                  <button onClick={() => { setSelectedSong(null); setSearchQuery(""); setIsPlaying(false); }}>
                    <X className={`w-4 h-4 ${subTextColor}`} />
                  </button>
                )}
              </div>

              {/* 선택된 곡 표시 */}
              {selectedSong && (
                <div className="mt-2 px-1">
                  <span className="text-[#00d9b1] text-sm font-medium">
                    ✓ {selectedSong.title} - {selectedSong.artist}
                  </span>
                </div>
              )}

              {/* 검색 결과 드롭다운 */}
              {showList && searchQuery && (
                <div className={`absolute z-50 w-full mt-2 rounded-xl border ${border} overflow-hidden shadow-2xl ${isDarkMode ? "bg-[#1f1f1f]" : "bg-white"}`}>
                  {songs
                    .filter((s) =>
                      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.artist.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 8)
                    .map((s) => (
                      <button
                        key={s.song_id}
                        className={`w-full text-left px-4 py-3 text-[14px] ${textColor} transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"} border-b last:border-b-0 ${border}`}
                        onClick={() => {
                          setSelectedSong(s);
                          setSearchQuery("");
                          setShowList(false);
                          setIsPlaying(false);
                          setSemitones(0);
                        }}
                      >
                        <span className="font-medium">{s.title}</span>
                        <span className={`ml-2 text-[13px] ${subTextColor}`}>{s.artist}</span>
                      </button>
                    ))}
                  {songs.filter((s) =>
                    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.artist.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className={`px-4 py-4 text-sm text-center ${subTextColor}`}>검색 결과가 없습니다</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {selectedSong && (
            <>
              {/* 키 조절 + 재생 */}
              <div className={`rounded-2xl border ${border} ${cardBg} p-6 backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-sm font-medium ${subTextColor}`}>키 조절</p>
                  {recommendedKey !== null && (
                    <button
                      onClick={() => changeSemitones(Math.max(-5, Math.min(5, recommendedKey)))}
                      className="text-xs px-3 py-1 rounded-full bg-[#00d9b1]/20 text-[#00d9b1] border border-[#00d9b1]/30"
                    >
                      추천 키 {recommendedKey > 0 ? `+${recommendedKey}` : recommendedKey} 적용
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-[28px] font-bold w-16 text-center ${textColor}`}>
                    {semitones > 0 ? `+${semitones}` : semitones}
                  </span>
                  <input
                    type="range" min={-5} max={5} step={1}
                    value={semitones}
                    onChange={(e) => changeSemitones(Number(e.target.value))}
                    className="flex-1 accent-[#00d9b1]"
                  />
                  <button
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full bg-[#00d9b1] flex items-center justify-center shadow-lg hover:opacity-90 transition"
                  >
                    {isPlaying ? <Square className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                  </button>
                </div>
              </div>

              {/* 실시간 피치 Canvas */}
              <div className={`rounded-2xl border ${border} ${cardBg} p-6 backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-4">
                  <p className={`text-sm font-medium ${subTextColor}`}>실시간 피치 비교</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#00d9b1] inline-block" />원곡</span>
                    <span className={`flex items-center gap-1 ${isDarkMode ? "text-white" : "text-[#4c6ef5]"}`}>
                      <span className={`w-3 h-0.5 inline-block ${isDarkMode ? "bg-white" : "bg-[#4c6ef5]"}`} />내 목소리
                    </span>
                    <button
                      onClick={() => setIsMicOn((v) => !v)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full border transition ${
                        isMicOn
                          ? "bg-[#00d9b1]/20 border-[#00d9b1]/50 text-[#00d9b1]"
                          : `border-white/20 ${subTextColor}`
                      }`}
                    >
                      {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                      {isMicOn ? "마이크 ON" : "마이크 OFF"}
                    </button>
                    {isMicOn && (
                      <button
                        onClick={toggleEcho}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full border transition text-xs ${
                          isEchoOn
                            ? "bg-purple-500/20 border-purple-400/50 text-purple-300"
                            : `border-white/20 ${subTextColor}`
                        }`}
                      >
                        🎙 에코 {isEchoOn ? "ON" : "OFF"}
                      </button>
                    )}
                  </div>
                </div>

                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={400}
                  className="w-full rounded-xl"
                  style={{ height: "280px" }}
                />

                {/* 현재 피치 수치 */}
                <div className="mt-4 flex gap-6 text-sm">
                  <div>
                    <p className={subTextColor}>원곡 피치</p>
                    <p className={`text-lg font-bold ${textColor}`}>
                      {originalPitch !== null ? midiToNoteName(Math.round(originalPitch + semitones)) : "--"}
                    </p>
                  </div>
                  <div>
                    <p className={subTextColor}>내 피치</p>
                    <p className={`text-lg font-bold ${textColor}`}>
                      {userPitch !== null ? midiToNoteName(Math.round(userPitch)) : "--"}
                    </p>
                  </div>
                  {diff !== null && (
                    <div>
                      <p className={subTextColor}>차이</p>
                      <p className={`text-lg font-bold ${Math.abs(diff) < 0.5 ? "text-[#00d9b1]" : "text-red-400"}`}>
                        {diff > 0 ? `+${diff}` : diff} 반음
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!pitchFrames && (
                <p className={`text-sm text-center ${subTextColor}`}>
                  이 곡은 피치 프레임 데이터가 없습니다. 원곡 라인은 표시되지 않아요.
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
