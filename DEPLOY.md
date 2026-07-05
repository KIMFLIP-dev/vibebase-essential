# Vercel 배포 및 설정 가이드

## 1. Vercel 배포

### 초기 설정
```bash
# Vercel CLI 설치 (이미 설치됨)
npm i -g vercel

# 프로젝트 연결
vercel link --yes

# 프로덕션 배포
vercel --prod
```

### 환경 변수 설정
Vercel 대시보드 → Settings → Environment Variables에서 추가:

| 변수명 | 설명 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `CREEM_API_KEY` | Creem API 키 |
| `CREEM_WEBHOOK_SECRET` | Creem 웹훅 시크릿 (선택) |

### 배포 URL
- **Production**: https://vibebase-creem-app.vercel.app
- **Dashboard**: https://vercel.com/yc21cs-projects/vibebase-creem-app

### 자동 배포
GitHub `main` 브랜치에 푸시하면 자동 배포됩니다.

### 브랜치별 별도 배포 (데모 환경 등)
같은 repo에서 다른 브랜치를 별도 프로젝트로 배포하려면:

1. https://vercel.com/new → 같은 repo 선택
2. 프로젝트 이름을 다르게 설정 (예: `vibebase-demo-creem`)
3. 환경변수에 별도 Supabase 정보 입력
4. Deploy 완료 후:
   - **Settings → Environments → Production** 섹션
   - **Production Branch**를 원하는 브랜치로 변경 (예: `demo-creem`)
5. Redeploy

---

## 2. 커스텀 도메인 연결 (vibebase.net)

### Vercel에서 도메인 추가
1. https://vercel.com/yc21cs-projects/vibebase-creem-app/settings/domains
2. `vibebase.net` 입력 후 "Add"

### DNS 설정 (Spaceship)
**방법 A: Vercel Nameservers 사용 (권장)**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**방법 B: A/CNAME 레코드**
| 타입 | 호스트 | 값 |
|------|--------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

---

## 3. 이메일 설정 (Resend + Supabase)

### Resend 설정
1. https://resend.com 가입
2. API Key 발급
3. 도메인 추가: `vibebase.net`

### 도메인 인증 DNS 레코드 (Spaceship에 추가)
Resend가 제공하는 레코드:
- SPF (TXT)
- DKIM (TXT)
- 선택적으로 DMARC

### Supabase SMTP 설정
**Dashboard → Authentication → SMTP Settings**

| 설정 | 값 |
|------|-----|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | `re_xxxxx` (Resend API Key) |
| Sender email | `noreply@vibebase.net` |
| Sender name | `VIBEBASE` |

### 이메일 템플릿 한글화
**Dashboard → Authentication → Email Templates**

각 템플릿 수정:
- Confirm signup (회원가입 인증)
- Reset password (비밀번호 재설정)
- Magic link (매직 링크)
- Change email (이메일 변경)

---

## 4. 스팸 방지 설정

### DMARC 레코드 추가
| 타입 | 호스트 | 값 |
|------|--------|-----|
| TXT | _dmarc | `v=DMARC1; p=quarantine;` |

### Google Postmaster 등록
1. https://postmaster.google.com
2. `vibebase.net` 도메인 추가
3. TXT 레코드로 소유권 인증
4. 도메인 평판 모니터링

---

## 5. 체크리스트

### 배포
- [x] Vercel 프로젝트 연결
- [x] 환경 변수 설정
- [x] GitHub 자동 배포 활성화
- [x] 프로덕션 배포 완료

### 도메인
- [ ] vibebase.net DNS 설정
- [ ] SSL 인증서 자동 발급 확인

### 이메일
- [x] Resend 가입 및 API Key 발급
- [x] vibebase.net 도메인 인증 (Verified)
- [x] Supabase SMTP 설정
- [x] DMARC 레코드 추가
- [x] Google Postmaster 등록
- [ ] 이메일 템플릿 한글화

---

## 6. 문제 해결

### Git 작성자 권한 오류
```bash
# Git 이메일을 Vercel 계정과 동일하게 설정
git config --global user.email "your-vercel-email@example.com"

# 기존 커밋 작성자 수정
git commit --amend --reset-author --no-edit
git push --force origin main
```

### 이메일이 스팸함으로 가는 경우
- 새 도메인은 평판 쌓이는데 1-2주 소요
- DMARC 정책 적용
- Google Postmaster 등록
- 사용자가 "스팸 아님" 표시하면 학습됨

---

## 7. 유용한 링크

- Vercel Dashboard: https://vercel.com/yc21cs-projects/vibebase-creem-app
- Supabase Dashboard: https://supabase.com/dashboard
- Resend Dashboard: https://resend.com/emails
- Google Postmaster: https://postmaster.google.com
