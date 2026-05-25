import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Music2 } from "lucide-react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

function midiToNote(midi: number): string {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  return names[midi % 12] + (Math.floor(midi / 12) - 1);
}

// 흰 건반 노트명 + 각 MIDI 값 (C3=48 ~ C6=84)
const WHITE_KEY_NOTES = ["C","D","E","F","G","A","B"];
const WHITE_KEY_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

type WhiteKey = { note: string; midi: number; hasBlackRight: boolean };

const whiteKeys: WhiteKey[] = [];
for (let oct = 3; oct <= 5; oct++) {
  WHITE_KEY_NOTES.forEach((n, i) => {
    whiteKeys.push({
      note: n + oct,
      midi: (oct + 1) * 12 + WHITE_KEY_SEMITONES[i],
      hasBlackRight: n !== "E" && n !== "B",
    });
  });
}
// C6 추가
whiteKeys.push({ note: "C6", midi: 84, hasBlackRight: false });

type Song = {
  song_id: number;
  title: string;
  artist: string;
  midi_min: number;
  midi_median: number;
  midi_max: number;
};

type Props = {
  singerName: string;
  onBack: () => void;
  isDarkMode: boolean;
};

export default function SingerPage({ singerName, onBack, isDarkMode }: Props) {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    axios.get(`${BASE_URL}/songs`).then((r) => {
      setSongs(r.data.filter((s: Song) => s.artist === singerName));
    }).catch(() => {});
  }, [singerName]);

  // 가수 전체 음역대 계산
  const validSongs = songs.filter((s) => s.midi_min && s.midi_max);
  const avgMin = validSongs.length
    ? Math.round(validSongs.reduce((a, s) => a + s.midi_min, 0) / validSongs.length)
    : null;
  const avgMax = validSongs.length
    ? Math.round(validSongs.reduce((a, s) => a + s.midi_max, 0) / validSongs.length)
    : null;
  const avgMedian = validSongs.length
    ? Math.round(validSongs.reduce((a, s) => a + s.midi_median, 0) / validSongs.length)
    : null;

  const lowNote = avgMin != null ? midiToNote(avgMin) : null;
  const highNote = avgMax != null ? midiToNote(avgMax) : null;
  const hasMeasured = avgMin != null && avgMax != null;

  // 흑건 MIDI → 왼쪽 흰건에 귀속
  function blackKeyOwner(midi: number) {
    // 흑건은 바로 왼쪽 흰건 index 기준으로 색칠
    const idx = whiteKeys.findIndex((k) => k.midi > midi);
    return idx > 0 ? idx - 1 : -1;
  }

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const cardBg = isDarkMode ? "bg-white/8" : "bg-white/82";
  const mutedCardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";

  return (
    <div
      className={`min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat ${bgColor}`}
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
              className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"}`}
              aria-label="뒤로 가기"
            >
              <ArrowLeft className={`w-6 h-6 ${textColor}`} />
            </button>
            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>PitchWizard</h1>
            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 pt-36 pb-16">
          <div className="w-[85%] max-w-[1180px] mx-auto">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-[#00d9b1]">Singer Voice Range</p>
              <h2 className={`mt-4 text-[50px] md:text-[52px] font-bold leading-[1.04] ${textColor}`}>
                {singerName}
              </h2>
            </div>

            <div className="mt-8 space-y-6">
              {/* 음역대 카드 */}
              <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`text-[20px] font-semibold ${textColor}`}>평균 음역대</h3>
                </div>

                <div className={`mt-6 rounded-2xl border ${border} ${mutedCardBg} p-6 md:p-7`}>
                  <p className={`text-[14px] tracking-wide ${subTextColor}`}>음역대 범위</p>
                  <p className={`mt-2 text-[54px] md:text-[70px] font-bold leading-none ${textColor}`}>
                    {hasMeasured ? `${lowNote} ~ ${highNote}` : "데이터 없음"}
                  </p>

                  {/* 피아노 건반 */}
                  <div className={`mt-5 rounded-2xl border ${border} ${isDarkMode ? "bg-black/30" : "bg-white/80"} p-4`}>
                    <div className="relative h-[120px] rounded-xl border border-black/15 overflow-hidden bg-gradient-to-b from-white to-[#f0f0f0]">
                      <div className="absolute inset-0 flex">
                        {whiteKeys.map((key, index) => {
                          const whiteInRange = hasMeasured && key.midi >= avgMin! && key.midi <= avgMax!;
                          const blackMidi = key.midi + 1; // 이 흰건 오른쪽 흑건 MIDI
                          const blackInRange = hasMeasured && blackMidi >= avgMin! && blackMidi <= avgMax!;
                          return (
                            <div
                              key={key.note}
                              className={`relative flex-1 border-r last:border-r-0 ${
                                whiteInRange
                                  ? "bg-gradient-to-b from-[#b8ffef] to-[#83f5d8] border-black/20"
                                  : "bg-gradient-to-b from-white to-[#ececec] border-black/15"
                              }`}
                            >
                              {key.hasBlackRight && index < whiteKeys.length - 1 ? (
                                <span
                                  className={`absolute right-0 top-0 translate-x-1/2 z-10 h-[66px] w-[54%] rounded-b-md border border-black/50 shadow-[0_7px_10px_rgba(0,0,0,0.35)] ${
                                    blackInRange
                                      ? "bg-gradient-to-b from-[#00f3c8] to-[#00b894]"
                                      : "bg-gradient-to-b from-[#262626] to-black"
                                  }`}
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className={`mt-3 flex justify-between text-[13px] ${subTextColor}`}>
                      <span>C3</span>
                      <span className="text-[#00efc4] font-semibold">
                        {hasMeasured ? `${lowNote} ~ ${highNote}` : "데이터 없음"}
                      </span>
                      <span>C6</span>
                    </div>
                  </div>
                </div>

                {/* 통계 */}
                {avgMedian && (
                  <div className={`mt-4 grid grid-cols-3 gap-4`}>
                    {[
                      { label: "최저음 (평균)", value: lowNote },
                      { label: "중앙음 (평균)", value: avgMedian ? midiToNote(avgMedian) : "--" },
                      { label: "최고음 (평균)", value: highNote },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-2xl border ${border} ${mutedCardBg} p-4 text-center`}>
                        <p className={`text-[13px] ${subTextColor}`}>{item.label}</p>
                        <p className={`mt-1 text-[26px] font-bold text-[#00efc4]`}>{item.value ?? "--"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* 곡 목록 */}
              <section className={`rounded-[30px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <Music2 className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`text-[20px] font-semibold ${textColor}`}>수록곡 ({songs.length})</h3>
                </div>

                {songs.length === 0 ? (
                  <p className={`mt-5 text-sm ${subTextColor}`}>등록된 곡이 없습니다.</p>
                ) : (
                  <div className="mt-5 space-y-3">
                    {songs.map((song) => (
                      <div
                        key={song.song_id}
                        className={`flex items-center justify-between gap-4 rounded-2xl border ${border} ${mutedCardBg} px-5 py-4`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? "bg-white/10" : "bg-[#1f1f1f]/10"}`}>
                            <Music2 className={`h-4 w-4 ${textColor}`} />
                          </div>
                          <p className={`truncate text-[16px] font-medium ${textColor}`}>{song.title}</p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          {song.midi_min != null && song.midi_max != null ? (
                            <span className="rounded-full border border-[#00d9b1]/35 px-3 py-1 text-xs text-[#00e5be]">
                              {midiToNote(Math.round(song.midi_min))} ~ {midiToNote(Math.round(song.midi_max))}
                            </span>
                          ) : null}
                          {song.midi_median != null ? (
                            <span className={`rounded-full border ${border} px-3 py-1 text-xs ${subTextColor}`}>
                              중앙 {midiToNote(Math.round(song.midi_median))}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
