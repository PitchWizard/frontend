import { useState } from "react";
import { ArrowLeft, Check, Lock, Mail, UserRound, X } from "lucide-react";
import { signup } from "./api/authApi";

type Props = {
  onBack: () => void;
  onGoLogin?: () => void;
  isDarkMode: boolean;
};

export default function SignupPage({ onBack, onGoLogin, isDarkMode }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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
  const passwordPolicyText = "8자 이상, 영문 대/소문자, 숫자를 포함해 주세요.";

  function isValidPassword(value: string) {
    const hasMinLength = value.length >= 8;
    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    return hasMinLength && hasUppercase && hasLowercase && hasNumber;
  }

  const passwordChecks = [
    { label: "8자 이상", valid: password.length >= 8 },
    { label: "영문 대문자 포함", valid: /[A-Z]/.test(password) },
    { label: "영문 소문자 포함", valid: /[a-z]/.test(password) },
    { label: "숫자 포함", valid: /\d/.test(password) },
  ];

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const normalizedEmail = email.trim();

    if (!username || !normalizedEmail || !password || !confirmPassword) {
      setError("모든 항목을 입력해 주세요.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("올바른 이메일 형식을 입력해 주세요.");
      return;
    }

    if (!isValidPassword(password)) {
      setError(`비밀번호 규칙을 확인해 주세요. (${passwordPolicyText})`);
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    try {
      await signup({ username, email: normalizedEmail, password });
      setSuccess("회원가입이 완료되었습니다. 로그인해 주세요.");
      setTimeout(() => {
        onGoLogin?.();
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.detail || "회원가입에 실패했습니다.");
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

      <div className="relative z-10 min-h-screen flex flex-col font-['Pretendard']">
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

            <h1 className={`text-[22px] font-thin tracking-wide ${textColor}`}>PitchWizard</h1>

            <div className="w-8" />
          </div>
        </header>

        <main className="flex-1 pt-32 pb-16 px-6 md:px-10">
          <div className="w-full max-w-[1100px] mx-auto grid gap-10 lg:grid-cols-1 items-center">
            <section className="pt-10 lg:pt-20" />

            <section
              className={`w-full max-w-[580px] mx-auto rounded-[32px] border ${border} ${cardBg} p-8 md:p-10 backdrop-blur-xl shadow-2xl shadow-black/15`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm uppercase tracking-[0.24em] ${subTextColor}`}>Create Account</p>
                  <h3 className={`mt-3 text-3xl font-semibold ${textColor}`}>회원가입</h3>
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
                  <span className={`mb-2 block text-sm font-medium ${subTextColor}`}>이메일</span>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border ${border} ${inputBg} px-4 py-4`}
                  >
                    <Mail className={`w-5 h-5 ${subTextColor}`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
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
                  <p className={`mt-2 text-xs ${subTextColor}`}>{passwordPolicyText}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {passwordChecks.map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        {item.valid ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-white/35" />
                        )}
                        <span className={item.valid ? "text-emerald-300" : subTextColor}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className={`mb-2 block text-sm font-medium ${subTextColor}`}>비밀번호 확인</span>
                  <div
                    className={`flex items-center gap-3 rounded-2xl border ${border} ${inputBg} px-4 py-4`}
                  >
                    <Lock className={`w-5 h-5 ${subTextColor}`} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="비밀번호를 다시 입력하세요"
                      className={`w-full bg-transparent outline-none text-[16px] ${textColor} ${placeholderColor}`}
                    />
                  </div>
                </label>

                {error ? <p className="text-sm text-red-400 text-center">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-300 text-center">{success}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00d9b1] to-[#00efc4] py-4 text-[17px] font-semibold text-white shadow-xl shadow-[#00d9b1]/20 transition-transform hover:scale-[1.01] active:scale-100 disabled:opacity-60"
                >
                  {loading ? "가입 중..." : "회원가입"}
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
                이미 계정이 있으신가요?{" "}
                <button type="button" onClick={onGoLogin} className="font-semibold text-[#00d9b1]">
                  로그인
                </button>
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
