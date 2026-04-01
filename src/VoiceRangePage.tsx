import { ArrowLeft, BarChart3, Mic2, UserRound } from "lucide-react";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
};

type SimilarSinger = {
  name: string;
  type: string;
  note: string;
};

const similarSingers: SimilarSinger[] = [
  { name: "가수 A", type: "테너", note: "중고음 발성이 안정적인 타입" },
  { name: "가수 B", type: "하이 바리톤", note: "중저음 밀도와 고음 전환이 강점" },
  { name: "가수 C", type: "테너", note: "고음 구간 공명 포인트가 유사" },
];

export default function VoiceRangePage({ onBack, isDarkMode }: Props) {
  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const cardBg = isDarkMode ? "bg-white/8" : "bg-white/80";
  const mutedCardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";

  return (
    <div
      className={`min-h-screen relative bg-cover bg-center bg-fixed bg-no-repeat ${bgColor}`}
      style={{
        backgroundImage:
          "url('https://cdn.pixabay.com/photo/2022/07/10/01/47/grades-7312021_1280.jpg')",
      }}
    >
      <div
        className={`absolute inset-0 backdrop-blur-md ${
          isDarkMode ? "bg-black/80" : "bg-white/60"
        }`}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header
          className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border} ${headerBg}`}
        >
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

            <h1 className={`font-['Pretendard'] text-[22px] font-thin tracking-wide ${textColor}`}>
              PitchWizard
            </h1>

            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 pt-36 pb-16">
          <div className="w-[85%] max-w-[1180px] mx-auto">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-[#00d9b1]">Voice Range Result</p>
              <h2 className={`font-['Pretendard'] mt-4 text-[48px] md:text-[48px] font-bold leading-[1.05] ${textColor}`}>
                나의 음역대
              </h2>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <section className={`rounded-[28px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <BarChart3 className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`font-['Pretendard'] text-[24px] font-thin ${textColor}`}>음역대 테스트 결과</h3>
                </div>

                <div className={`mt-6 rounded-2xl border ${border} ${mutedCardBg} p-6 md:p-7`}>
                  <p className={`font-['Pretendard'] text-[14px] tracking-wide ${subTextColor}`}>측정 구간</p>
                  <p className={`font-['Pretendard'] mt-2 text-[48px] md:text-[62px] font-bold leading-none ${textColor}`}>G2 ~ A4</p>
                  <div className="mt-5 h-4 rounded-full bg-black/20 overflow-hidden">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#00d9b1] to-[#00efc4]" />
                  </div>
                  <div className={`font-['Pretendard'] mt-3 font-thin flex justify-between text-[14px] ${subTextColor}`}>
                    <span>낮은 음역</span>
                    <span>중간</span>
                    <span>높은 음역</span>
                  </div>
                </div>

                <div className={`font-['Pretendard'] mt-6 rounded-2xl border ${border} ${mutedCardBg} p-6`}>
                  <div className="flex items-center gap-2">
                    <Mic2 className={`w-5 h-5 ${textColor}`} />
                    <p className={`text-[20px] font-semibold ${textColor}`}>음역 해석</p>
                  </div>
                  <p className={`mt-3 text-[20px] font-light leading-9 ${subTextColor}`}>
                    이 범위는 일반적으로{" "}
                    <span className="text-[#00efc4] font-semibold">테너 ~ 하이 바리톤</span>에 가깝습니다.
                  </p>
                </div>
              </section>

              <section className={`rounded-[28px] border ${border} ${cardBg} p-7 md:p-8 backdrop-blur-xl`}>
                <div className="flex items-center gap-3">
                  <UserRound className={`w-5 h-5 ${textColor}`} />
                  <h3 className={`text-[24px] font-semibold ${textColor}`}>유사 음역대 가수</h3>
                </div>

                <div className="mt-5 space-y-3">
                  {similarSingers.map((singer) => (
                    <div
                      key={singer.name}
                      className={`rounded-2xl border ${border} ${mutedCardBg} p-4 flex items-start gap-3`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-[#00d9b1]/20 text-[#00efc4] flex items-center justify-center font-semibold">
                        {singer.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className={`text-[17px] font-semibold ${textColor}`}>{singer.name}</p>
                        <p className="text-[#00efc4] text-sm mt-0.5">{singer.type}</p>
                        <p className={`mt-1 text-[14px] ${subTextColor}`}>{singer.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
