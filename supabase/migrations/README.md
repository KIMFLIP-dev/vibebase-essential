# Supabase 마이그레이션

## 두 가지 설치 경로

1. **SQL Editor (간편)**: 프로젝트 루트의 `install.sql`을 Supabase SQL Editor에서 1회 실행.
2. **Supabase CLI (권장)**: 이 디렉토리의 마이그레이션을 순서대로 적용.

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## 컨벤션

- 파일명: `NNNN_설명.sql` (예: `0000_init.sql`) — 번호 순으로 적용된다.
- `install.sql`과 `0000_init.sql`은 항상 같은 내용을 유지한다.
  스키마를 바꿀 때는 **새 마이그레이션 파일을 추가**하고, `install.sql`에도 반영한다
  (신규 설치는 install.sql 하나로 끝나야 한다).
- 모든 정책은 `DROP POLICY IF EXISTS` 후 생성 — 재실행에 안전하게 작성한다.
