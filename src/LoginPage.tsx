import { useState } from "react";
import { ArrowLeft, Lock, UserRound } from "lucide-react";
import { login } from "./api/authApi";

type Props = {
  onBack: () => void;
  onLogin?: (user: object) => void;
  isDarkMode: boolean;
};

export default function LoginPage({ onBack, onLogin, isDarkMode }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const bgColor = isDarkMode ? "bg-[#1f1f1f]/60" : "bg-[#f8f7f9]/60";
  const textColor = isDarkMode ? "text-white" : "text-[#1f1f1f]";
  const subTextColor = isDarkMode ? "text-white/70" : "text-[#1f1f1f]/70";
  const border = isDarkMode ? "border-white/10" : "border-[#1f1f1f]/10";
  const headerBg = isDarkMode ? "bg-[#1f1f1f]/90" : "bg-[#f8f7f9]/90";
  const cardBg = isDarkMode ? "bg-white/8" : "bg-white/75";
  const mutedCardBg = isDarkMode ? "bg-white/5" : "bg-[#1f1f1f]/5";
  const inputBg = isDarkMode ? "bg-black/20" : "bg-white/80";
  const placeholderColor = isDarkMode ? "placeholder:text-white/35" : "placeholder:text-black/35";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(username, password);
      if (rememberMe) localStorage.setItem("user", JSON.stringify(user));
      onLogin?.(user);
      onBack();
    } catch (err: any) {
      setError(err.response?.data?.detail || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

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
          isDarkMode ? "bg-black/70" : "bg-white/70"
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

        <main className="flex-1 pt-32 pb-16 px-6 md:px-10">
          <div className="w-full max-w-[1100px] mx-auto grid gap-10 lg:grid-cols-1 items-center">
            <section className="pt-10 lg:pt-20">

              
            </section>

            <section
              className={`w-full max-w-[580px] mx-auto rounded-[32px] border ${border} ${cardBg} p-8 md:p-10 backdrop-blur-xl shadow-2xl shadow-black/15`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm uppercase tracking-[0.24em] ${subTextColor}`}>Account Access</p>
                  <h3 className={`mt-3 text-3xl font-semibold ${textColor}`}>로그인</h3>
                </div>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                    isDarkMode ? "bg-white/10" : "bg-[#1f1f1f]/6"
                  }`}
                >
                  <UserRound className={`w-7 h-7 ${textColor}`} />
                </div>
              </div>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${subTextColor}`}>아이디</span>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border ${border} ${inputBg} px-4 py-4`}
                  >
                    <UserRound className={`w-5 h-5 ${subTextColor}`} />
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="아이디를 입력하세요"
                      className={`w-full bg-transparent outline-none text-[16px] ${textColor} ${placeholderColor}`}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${subTextColor}`}>비밀번호</span>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border ${border} ${inputBg} px-4 py-4`}
                  >
                    <Lock className={`w-5 h-5 ${subTextColor}`} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className={`w-full bg-transparent outline-none text-[16px] ${textColor} ${placeholderColor}`}
                    />
                  </div>
                </label>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <label className={`flex items-center gap-3 text-sm ${subTextColor}`}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe((value) => !value)}
                      className="h-4 w-4 rounded border-white/30 accent-[#00d9b1]"
                    />
                    로그인 상태 유지
                  </label>

                  <button type="button" className="text-sm font-medium text-[#00d9b1]">
                    비밀번호 찾기
                  </button>
                </div>

                {error && (
                  <p className="text-sm text-red-400 text-center">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00d9b1] to-[#00efc4] py-4 text-[17px] font-semibold text-white shadow-xl shadow-[#00d9b1]/20 transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60"
                >
                  {loading ? "로그인 중..." : "로그인하기"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-4">
                <div className={`h-px flex-1 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
                <span className={`text-xs uppercase tracking-[0.3em] ${subTextColor}`}>or</span>
                <div className={`h-px flex-1 ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} />
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  className={`w-full rounded-2xl border ${border} ${mutedCardBg} py-4 text-[15px] font-medium ${textColor} transition-colors ${
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                  }`}
                >
                  Google로 계속하기
                </button>
                <button
                  type="button"
                  className={`w-full rounded-2xl border ${border} ${mutedCardBg} py-4 text-[15px] font-medium ${textColor} transition-colors ${
                    isDarkMode ? "hover:bg-white/10" : "hover:bg-[#1f1f1f]/10"
                  }`}
                >
                  카카오로 계속하기
                </button>
              </div>

              <p className={`mt-8 text-center text-sm ${subTextColor}`}>
                계정이 없으신가요? <button className="font-semibold text-[#00d9b1]">회원가입</button>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
