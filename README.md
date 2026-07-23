# 오늘의 심부름 주문

초등학생을 위한 심부름 주문 앱. 메뉴는 누구나 볼 수 있고, 주문하려면 로그인이 필요하며, 손님은 자기 주문만 볼 수 있고 사장만 전체 주문을 조회·완료 처리·삭제할 수 있다.

## 기술 스택

- **Vite + React** (`.jsx`, TypeScript 아님)
- **React Router** — 클라이언트 라우팅
- **shadcn/ui + Tailwind CSS** — UI 컴포넌트
- **Supabase** — Auth(이메일/비밀번호) + Postgres + RLS
- 패키지 매니저: npm

## 라우트

| 경로 | 파일 | 설명 |
|---|---|---|
| `/` | `src/pages/OrderPage.jsx` | 공개 메뉴 목록 + 장바구니/주문서 (로그인 불필요) |
| `/auth` | `src/pages/AuthPage.jsx` | 로그인/회원가입 (shadcn `Tabs`) |
| `/my` | `src/pages/MyOrdersPage.jsx` | 로그인한 손님 본인의 주문만 조회 |
| `/admin` | `src/pages/AdminPage.jsx` | 사장 전용: 전체 주문 조회, 완료 처리, 삭제 |

메뉴 데이터(`src/data/menu.js`)는 DB가 아니라 코드 내 정적 배열이다. 메뉴를 바꾸려면 이 파일을 직접 수정해야 한다.

## 데이터 모델 (Supabase Postgres)

**`orders_ex`**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | bigint (PK) | 주문 ID |
| `user_id` | uuid (FK → auth.users) | 주문한 손님 |
| `pickup_time` | text | 픽업 희망 시간 |
| `items` | text | 주문 내역 |
| `total_price` | bigint | 합계 금액 |
| `status` | text | 주문 상태, 기본값 `'접수'`, 그 외 `'완료'` |
| `created_at` | timestamptz | 주문 시각, 기본값 `now()` |

**`profiles`**

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (FK → auth.users) | 사용자 ID |
| `role` | text | 기본값 `'손님'`, 그 외 `'사장'` |

회원가입 시 트리거로 `profiles` 행이 자동 생성되며 항상 `'손님'`으로 시작한다. **사장 지정은 Supabase 콘솔/SQL 에디터에서 `profiles.role`을 직접 수정하는 방법뿐이며, 회원가입 흐름이나 UI 어디에도 사용자를 `'사장'`으로 만들 수 있는 경로가 없다.**

## 권한 모델

사장/손님 권한 경계는 **Postgres RLS(Row Level Security)가 강제**하며, 프론트엔드 코드는 이 역할을 하지 않는다. `/admin` 접근을 막는 라우트 가드는 사용자 경험을 위한 것일 뿐, 실제 접근 제어로 취급하지 않는다.

- 사장 여부 확인은 각 정책에 쿼리를 직접 넣지 않고 `profiles`를 조회하는 `SECURITY DEFINER` 함수 `is_owner()`를 통해 이루어진다 (RLS 재귀 문제 회피).
- `orders_ex` RLS 정책:
  - `select_own_or_owner` (SELECT): `user_id = auth.uid() OR is_owner()`
  - `insert_own_pending_only` (INSERT): `user_id = auth.uid() AND status = '접수'` — 손님이 이미 `'완료'` 상태인 주문을 삽입할 수 없다.
  - `update_owner_only` (UPDATE): `is_owner()`
  - `delete_owner_only` (DELETE): `is_owner()`
- `profiles`는 `select_own_profile`(`id = auth.uid()`) 정책만 가지며, 일반 사용자가 `role`을 수정할 수 있는 UPDATE 정책은 존재하지 않는다.

### AuthContext의 role 조회 타이밍

`AuthContext`는 세션 로드와 별개로 `profiles.role`을 비동기로 조회한다. `loading`은 세션 로딩 중이거나, 세션은 있지만 아직 role 조회가 끝나지 않은 상태(`session?.user`가 있는데 `role === null`)일 때 모두 `true`가 되도록 파생 계산한다. 이 처리가 없으면 role 조회가 끝나기 전에 `RequireOwner`가 `isOwner === false`로 판단해 로그인 직후 `/admin`에서 곧바로 `/`로 리다이렉트되는 경쟁 조건이 발생한다.

## 관리자 화면 (`/admin`)

1. 세션의 사용자 이메일이 `admin@hotmail.com`이 아니면 `/auth`(미로그인) 또는 `/`(다른 계정)로 리다이렉트. 이는 UX 편의를 위한 프론트엔드 체크일 뿐, 실제 데이터 접근 통제는 RLS의 `is_owner()`가 담당한다.
2. `orders_ex` 전체를 `created_at desc`로 조회해 shadcn `Table`로 표시 (주문자, 픽업 시간, 품목, 금액, 상태 Badge, 시각).
3. **완료** 버튼: `status`를 `'완료'`로 update한 뒤, 재조회 없이 로컬 상태 배열에서 해당 행만 갱신.
4. **삭제** 버튼: shadcn `AlertDialog`로 확인 후 delete하고, 재조회 없이 로컬 상태 배열에서 해당 행만 제거.

## 범위 제외

결제, 비밀번호 찾기/변경, 프로필 수정, 소셜 로그인, 메뉴 관리 화면, 재고·품절 관리는 구현하지 않는다.

## 로컬 실행

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 채우기
npm run dev
```
