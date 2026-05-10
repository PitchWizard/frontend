import PitchTestpiano from "./PitchTestpiano";
import { ArrowLeft, LogIn, Sparkles } from "lucide-react";

type Props = {
  onBack: () => void;
  isDarkMode: boolean;
  user: any;
  onTestComplete: (updated: object) => void;
};

export default function PitchTest({ onBack, isDarkMode, user, onTestComplete }: Props) {
  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const glassCard = isDarkMode ? "bg-white/[0.07]" : "bg-white/80";

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
          isDarkMode ? "bg-black/75" : "bg-white/65"
        }`}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header
          className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${border} ${headerBg}`}
        >
          <div className="w-[88%] max-w-[1280px] mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
            <button
              onClick={onBack}
              className={`p-2.5 rounded-xl transition-colors ${
                isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
              }`}
              aria-label="뒤로가기"
            >
              <ArrowLeft className={`w-5 h-5 ${textColor}`} />
            </button>

            <h1 className={`font-['Pretendard'] text-[21px] font-light tracking-wide ${textColor}`}>
              PitchWizard
            </h1>

            <div className="w-10" />
          </div>
        </header>

        <main className="pt-32 md:pt-36 pb-14 px-4 md:px-8 w-[92%] max-w-[1280px] mx-auto flex-1">
          <section className="mb-7 md:mb-9">
            <div className={`inline-flex items-center gap-2 rounded-full border ${border} ${glassCard} px-4 py-2`}>
              <Sparkles className={`w-4 h-4 ${subTextColor}`} />
              <span className={`text-sm ${subTextColor}`}>Vocal Range Check</span>
            </div>
            <h2 className={`mt-4 font-['Pretendard'] text-[34px] md:text-[42px] font-bold ${textColor}`}>
              음역대 테스트
            </h2>
            <p className={`mt-3 text-[15px] md:text-[16px] leading-relaxed ${subTextColor}`}>
              마이크 버튼을 누른 뒤 재생되는 기준음을 따라 불러주세요.
              각 음정의 정확도를 기반으로 음역대를 계산합니다.
            </p>
          </section>

          {!user ? (
            <div
              className={`flex flex-col items-center justify-center gap-5 py-20 md:py-24 rounded-3xl border ${border} ${glassCard} backdrop-blur-xl`}
            >
              <LogIn className={`w-12 h-12 ${subTextColor}`} />
              <p className={`text-[20px] font-semibold ${textColor}`}>로그인이 필요한 기능입니다</p>
              <p className={`text-[15px] ${subTextColor}`}>측정 결과를 저장하려면 먼저 로그인해 주세요.</p>
              <button
                onClick={onBack}
                className="px-7 py-3 rounded-full bg-[#06c6a4] text-white font-semibold text-[15px] hover:opacity-90 transition"
              >
                홈으로 돌아가기
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className={`w-full rounded-3xl border ${border} ${glassCard} backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden`}
              >
                <PitchTestpiano userId={user.id} onTestComplete={onTestComplete} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
