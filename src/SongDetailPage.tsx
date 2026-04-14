import { ArrowLeft, Music2, PlayCircle, UserRound } from "lucide-react";

type SongInfo = {
  id: string | number;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  midiMin?: number | null;
  midiMedian?: number | null;
  midiMax?: number | null;
  rmsMean?: number | null;
  rmsStd?: number | null;
};

type Props = {
  onBack: () => void;
  onGoAccompaniment: () => void;
  isDarkMode: boolean;
  user: any;
  song: SongInfo;
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToNoteName(midi: number) {
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${octave}`;
}

function buildWhiteMidiKeys() {
  const keys: number[] = [];
  for (let midi = 36; midi <= 84; midi += 1) {
    const note = NOTE_NAMES[midi % 12];
    if (!note.includes("#")) keys.push(midi);
  }
  return keys;
}

function hasBlackKeyToRight(whiteMidi: number) {
  const note = NOTE_NAMES[whiteMidi % 12];
  return note !== "E" && note !== "B";
}

function clampToAccompanimentRange(value: number) {
  return Math.max(-5, Math.min(5, value));
}

function inRange(midi: number, min: number | null, max: number | null) {
  if (min === null || max === null) return false;
  return midi >= min && midi <= max;
}

function keyClass(inSong: boolean, inUser: boolean, isBlack: boolean) {
  if (inSong && inUser) {
    return isBlack
      ? "bg-gradient-to-b from-[#00f4c9] to-[#00c89f]"
      : "bg-gradient-to-b from-[#b9ffef] to-[#82f1d6]";
  }
  if (inSong) {
    return isBlack
      ? "bg-gradient-to-b from-[#ffd37a] to-[#ffad33]"
      : "bg-gradient-to-b from-[#ffe8bc] to-[#ffd388]";
  }
  if (inUser) {
    return isBlack
      ? "bg-gradient-to-b from-[#79d2ff] to-[#3b9fff]"
      : "bg-gradient-to-b from-[#c5edff] to-[#8ad4ff]";
  }
  return isBlack ? "bg-gradient-to-b from-[#2a2a2a] to-black" : "bg-gradient-to-b from-white to-[#ececec]";
}

export default function SongDetailPage({ onBack, onGoAccompaniment, isDarkMode, user, song }: Props) {
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const cardBg = isDarkMode ? "bg-white/8" : "bg-white/85";
  const softCardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";

  const songMin = typeof song.midiMin === "number" ? song.midiMin : null;
  const songMedian = typeof song.midiMedian === "number" ? song.midiMedian : null;
  const songMax = typeof song.midiMax === "number" ? song.midiMax : null;

  const userMin = typeof user?.midi_min === "number" && user.midi_min > 0 ? user.midi_min : null;
  const userMedian = typeof user?.midi_median === "number" && user.midi_median > 0 ? user.midi_median : null;
  const userMax = typeof user?.midi_max === "number" && user.midi_max > 0 ? user.midi_max : null;

  const hasSongRange = songMin !== null && songMax !== null;
  const hasUserRange = userMin !== null && userMax !== null;

  const overlapMin = hasSongRange && hasUserRange ? Math.max(songMin, userMin) : null;
  const overlapMax = hasSongRange && hasUserRange ? Math.min(songMax, userMax) : null;
  const hasOverlap = overlapMin !== null && overlapMax !== null && overlapMin <= overlapMax;

  const recommendedShift =
    typeof songMedian === "number" && typeof userMedian === "number"
      ? clampToAccompanimentRange(Math.round(userMedian - songMedian))
      : null;

  const whiteKeys = buildWhiteMidiKeys();

  return (
    <div
      className="min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2022/07/10/01/47/grades-7312021_1280.jpg')",
      }}
    >
      <div className={`absolute inset-0 backdrop-blur-md ${isDarkMode ? "bg-black/80" : "bg-white/60"}`} />

      <div className="relative z-10 min-h-screen flex flex-col font-['Pretendard']">
        <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border} ${headerBg}`}>
          <div className="w-[85%] mx-auto px-12 py-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
              }`}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className={`w-6 h-6 ${textColor}`} />
            </button>

            <h1 className={`text-[22px] font-thin tracking-wide ${textColor}`}>PitchWizard</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="pt-36 pb-16 px-6 md:px-10">
          <div className="w-[92%] max-w-[1240px] mx-auto space-y-6">
            <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
              <p className="text-sm uppercase tracking-[0.28em] text-[#00d9b1]">Song Profile</p>
              <h2 className={`mt-4 text-[44px] md:text-[52px] font-bold leading-[1.05] ${textColor}`}>
                {song.title}
              </h2>
              <p className={`mt-2 text-[20px] ${subTextColor}`}>{song.artist}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {hasSongRange ? (
                  <span className="rounded-full border border-[#00d9b1]/35 px-3 py-1 text-sm text-[#00e7bf]">
                    음역 {midiToNoteName(songMin)} ~ {midiToNoteName(songMax)}
                  </span>
                ) : null}
                {typeof songMedian === "number" ? (
                  <span className={`rounded-full border ${border} px-3 py-1 text-sm ${subTextColor}`}>
                    중앙 {midiToNoteName(songMedian)}
                  </span>
                ) : null}
                {song.album ? (
                  <span className={`rounded-full border ${border} px-3 py-1 text-sm ${subTextColor}`}>
                    앨범 {song.album}
                  </span>
                ) : null}
                {song.duration ? (
                  <span className={`rounded-full border ${border} px-3 py-1 text-sm ${subTextColor}`}>
                    재생 {song.duration}
                  </span>
                ) : null}
              </div>
            </section>

            <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
              <div className="flex items-center gap-3">
                <Music2 className={`w-5 h-5 ${textColor}`} />
                <h3 className={`text-[24px] font-semibold ${textColor}`}>음역대 비교</h3>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#ffbf59]/40 px-3 py-1 text-xs text-[#ffcf7d]">
                  곡 음역대
                </span>
                <span className="rounded-full border border-[#63c8ff]/45 px-3 py-1 text-xs text-[#9edfff]">
                  내 음역대
                </span>
                <span className="rounded-full border border-[#00d9b1]/40 px-3 py-1 text-xs text-[#00efc4]">
                  겹치는 구간
                </span>
              </div>

              <div className={`mt-5 rounded-2xl border ${border} ${softCardBg} p-4 md:p-5`}>
                <div className="relative h-[130px] rounded-xl border border-black/15 overflow-hidden bg-gradient-to-b from-white to-[#f0f0f0]">
                  <div className="absolute inset-0 flex">
                    {whiteKeys.map((whiteMidi, index) => {
                      const whiteInSong = inRange(whiteMidi, songMin, songMax);
                      const whiteInUser = inRange(whiteMidi, userMin, userMax);
                      const blackMidi = whiteMidi + 1;
                      const blackInSong = hasBlackKeyToRight(whiteMidi) && inRange(blackMidi, songMin, songMax);
                      const blackInUser = hasBlackKeyToRight(whiteMidi) && inRange(blackMidi, userMin, userMax);
                      return (
                        <div
                          key={`white-${whiteMidi}`}
                          className={`relative flex-1 border-r last:border-r-0 border-black/15 ${keyClass(
                            whiteInSong,
                            whiteInUser,
                            false,
                          )}`}
                        >
                          {hasBlackKeyToRight(whiteMidi) && index < whiteKeys.length - 1 ? (
                            <span
                              className={`absolute right-0 top-0 translate-x-1/2 z-10 h-[72px] w-[54%] rounded-b-md border border-black/50 shadow-[0_7px_10px_rgba(0,0,0,0.35)] ${keyClass(
                                blackInSong,
                                blackInUser,
                                true,
                              )}`}
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className={`mt-3 flex justify-between text-xs ${subTextColor}`}>
                  <span>C2</span>
                  <span>C4</span>
                  <span>C6</span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className={`rounded-2xl border ${border} ${softCardBg} p-4`}>
                  <p className={`text-sm ${subTextColor}`}>곡 음역대</p>
                  <p className={`mt-1 text-[22px] font-semibold ${textColor}`}>
                    {hasSongRange ? `${midiToNoteName(songMin)} ~ ${midiToNoteName(songMax)}` : "정보 없음"}
                  </p>
                </div>
                <div className={`rounded-2xl border ${border} ${softCardBg} p-4`}>
                  <p className={`text-sm ${subTextColor}`}>내 음역대</p>
                  <p className={`mt-1 text-[22px] font-semibold ${textColor}`}>
                    {hasUserRange ? `${midiToNoteName(userMin)} ~ ${midiToNoteName(userMax)}` : "아직 측정 전"}
                  </p>
                </div>
              </div>

              <div className={`mt-4 rounded-2xl border ${border} ${softCardBg} p-5`}>
                <div className="flex items-center gap-2">
                  <UserRound className={`h-5 w-5 ${textColor}`} />
                  <p className={`text-[18px] font-semibold ${textColor}`}>비교 해석</p>
                </div>
                {!hasUserRange ? (
                  <p className={`mt-3 text-[15px] leading-7 ${subTextColor}`}>
                    내 음역대 데이터가 아직 없습니다. 먼저 음역대 테스트를 완료하면 이 곡과의 겹침 구간과
                    추천 전조를 정확히 안내할 수 있습니다.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    <p className={`text-[15px] leading-7 ${subTextColor}`}>
                      {hasOverlap
                        ? `겹치는 구간은 ${midiToNoteName(overlapMin)} ~ ${midiToNoteName(overlapMax)}입니다.`
                        : "현재 측정값 기준으로는 겹치는 구간이 거의 없습니다."}
                    </p>
                    <p className={`text-[15px] leading-7 ${subTextColor}`}>
                      추천 전조는{" "}
                      <span className="font-semibold text-[#00efc4]">
                        {recommendedShift === null
                          ? "계산 불가"
                          : recommendedShift > 0
                            ? `+${recommendedShift}키`
                            : `${recommendedShift}키`}
                      </span>
                      입니다.
                    </p>
                  </div>
                )}
              </div>

              <div className={`mt-7 rounded-2xl border ${border} ${softCardBg} p-5 md:p-6`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className={`text-[18px] font-semibold ${textColor}`}>반주 재생으로 이어가기</p>
                    <p className={`mt-1 text-sm ${subTextColor}`}>
                      선택한 곡을 반주 페이지에서 바로 불러옵니다
                      {recommendedShift !== null
                        ? ` · 추천 ${recommendedShift > 0 ? `+${recommendedShift}` : recommendedShift}키`
                        : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onGoAccompaniment}
                    className={`inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold transition ${
                      isDarkMode
                        ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
                        : "bg-[#1f1f1f]/8 text-[#1f1f1f] border border-[#1f1f1f]/15 hover:bg-[#1f1f1f]/12"
                    }`}
                  >
                    <PlayCircle className="h-5 w-5 text-[#00e9c0]" />
                    반주 페이지로 이동
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
