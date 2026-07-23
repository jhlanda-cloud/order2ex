# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 현재 상태

이 저장소는 **아직 구현 전 단계**입니다. 현재 `PRD.md`와 이 파일만 존재하며, `package.json`도 소스 코드도 빌드 도구도 아직 스캐폴딩되지 않았습니다. 빌드할 대상이 없으므로 실행할 build/lint/test 명령어도 없습니다. 프로젝트가 스캐폴딩된 이후에는 이 파일에 실제 명령어(`npm run dev`, `npm run build`, `npm run lint`, 테스트 실행 명령 등)를 채워 넣어야 합니다.

코드를 작성하기 전에 `PRD.md`를 전체 읽으세요 — 범위, 화면 구성, 데이터 모델, 권한 설계에 대한 근거 자료입니다. 거기 명시된 것 이상의 기능을 구현하지 마세요.

## 계획된 아키텍처 (PRD.md 기준)

서비스: "오늘의 심부름 주문" — 초등학생을 위한 심부름 주문 앱. 메뉴는 누구나 볼 수 있고(로그인 불필요), 주문하려면 로그인이 필요하며, 손님은 자기 주문만 볼 수 있고, 사장만 전체 주문을 조회·수정(완료 처리)·삭제할 수 있습니다.

**계획된 스택**: Vite + React (`.jsx`, TypeScript 아님) + React Router + shadcn/ui + Tailwind CSS + Supabase (Auth + Postgres + RLS), 패키지 매니저는 npm.

**계획된 라우트**:
- `/` (`src/pages/OrderPage.jsx`) — 공개 메뉴 목록 + 장바구니/주문서
- `/auth` (`src/pages/AuthPage.jsx`) — shadcn `Tabs`를 이용한 로그인/회원가입
- `/my` (`src/pages/MyOrdersPage.jsx`) — 로그인한 손님 본인의 주문만
- `/admin` (`src/pages/AdminPage.jsx`) — 사장 전용: 전체 주문 조회, 완료 처리, 삭제

**메뉴 데이터는 DB가 아니라 정적 데이터**입니다: `src/data/menu.js`에 순수 배열(`id`, `name`, `price`, `description`)로 존재합니다. 메뉴 관리 화면은 없으며, 메뉴를 바꾸려면 이 파일을 직접 수정해야 합니다.

## 권한 모델 — 가장 실수하기 쉬운 부분

이 프로젝트의 핵심 아키텍처 원칙: **사장/손님 권한 경계는 Postgres RLS(Row Level Security)가 강제하며, 프론트엔드 코드는 절대 이 역할을 하지 않습니다.** `/admin` 접근을 막는 라우트 가드 등은 단순히 사용자 경험을 위한 것일 뿐, 실제 접근 제어로 취급해서는 안 됩니다.

계획된 테이블 (아직 생성되지 않음):
- `orders` — `id`, `user_id` (FK auth.users), `items_text`, `total_price`, `pickup_time`, `status` (기본값 `'접수'`, 그 외 값은 `'완료'`뿐), `created_at`.
- `profiles` — `id` (FK auth.users), `role` (기본값 `'손님'`, 또는 `'사장'`). 회원가입 시 트리거로 자동 생성되며 항상 `'손님'`으로 시작.

PRD에서 도출된, 구현 시 반드시 지켜야 할 비자명한 제약 사항:
- 사장 지정은 **오직** Supabase 콘솔/SQL 에디터에서 `profiles.role`을 직접 수정하는 방법뿐입니다 — 회원가입 흐름이나 UI 어디에도 사용자를 `'사장'`으로 만들 수 있는 경로가 없습니다. 무관해 보이는 프로필 필드라 해도 일반 사용자용 `profiles` UPDATE 정책을 추가하지 마세요 — `role`에 클라이언트가 쓸 수 있는 경로가 하나라도 생기면 전체 권한 모델이 무너집니다(자기 자신을 사장으로 승격).
- RLS에서 사장 여부를 확인할 때는 각 정책에 쿼리를 직접 넣지 말고 `profiles`를 조회하는 `SECURITY DEFINER` 함수(`is_owner()`)를 통해야 합니다 — 그래야 `profiles` 테이블 자체에서 발생할 수 있는 RLS 재귀 문제를 피할 수 있습니다.
- `orders`의 INSERT는 `user_id = auth.uid() AND status = '접수'`로 제한되어야 합니다 — 손님이 이미 `'완료'` 상태인 주문을 삽입할 수 있으면 안 됩니다.
- 전체 RLS 정책(select/insert/update/delete) 초안은 `PRD.md` §5에 있습니다 — 처음부터 다시 설계하지 말고 그 초안을 기준으로 구현하세요.

## 범위 제외 (구현하지 말 것)

`PRD.md` §7 기준: 결제, 비밀번호 찾기/변경, 프로필 수정, 소셜 로그인, 메뉴 관리 화면, 재고·품절 관리. 요청 내용이 이 중 하나를 필요로 하는 것처럼 보이면, 바로 구현하지 말고 먼저 짚고 넘어가세요.
