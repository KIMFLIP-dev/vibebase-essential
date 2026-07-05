import { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Vibebase",
  description: "Vibebase 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-36 pb-16 max-w-3xl">
        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4">
            <span className="w-8 h-px bg-primary"></span>
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            개인정보처리방침
          </h1>
          <p className="text-muted-foreground">
            최종 업데이트: 2025년 1월
          </p>
        </header>

        {/* Intro */}
        <div className="mb-12 p-6 bg-muted/30 rounded-xl border border-border/50">
          <p className="text-lg text-foreground/80 leading-relaxed">
            Vibebase(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요시하며,
            개인정보보호법 등 관련 법령을 준수합니다.
          </p>
        </div>

        <hr className="border-border/50 mb-12" />

        {/* Content */}
        <div className="space-y-16">
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">1</span>
              수집하는 개인정보
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
            </p>

            <div className="space-y-6">
              <div className="p-5 rounded-lg border border-border/50 bg-card">
                <h3 className="font-medium mb-3 text-foreground">필수 수집 항목</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    이메일 주소
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    이름 (소셜 로그인 시)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    프로필 이미지 (소셜 로그인 시)
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-lg border border-border/50 bg-card">
                <h3 className="font-medium mb-3 text-foreground">자동 수집 항목</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    IP 주소, 쿠키, 접속 로그
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    브라우저 종류 및 OS 정보
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    서비스 이용 기록
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">2</span>
              개인정보의 이용 목적
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "회원 가입 및 관리",
                "서비스 제공 및 개선",
                "결제 및 환불 처리",
                "고객 문의 응대",
                "서비스 관련 공지사항 전달",
                "마케팅 및 프로모션 정보 제공 (동의 시)",
                "서비스 이용 통계 분석",
                "부정 이용 방지",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="text-muted-foreground text-sm">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">3</span>
              개인정보의 제3자 제공
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만, 다음의 경우에는 예외로 합니다.
            </p>
            <ul className="space-y-3">
              {[
                "이용자가 사전에 동의한 경우",
                "법령에 의해 요구되는 경우",
                "서비스 제공에 필요한 결제 처리 업체 (포트원)",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-muted-foreground">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs mt-0.5">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">4</span>
              개인정보의 보관 기간
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를
              지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우
              해당 기간 동안 보관합니다.
            </p>
            <div className="overflow-hidden rounded-lg border border-border/50">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">보관 항목</th>
                    <th className="text-right p-4 font-medium">보관 기간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { item: "계약 또는 청약철회 등에 관한 기록", period: "5년" },
                    { item: "대금결제 및 재화 등의 공급에 관한 기록", period: "5년" },
                    { item: "소비자의 불만 또는 분쟁처리에 관한 기록", period: "3년" },
                    { item: "접속 로그", period: "3개월" },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="p-4 text-muted-foreground">{row.item}</td>
                      <td className="p-4 text-right font-medium text-foreground">{row.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">5</span>
              이용자의 권리
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                "개인정보 열람 요청",
                "개인정보 정정 요청",
                "개인정보 삭제 요청",
                "개인정보 처리 정지 요청",
                "회원 탈퇴",
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-lg border border-border/50 bg-card text-center">
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              위 권리 행사는 서비스 내 설정 또는 고객센터를 통해 가능합니다.
            </p>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">6</span>
              개인정보의 안전성 확보
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                "개인정보 암호화",
                "보안 시스템 구축",
                "접근 권한 관리",
                "정기 보안 점검",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">7</span>
              쿠키의 사용
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              회사는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다.
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
              이 경우 서비스 이용에 제한이 있을 수 있습니다.
            </p>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">8</span>
              개인정보 보호책임자
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자는 다음과 같습니다.
            </p>
            <div className="p-6 rounded-xl bg-linear-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">문의 이메일</p>
              <p className="text-lg font-medium text-foreground">privacy@vibebase.dev</p>
            </div>
          </section>

          <hr className="border-border/50" />

          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold">9</span>
              개인정보처리방침의 변경
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              본 개인정보처리방침은 법령 또는 서비스 정책의 변경에 따라 수정될 수 있습니다.
              변경 사항은 서비스 내 공지를 통해 안내드립니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
