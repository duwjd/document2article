# Document2Article

PDF 또는 웹페이지 URL을 구조화된 마크다운 아티클로 변환하고, Velog · Notion · Brunch로 바로 발행할 수 있는 풀스택 웹 서비스입니다.

## 주요 기능

- 📄 **PDF → Markdown**: PDF 업로드 시 텍스트를 추출해 마크다운으로 변환
- 🔗 **URL → Markdown**: Readability + Turndown으로 본문만 깔끔하게 추출
- ✍️ **인라인 에디터**: `@uiw/react-md-editor` 기반 라이브 미리보기, 자동 저장
- 🕒 **히스토리**: 변경 시마다 스냅샷 저장, 한 클릭으로 과거 버전 복원
- 🗂️ **대시보드**: 상태(초안/발행)별 필터, 검색, 메타 정보 확인
- 🔐 **계정**: 이메일/비밀번호 회원가입·로그인 (bcrypt + JWT httpOnly 쿠키)
- 🔌 **통합**: Velog, Notion, Brunch 연결 관리 및 바로 발행
- 💙 **블루 톤 UI**: Tailwind 기반 사용자 친화적 디자인

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 14 (App Router) + TypeScript |
| 스타일 | Tailwind CSS (brand 블루 스케일) |
| DB/ORM | SQLite + Prisma |
| 인증 | 자체 JWT (httpOnly 쿠키) + bcrypt |
| PDF 파싱 | `pdf-parse` |
| URL 본문 추출 | `@mozilla/readability` + `jsdom` + `turndown` |
| 에디터 | `@uiw/react-md-editor` + `react-markdown` |
| 외부 연동 | `@notionhq/client`, Velog GraphQL |

## 폴더 구조

```
src/
  app/
    (auth)/login, (auth)/signup    # 공개 인증 페이지
    (app)/dashboard                # 사용자 대시보드
    (app)/new                      # PDF/URL 입력
    (app)/articles/[id]            # 마크다운 에디터
    (app)/articles/[id]/history    # 버전 히스토리
    (app)/settings                 # 외부 연동 설정
    api/auth/*                     # 로그인/회원가입/로그아웃
    api/convert/{url,pdf}          # 문서 → 마크다운 변환
    api/articles/*                 # CRUD + 히스토리 복원
    api/integrations               # 플랫폼 연결 저장
    api/export/[provider]          # Velog/Notion/Brunch 내보내기
  components/                      # 클라이언트 UI
  lib/auth.ts                      # JWT 쿠키, requireUser
  lib/convert.ts                   # PDF/URL → Markdown 파이프라인
  lib/exporters.ts                 # Velog/Notion/Brunch 내보내기
prisma/schema.prisma               # DB 스키마
```

## 실행 방법

```bash
npm install                 # 의존성 설치
cp .env.example .env        # DATABASE_URL, JWT_SECRET 확인
npx prisma db push          # SQLite 스키마 반영
npm run dev                 # http://localhost:3000
```

## 구현 계획 (단계별)

1. **프로젝트 스캐폴딩** — Next.js 14, Tailwind, Prisma 설정
2. **DB 모델링** — User, Article, ArticleHistory, Integration, ExportLog
3. **인증** — signup / login / logout / me 라우트, httpOnly 쿠키
4. **문서 변환** — PDF, URL 파서와 클라이언트 업로더
5. **에디터 & 히스토리** — MD 에디터, 자동 저장, 스냅샷, 복원
6. **대시보드** — 상태별 통계, 필터·검색
7. **통합 설정** — Velog / Notion / Brunch 연동 저장
8. **내보내기** — Notion API, Velog GraphQL, Brunch 클립보드 내보내기
9. **UI 마감** — 블루 톤 디자인, 반응형 조정

## 외부 연동 참고

- **Velog**: `https://v2.velog.io/graphql` 의 `writePost` 뮤테이션 사용. 사용자 토큰과 사용자명을 설정에 등록.
- **Notion**: Internal Integration 토큰과 부모 페이지 ID 필요. 해당 페이지에 Integration을 공유해야 합니다.
- **Brunch**: 공개 API가 없어, 마크다운을 클립보드로 복사한 뒤 Brunch 작가 페이지에 붙여넣어 수동 발행합니다.
