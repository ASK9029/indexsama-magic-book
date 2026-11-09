# 个人生活管理 APP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一个只在本机 Windows 电脑运行的个人生活管理 APP，覆盖首页、今日计划、学习、健身、饮食、游戏、数据与设置；数据保存在本机 `data` 文件夹，可完整备份与恢复。

**Architecture:** 本机 Node/Fastify 服务提供 REST API 并托管 React SPA；SQLite（`better-sqlite3`）保存结构化数据，资料文件/打卡照片/游戏封面保存在 `data/files`；客户端用 React + Vite + TanStack Query。服务只监听 `127.0.0.1`，不发起外部网络请求。

**Tech Stack:** Node 22 LTS、TypeScript 5.7（ESM）、Fastify 5、better-sqlite3 11、Zod 3、React 19、Vite 6、React Router 7、TanStack Query 5、Tailwind CSS 3.4、Recharts 2、Lucide React、date-fns 4、React Hook Form 7、Vitest 3、Testing Library、Playwright 1.50。

**Spec:** `PRD.md`

## Global Constraints

- 运行环境：Windows 10/11，Chrome/Edge 最新版；桌面优先，最低 1280×720；不做手机端。
- 本机服务只监听 `127.0.0.1`；运行时不加载 CDN 字体/图标/图片，不发起外部网络请求。
- 所有业务数据、设置、学习计时状态、训练草稿写入 `<项目根>/data`；禁止用 localStorage/IndexedDB 保存业务数据。
- 数据库用 SQLite；日期存 `YYYY-MM-DD` 本地日期；时间戳存 ISO 字符串；ID 用 UUID 字符串。
- 中文界面；浅色默认，支持深色/跟随系统。
- 学习资料单文件 ≤ 100MB；打卡原图 ≤ 20MB，上传压缩到长边 2000px；游戏封面压缩后存储。
- 备份提醒 30 天；备份包含数据库、资料文件、打卡照片、游戏封面。
- 健身训练量只算有重量动作；训练次数算全部完成的训练。
- 蛋白质参考值 = 最近体重 × 1.6g/kg；目标可为空。
- 应用版本 1.0.0。
- 不做登录、云同步、部署、多用户、手机端。

## Review Focus

1. **浏览器缓存清空后数据不能丢**：如果业务数据被写进 localStorage/IndexedDB，清理站点数据就丢了。测试放在 Task 3（DB）、Task 7（备忘）、Task 8（事项）、Task 24（备份）、Task 27（E2E）。
2. **计划与实际不能混算**：计划了但没吃的餐、没做的训练、没学的安排，不能进入实际统计。测试放在 Task 19（餐计划/实际）、Task 21（饮食统计）、Task 25（首页/今日计划聚合）。
3. **健身完成状态不能由勾选框决定**：没有训练记录就不能算完成；完成状态必须来自训练会话。测试放在 Task 15（会话）和 Task 25（今日计划/首页）。
4. **备份/恢复不能漏文件、打卡照片、封面**：只备份数据库会丢文件。测试放在 Task 24（备份/恢复）和 Task 27（E2E）。
5. **未来日期不能写实际数据**：未来日期只能排计划，不能记实际饮食/饮水/体重/打卡。测试放在 Task 12（打卡）、Task 20（饮食日期）、Task 27（E2E）。

## Phase Overview

| 阶段 | 任务 | 可运行结果 |
|---|---|---|
| 0 基础 | 1–9 | 启动、导航、设置骨架、备忘、手动事项、首页/今日计划手动版 |
| 1 学习 | 10–13 | 科目、计时、学习记录、打卡相册、资料库 |
| 2 健身 | 14–17 | 周计划、训练记录、升级/当前重量、统计 |
| 3 饮食 | 18–21 | 食物库、三餐计划/实际、饮水、体重、统计 |
| 4 游戏与数据 | 22–24 | 游戏库、偏好、备份/恢复/清空 |
| 5 集成发布 | 25–27 | 全量首页/今日计划、打包启动器、E2E 验收 |

每个阶段结束都应能启动、使用已完成模块、通过该阶段测试。

## Prerequisites

- Node.js 22 LTS 或更高，npm 10+，Git。
- 项目根目录：`E:\DSH-APP`，已有 `PRD.md`。
- **环境注意**：当前 DSH 沙箱在 `E:\DSH-APP` 上会报 `SetNamedSecurityInfoW failed (Win32 5): grantWrite`，导致 `pwsh` 命令无法执行。写文件工具可用。开始实现前必须在普通 PowerShell/终端中能写入该目录；如果仍失败，把项目放到普通 NTFS 目录（例如 `C:\Users\<你>\Documents\my-life-app`），复制 `PRD.md` 过去，后续路径按新根目录调整。
- 首次 `npm install` 需要网络；APP 运行时不联网。
- Chrome 或 Edge 用于开发和验收。
- 端口约定：开发服务 `43110`，Vite `5173`，E2E 使用 `43111`。

## File Structure

```text
E:\DSH-APP\
  PRD.md
  package.json
  tsconfig.json
  tsconfig.server.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  vitest.config.ts
  playwright.config.ts
  eslint.config.js
  .prettierrc
  .gitignore
  src/
    shared/
      types.ts            所有实体、API 请求/响应类型
      schemas.ts          Zod 请求校验
      dates.ts            本地日期工具
      format.ts           分钟/重量/热量格式化
      constants.ts        颜色、餐次、分类、默认值
    server/
      index.ts            生产入口：打开 DB、监听 127.0.0.1、写 server-url.txt
      app.ts              buildApp(options) 组装 Fastify
      config.ts           DATA_DIR、端口、版本
      lib/
        errors.ts         统一 ApiError
        ids.ts            UUID
        http.ts           错误响应助手
      db/
        connection.ts     DbManager（open/close/reopen）
        migrate.ts        迁移执行器
        migrations/
          001_init.sql
          002_memos.sql
          003_tasks.sql
          004_study.sql
          005_fitness.sql
          006_diet.sql
          007_games.sql
        seed/
          exercises.ts    内置动作
          foods.ts        内置常见食物
      repositories/      每个实体的 SQL 读写
      services/
        files.ts          文件保存/读取/删除
        backup.ts         zip 导出/恢复/清空
        stats.ts          统计聚合
        day.ts            今日计划聚合
        home.ts           首页聚合
      routes/             每个模块的 REST 路由
    client/
      main.tsx
      App.tsx
      router.tsx
      styles/globals.css
      api/
        client.ts         fetch 封装、ApiError、api:offline 事件
        queryKeys.ts
      components/
        layout/           AppShell/Sidebar/TopBar/ServiceBanner/StatusPill
        ui/               Button/Card/Input/Select/Textarea/Checkbox/Tabs/
                          Modal/Drawer/Toast/ConfirmDialog/EmptyState/
                          PageHeader/DateNav/ProgressBar/ErrorBoundary
        charts/           LineChart/BarChart/ChartCard
      features/
        home/ today/ study/ fitness/ diet/ games/ settings/
      hooks/              useToast/useConfirm/useSettings/useQuickAdd/useStudyTimer
      lib/                cn.ts、clientDates.ts、format.ts、compressImage.ts
  tests/
    shared/
    server/
    client/
    e2e/
  scripts/
    dev.mjs
    package-app.mjs
    launcher.vbs
  data/                 运行时生成，gitignore
```

## Shared Interfaces

### 实体类型（`src/shared/types.ts`）

任务实现时必须使用这些名称和字段；后续任务不得改名。

```ts
export type LocalDate = string; // YYYY-MM-DD
export type Theme = 'light' | 'dark' | 'system';
export type WeightUnit = 'kg' | 'jin';
export type TaskCategory = 'work' | 'life' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealKind = 'plan' | 'actual';
export type StudyMaterialType = 'link' | 'note' | 'file';
export type StudyStatus = 'not_started' | 'learning' | 'completed';
export type ExerciseType = 'weight' | 'bodyweight';
export type GameStatus = 'wishlist' | 'playing' | 'completed' | 'paused';
export type StatsView = 'week' | 'month' | 'year';

export interface Memo { id: string; text: string; pinned: boolean; createdAt: string; updatedAt: string; }
export interface Task { id: string; date: LocalDate; title: string; category: TaskCategory; priority: TaskPriority; time: string | null; note: string; done: boolean; createdAt: string; updatedAt: string; }
export interface Subject { id: string; name: string; color: string; goal: string; weeklyTargetMinutes: number; archived: boolean; createdAt: string; }
export interface StudyArrangement { id: string; subjectId: string; date: LocalDate; content: string; plannedMinutes: number; done: boolean; createdAt: string; }
export interface StudySession { id: string; subjectId: string; materialId: string | null; arrangementId: string | null; date: LocalDate; startAt: string; endAt: string; durationMinutes: number; note: string; }
export interface StudyTimer { status: 'idle' | 'running' | 'paused'; subjectId: string | null; materialId: string | null; arrangementId: string | null; startedAt: string | null; accumulatedSeconds: number; }
export interface FileRecord { id: string; originalName: string; mime: string; size: number; kind: 'material' | 'checkin' | 'cover'; createdAt: string; }
export interface Material { id: string; type: StudyMaterialType; title: string; subjectId: string | null; url: string | null; fileId: string | null; status: StudyStatus; progress: number; tags: string[]; excerpt: string; body: string; createdAt: string; updatedAt: string; }
export interface CheckinPhoto { id: string; subjectId: string; date: LocalDate; fileId: string; sortOrder: number; createdAt: string; }
export interface Exercise { id: string; name: string; muscleGroup: string; equipment: string; type: ExerciseType; notes: string; builtIn: boolean; }
export interface PlanExercise { exerciseId: string; targetSets: number; targetReps: string; sortOrder: number; }
export interface PlanDay { weekday: number; name: string; isRest: boolean; exercises: PlanExercise[]; }
export interface WorkoutSet { id: string; sessionId: string; exerciseId: string | null; exerciseName: string; setNo: number; weightKg: number | null; reps: number; done: boolean; }
export interface WorkoutSession { id: string; date: LocalDate; name: string; status: 'draft' | 'completed'; startAt: string; endAt: string | null; durationMinutes: number | null; note: string; sets: WorkoutSet[]; }
export interface ExerciseUpgrade { id: string; exerciseId: string | null; exerciseName: string; date: LocalDate; fromWeightKg: number; toWeightKg: number; note: string; createdAt: string; }
export interface WeightLog { id: string; date: LocalDate; weightKg: number; createdAt: string; }
export interface Food { id: string; name: string; category: string; unit: 'g' | 'ml'; per100Calories: number; per100Protein: number; servingName: string | null; servingAmount: number | null; builtIn: boolean; }
export interface MealEntry { id: string; date: LocalDate; meal: Meal; kind: MealKind; foodId: string | null; foodName: string; amount: number; unit: 'g' | 'ml'; servingLabel: string | null; per100Calories: number; per100Protein: number; calories: number; protein: number; createdAt: string; }
export interface MealState { date: LocalDate; meal: Meal; done: boolean; }
export interface WaterLog { id: string; date: LocalDate; amountMl: number; createdAt: string; }
export interface Game { id: string; title: string; platform: string; status: GameStatus; rating: number | null; playtimeMinutes: number; startDate: LocalDate | null; finishDate: LocalDate | null; coverFileId: string | null; notes: string; createdAt: string; updatedAt: string; }
export interface Settings { theme: Theme; weekStart: 0 | 1; weightUnit: WeightUnit; calorieTarget: number | null; proteinTarget: number | null; waterTarget: number | null; lastBackupAt: string | null; }
export interface SeriesPoint { label: string; date: string; value: number | null; }
```

### API 约定

- 所有接口前缀 `/api`。
- 成功：`200`/`201` + JSON 实体或 `{ ok: true }`。
- 失败：非 2xx + `{ error: { code: string; message: string; details?: unknown } }`。
- 日期查询参数：`date=YYYY-MM-DD`；统计：`view=week|month|year&anchor=YYYY-MM-DD`。
- 上传：`multipart/form-data`；返回 `FileRecord` 或带 `fileId` 的实体。
- 客户端错误统一抛 `ApiError`；网络失败派发 `window` 事件 `api:offline`，成功派发 `api:online`。
- 服务端用 Zod 校验 body/query；校验失败返回 `VALIDATION_ERROR`。

### 数据库约定

- `better-sqlite3`；`PRAGMA journal_mode = WAL`、`foreign_keys = ON`、`busy_timeout = 5000`。
- 迁移按文件名排序执行，记录到 `schema_migrations(version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`。
- 布尔用 `INTEGER 0/1`；标签用 JSON 字符串；金额/重量/热量用 `REAL`；时长用分钟整数；饮水用毫升整数。
- 事务：多表写入用 `db.transaction()`。
- 删除带文件的资料/打卡/封面时，先删 DB 记录再删文件；文件删除失败不回滚 DB，记录错误日志并提示。

### 服务与测试接口

```ts
// src/server/app.ts
export interface BuildAppOptions { dataDir: string; dbPath?: string; logger?: boolean; }
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance>;

// src/server/db/connection.ts
export interface DbManager { get(): Database.Database; close(): void; reopen(): void; path: string; }
export function createDbManager(dbPath: string): DbManager;

// src/server/config.ts
export const APP_VERSION = '1.0.0';
export function resolveDataDir(): string;

// src/client/api/client.ts
export async function apiGet<T>(path: string): Promise<T>;
export async function apiPost<T>(path: string, body?: unknown): Promise<T>;
export async function apiPatch<T>(path: string, body?: unknown): Promise<T>;
export async function apiDelete<T>(path: string): Promise<T>;
export async function apiUpload<T>(path: string, form: FormData): Promise<T>;
```

### UI 组件契约

`src/client/components/ui` 必须提供：`Button`、`Card`、`Input`、`Select`、`Textarea`、`Checkbox`、`Tabs`、`Modal`、`Drawer`、`ToastProvider/useToast`、`ConfirmProvider/useConfirm`、`EmptyState`、`PageHeader`、`DateNav`、`ProgressBar`、`ErrorBoundary`。每个组件接受 `className`，颜色/圆角/间距从 `globals.css` 的 CSS 变量读取。所有页面使用这些组件，不各写一套。

---

## Tasks

### Task 1: 项目脚手架、日期与格式化工具、测试流水线

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore`
- Create: `src/shared/dates.ts`, `src/shared/format.ts`, `src/shared/constants.ts`
- Test: `tests/shared/dates.test.ts`, `tests/shared/format.test.ts`, `tests/setup.ts`

**Interfaces:**
- Produces: `toLocalDate(d: Date): LocalDate`、`parseLocalDate(s: LocalDate): Date`、`addDays(s: LocalDate, n: number): LocalDate`、`startOfWeek(s: LocalDate, weekStartsOn: 0 | 1): LocalDate`、`formatMinutes(n: number): string`、`formatWeight(kg: number, unit: WeightUnit): string`、`formatCalories(n: number): string`。

- [ ] **Step 1: 初始化项目与依赖**

Run:
```powershell
git init
npm init -y
npm i fastify @fastify/static @fastify/multipart zod better-sqlite3 archiver yauzl mime-types
npm i react react-dom react-router-dom @tanstack/react-query recharts lucide-react date-fns react-hook-form @hookform/resolvers clsx tailwind-merge
npm i -D typescript tsx tsup vite @vitejs/plugin-react tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @playwright/test eslint @eslint/js typescript-eslint prettier concurrently @types/node @types/react @types/react-dom @types/better-sqlite3 @types/archiver @types/yauzl @types/mime-types
npx playwright install chromium
```
Expected: 安装成功，`package-lock.json` 生成。

- [ ] **Step 2: 写失败测试**

```ts
// tests/shared/dates.test.ts
import { describe, it, expect } from 'vitest';
import { toLocalDate, parseLocalDate, addDays, startOfWeek } from '../../src/shared/dates';

describe('local dates', () => {
  it('formats a local Date without UTC shift', () => {
    expect(toLocalDate(new Date(2026, 10, 9))).toBe('2026-11-09');
  });
  it('parses to local midnight', () => {
    const d = parseLocalDate('2026-11-09');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 9]);
  });
  it('adds days across month boundary', () => {
    expect(addDays('2026-11-09', 1)).toBe('2026-11-10');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });
  it('finds Monday start', () => {
    expect(startOfWeek('2026-11-09', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-11', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-11', 0)).toBe('2026-11-08');
  });
});
```

```ts
// tests/shared/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatMinutes, formatWeight, formatCalories } from '../../src/shared/format';

describe('format', () => {
  it('formats minutes', () => {
    expect(formatMinutes(45)).toBe('45 分钟');
    expect(formatMinutes(90)).toBe('1 小时 30 分钟');
  });
  it('formats weight by unit', () => {
    expect(formatWeight(70.2, 'kg')).toBe('70.2 kg');
    expect(formatWeight(70.2, 'jin')).toBe('140.4 斤');
  });
  it('formats calories as integer', () => {
    expect(formatCalories(1250.4)).toBe('1,250 kcal');
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- tests/shared`
Expected: FAIL，模块不存在。

- [ ] **Step 4: 实现日期/格式化工具与配置**

`src/shared/dates.ts` 用本地 `new Date(y, m-1, d)` 构造，禁止 `new Date('YYYY-MM-DD')`（会按 UTC 解析）。`formatMinutes`：`<60` 显示“n 分钟”，否则“h 小时 m 分钟”；`m=0` 省略。`formatWeight`：斤 = kg × 2，保留 1 位小数。`formatCalories`：`Intl.NumberFormat('zh-CN')` 取整。配置 `tsconfig` 严格模式、`"type": "module"`、路径别名 `@shared/*`、`@client/*`；Vite 配 React、Tailwind、`/api` 代理到 `http://127.0.0.1:43110`；Vitest 用 jsdom、setup 文件 `tests/setup.ts`（引入 `@testing-library/jest-dom/vitest`）；Playwright 暂只建配置。`package.json` scripts：`dev`（concurrently dev:server+dev:client）、`dev:server`（tsx watch）、`dev:client`（vite）、`build`（vite build + tsup server + 复制 `src/server/db/migrations` 到 `dist/server/migrations`）、`start`（node dist/server/index.mjs）、`test`（vitest run）、`test:e2e`（playwright test）、`lint`、`format`、`package`（node scripts/package-app.mjs）。`.gitignore` 忽略 `node_modules/`、`dist/`、`data/`、`release/`、`.e2e-data/`、`*.log`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/shared`
Expected: PASS，7 个测试通过。

- [ ] **Step 6: 提交**

```powershell
git add PRD.md docs/superpowers/plans/2026-11-09-personal-life-app.md package.json package-lock.json tsconfig.json tsconfig.server.json vite.config.ts tailwind.config.ts postcss.config.js vitest.config.ts playwright.config.ts eslint.config.js .prettierrc .gitignore src/shared tests/shared tests/setup.ts
git commit -m "chore: scaffold app and add shared date/format helpers"
```

---

### Task 2: 本机服务骨架、健康检查、静态托管、退出

**Files:**
- Create: `src/server/index.ts`, `src/server/app.ts`, `src/server/config.ts`, `src/server/lib/errors.ts`, `src/server/lib/http.ts`, `src/server/routes/health.ts`, `src/server/routes/system.ts`
- Test: `tests/server/health.test.ts`

**Interfaces:**
- Produces: `buildApp({ dataDir, dbPath?, logger? }): Promise<FastifyInstance>`；`GET /api/health -> { ok: true, version: '1.0.0' }`；`GET /api/unknown -> 404` 统一错误；`POST /api/system/shutdown -> { ok: true }`（响应后关闭）。
- Consumes: Task 1 配置。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/health.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../../src/server/app';

let app: Awaited<ReturnType<typeof buildApp>>;
let dir: string;

afterAll(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });

describe('server health', () => {
  it('returns version and ok', async () => {
    dir = await mkdtemp(join(tmpdir(), 'life-app-'));
    app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, version: '1.0.0' });
  });
  it('returns JSON 404 for unknown api route', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('NOT_FOUND');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/health.test.ts`
Expected: FAIL，`buildApp` 不存在。

- [ ] **Step 3: 实现服务骨架**

`config.ts`：`APP_VERSION='1.0.0'`；`resolveDataDir()` 读 `process.env.DATA_DIR`，否则 `<cwd>/data`。`app.ts`：创建 Fastify（`logger` 可关）、`ensureDataDir`、注册健康路由、system 路由、统一错误处理（`ApiError` + Zod 错误 -> 400 `VALIDATION_ERROR`）。`index.ts`：`buildApp` 后监听 `127.0.0.1`，端口 `process.env.PORT ?? 43110`，控制台打印 URL；监听 SIGINT/SIGTERM 关闭。静态托管：生产 `dist/client` 存在时注册 `@fastify/static`，非 `/api` GET 回退 `index.html`；开发不存在时跳过。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/health.test.ts`
Expected: PASS。

- [ ] **Step 5: 手工验证启动**

Run: `npm run dev:server`（先在 `package.json` 增加 `dev:server: tsx watch src/server/index.ts`）
Expected: 浏览器/`curl http://127.0.0.1:43110/api/health` 返回 `{ ok: true, version: '1.0.0' }`。

- [ ] **Step 6: 提交**

```powershell
git add src/server tests/server/health.test.ts package.json
git commit -m "feat: add local Fastify server with health and shutdown"
```

---

### Task 3: 数据库基础、迁移器、设置仓储

**Files:**
- Create: `src/server/db/connection.ts`, `src/server/db/migrate.ts`, `src/server/db/migrations/001_init.sql`, `src/server/repositories/settings.ts`
- Modify: `src/server/app.ts`（装饰 `dbManager`）
- Test: `tests/server/db.test.ts`

**Interfaces:**
- Produces: `createDbManager(dbPath): DbManager`；`migrate(db): void`；`getSetting<T>(db, key, fallback): T`、`setSetting(db, key, value): void`、`getAllSettings(db): Record<string,string>`。
- `DbManager` 提供 `get()`、`close()`、`reopen()`、`path`；`app.decorate('dbManager', manager)`。
- 迁移 001：`settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)`；种子 `theme=light`、`weekStart=1`、`weightUnit=kg`、`calorieTarget=''`、`proteinTarget=''`、`waterTarget=''`、`lastBackupAt=''`、`appVersion=1.0.0`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/db.test.ts
import { describe, it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDbManager } from '../../src/server/db/connection';
import { migrate } from '../../src/server/db/migrate';
import { getSetting, setSetting } from '../../src/server/repositories/settings';

describe('database', () => {
  it('migrates idempotently and persists settings', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'life-db-'));
    const mgr = createDbManager(join(dir, 'app.db'));
    migrate(mgr.get());
    migrate(mgr.get());
    expect(getSetting(mgr.get(), 'theme', 'light')).toBe('light');
    setSetting(mgr.get(), 'theme', 'dark');
    expect(getSetting(mgr.get(), 'theme', 'light')).toBe('dark');
    expect(mgr.get().pragma('journal_mode')).toBe('wal');
    expect(mgr.get().pragma('foreign_keys')).toBe(1);
    mgr.close();
    await rm(dir, { recursive: true, force: true });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/db.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现迁移器与设置仓储**

`connection.ts`：创建父目录；`new Database(path)`；设置 WAL、foreign_keys、busy_timeout；`DbManager` 的 `close`/`reopen`；`reopen` 复用同一路径。`migrate.ts`：创建 `schema_migrations`；从 `path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'migrations')` 读取 `*.sql` 排序；未应用的按事务执行并记录；构建/打包把 SQL 复制到 `dist/server/migrations`，随 `dist/server` 进入 `app/server/migrations`。`001_init.sql` 建 `settings` 和种子（`INSERT OR IGNORE`）。`settings.ts` 读写字符串；`getSetting` 支持泛型解析（JSON 值用 `JSON.stringify` 存）。`app.ts` 创建 manager、迁移、装饰；`app.addHook('onClose', ...)` 关闭。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/db.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/server/db src/server/repositories/settings.ts src/server/app.ts tests/server/db.test.ts
git commit -m "feat: add SQLite migrations and settings repository"
```

---

### Task 4: 共享领域类型、Zod 校验、客户端 API 封装

**Files:**
- Create: `src/shared/types.ts`, `src/shared/schemas.ts`, `src/client/api/client.ts`, `src/client/api/queryKeys.ts`
- Test: `tests/shared/schemas.test.ts`, `tests/client/apiClient.test.ts`

**Interfaces:**
- Produces: `src/shared/types.ts` 中 `Shared Interfaces` 的全部实体类型；`memoCreateSchema`、`taskCreateSchema`、`settingsPatchSchema`、`apiErrorSchema`；`apiGet/apiPost/apiPatch/apiDelete/apiUpload`；`ApiError`。
- `taskCreateSchema`：`title` 非空、`category` 枚举、`priority` 枚举、`date` 匹配 `YYYY-MM-DD`、`time` 可选 `HH:mm`。
- `apiGet` 在网络失败时派发 `api:offline`，成功派发 `api:online`；非 2xx 解析错误并抛 `ApiError`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/shared/schemas.test.ts
import { describe, it, expect } from 'vitest';
import { taskCreateSchema } from '../../src/shared/schemas';

describe('taskCreateSchema', () => {
  it('accepts a valid task', () => {
    expect(taskCreateSchema.safeParse({ date: '2026-11-09', title: '写周报', category: 'work', priority: 'high' }).success).toBe(true);
  });
  it('rejects empty title and bad date', () => {
    expect(taskCreateSchema.safeParse({ date: '2026-11-09', title: '', category: 'work', priority: 'high' }).success).toBe(false);
    expect(taskCreateSchema.safeParse({ date: '11/09/2026', title: 'x', category: 'work', priority: 'high' }).success).toBe(false);
  });
});
```

```ts
// tests/client/apiClient.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet, ApiError } from '../../src/client/api/client';

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('throws ApiError on 4xx with server message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: '没有' } }), { status: 404, headers: { 'Content-Type': 'application/json' } })));
    await expect(apiGet('/api/nope')).rejects.toMatchObject({ code: 'NOT_FOUND', message: '没有' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/shared/schemas.test.ts tests/client/apiClient.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现类型、校验、API 封装**

把 `Shared Interfaces` 的类型块写入 `types.ts`。`schemas.ts` 用 Zod 定义请求体；`settingsPatchSchema` 允许 `theme`、`weekStart`、`weightUnit`、`calorieTarget`、`proteinTarget`、`waterTarget` 部分更新。`client.ts` 用 `fetch`、`credentials: 'same-origin'`；`Content-Type: application/json`；错误解析；`apiUpload` 不设 Content-Type。`queryKeys.ts` 定义 `['settings']`、`['memos']`、`['tasks', date]`、`['day', date]`、`['home']`、`['subjects']`、`['subject', id]`、`['materials', filters]`、`['fitness','plan']`、`['fitness','session',id]`、`['diet','day',date]`、`['games',filters]`、`['stats','fitness',view,anchor]`、`['stats','diet',view,anchor]`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/shared/schemas.test.ts tests/client/apiClient.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/shared/types.ts src/shared/schemas.ts src/client/api tests/shared/schemas.test.ts tests/client/apiClient.test.ts
git commit -m "feat: add shared types, zod schemas and typed api client"
```

---

### Task 5: 应用外壳、路由、基础 UI、主题

**Files:**
- Create: `src/client/main.tsx`, `src/client/App.tsx`, `src/client/router.tsx`, `src/client/styles/globals.css`
- Create: `src/client/components/layout/AppShell.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `ServiceBanner.tsx`
- Create: `src/client/components/ui/*`（见 Shared Interfaces）
- Create: `src/client/lib/cn.ts`, `src/client/lib/clientDates.ts`
- Test: `tests/client/shell.test.tsx`

**Interfaces:**
- Consumes: Task 4 API client、Task 1 日期工具。
- Produces: 路由 `/`、`/today`、`/study/subjects`、`/study/materials`、`/fitness/*`、`/diet/*`、`/games`、`/settings`；`AppShell` 左侧 8 入口、顶部栏、内容区、底部状态；`useToast()`、`useConfirm()`。
- 所有页面先用 `PagePlaceholder`，后续任务替换。

- [ ] **Step 1: 写失败测试**

```tsx
// tests/client/shell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '../../src/client/router';

describe('app shell', () => {
  it('shows 8 nav entries and switches route', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });
    render(<RouterProvider router={router} />);
    for (const label of ['首页','今日计划','学习科目','学习资料','健身计划','饮食计划','游戏娱乐','数据与设置']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('link', { name: '今日计划' }));
    expect(router.state.location.pathname).toBe('/today');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/client/shell.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现外壳与基础组件**

`globals.css` 写入 PRD 的 CSS 变量（浅/深），Tailwind base/components/utilities。`AppShell` 用 `<aside>` + `<header>` + `<main>`；Sidebar 分组“总览/学习/生活/系统”，8 个 `NavLink`，active 高亮；TopBar 标题/说明/日期/快速添加占位；底部“数据已保存在本机”状态点。`router.tsx` 用 `createBrowserRouter`（生产）和 `createMemoryRouter`（测试）导出 `routes`；每个页面占位。UI 组件用 `forwardRef`、`className` 合并、`data-testid` 可选；Modal/Drawer 用 portal；Toast/Confirm 用 context provider；ErrorBoundary 捕获渲染错误。ServiceBanner 监听 `api:offline`/`api:online`。主题：`ThemeProvider` 根据 `settings.theme`（暂用 light）设置 `document.documentElement.dataset.theme`；Task 6 接设置。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/client/shell.test.tsx`
Expected: PASS。

- [ ] **Step 5: 手工验证**

Run: `npm run dev`
Expected: `http://localhost:5173` 显示外壳，8 个入口可切换，窗口 1280×720 无横向滚动。

- [ ] **Step 6: 提交**

```powershell
git add src/client tests/client/shell.test.tsx
git commit -m "feat: add app shell, routing and base ui components"
```

---

### Task 6: 设置骨架、主题持久化、数据文件夹、退出 APP

**Files:**
- Create: `src/server/routes/settings.ts`, `src/server/routes/system.ts`
- Create: `src/client/features/settings/SettingsPage.tsx`, `SettingsTabs.tsx`, `AppearanceTab.tsx`, `DataTab.tsx`
- Create: `src/client/hooks/useSettings.ts`, `src/client/hooks/useTheme.ts`
- Modify: `src/server/app.ts`, `src/client/router.tsx`, `src/client/components/layout/AppShell.tsx`
- Test: `tests/server/settings.test.ts`, `tests/client/settings.test.tsx`

**Interfaces:**
- `GET /api/settings -> Settings`；`PATCH /api/settings` body `Partial<Settings>` -> `Settings`；`POST /api/system/open-data-folder -> { ok: true }`；`POST /api/system/shutdown -> { ok: true }`。
- `useSettings()` 返回 `{ settings, update, isLoading }`；`update` 用 mutation + `queryClient.setQueryData(['settings'])`。
- 主题选项：`light | dark | system`；保存到 `settings.theme`；`ThemeProvider` 应用。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/settings.test.ts
import { describe, it, expect, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../../src/server/app';

let app: Awaited<ReturnType<typeof buildApp>>;
let dir: string;

afterAll(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });

describe('settings api', () => {
  it('returns defaults and persists theme', async () => {
    dir = await mkdtemp(join(tmpdir(), 'life-settings-'));
    app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
    const initial = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(initial.json().theme).toBe('light');
    expect(initial.json().weekStart).toBe(1);
    const patched = await app.inject({ method: 'PATCH', url: '/api/settings', payload: { theme: 'dark' } });
    expect(patched.json().theme).toBe('dark');
    const again = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(again.json().theme).toBe('dark');
  });
});
```

```tsx
// tests/client/settings.test.tsx
// render SettingsPage with a mocked useSettings; click 深色 -> expect documentElement.dataset.theme === 'dark'
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/settings.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现设置 API 与页面**

`settings.ts`：读取全部设置并转换成 `Settings`（数字/布尔解析）；`PATCH` 逐项校验 `settingsPatchSchema`，写入 `settings` 表；返回最新。`system.ts`：`open-data-folder` 用 `child_process.exec('explorer.exe <dataDir>')`；`shutdown` 在响应后 `setTimeout(() => process.exit(0), 100)`。`SettingsPage` 四个标签（数据/外观/偏好/危险区），Task 6 只实现“数据”（数据文件夹、退出）和“外观”（主题）；偏好/危险区占位。`ThemeProvider` 读设置，`system` 用 `matchMedia`。`AppShell` 底部状态用 `useSettings` 显示上次备份。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/settings.test.ts tests/client/settings.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/server/routes/settings.ts src/server/routes/system.ts src/client/features/settings src/client/hooks src/server/app.ts src/client/router.tsx src/client/components/layout tests/server/settings.test.ts tests/client/settings.test.tsx
git commit -m "feat: add settings, theme persistence, data folder and app exit"
```

---

### Task 7: 快速备忘（首页卡片 + 全部抽屉）

**Files:**
- Create: `src/server/db/migrations/002_memos.sql`, `src/server/repositories/memos.ts`, `src/server/routes/memos.ts`
- Create: `src/client/features/home/QuickMemoCard.tsx`, `MemoDrawer.tsx`
- Modify: `src/server/app.ts`, `src/client/features/home/HomePage.tsx`（占位）
- Test: `tests/server/memos.test.ts`, `tests/client/memos.test.tsx`

**Interfaces:**
- `GET /api/memos -> Memo[]`（置顶优先，更新时间倒序）；`POST /api/memos { text } -> Memo`；`PATCH /api/memos/:id { text?, pinned? } -> Memo`；`DELETE /api/memos/:id -> { ok: true }`。
- 备忘文本 trim 后 1–500 字；`pinned` 布尔。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/memos.test.ts
// POST 两条 -> GET 返回最新在前；PATCH pinned=true -> 置顶在前；DELETE -> 不在列表。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/memos.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现迁移、仓储、路由、UI**

迁移：
```sql
CREATE TABLE memos (id TEXT PRIMARY KEY, text TEXT NOT NULL, pinned INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
```
仓储按 `pinned DESC, updated_at DESC` 排序；路由校验。`QuickMemoCard` 输入框回车 POST，列表最多 4 条，置顶/删除；删除调 `useToast` 的 5 秒撤销（先本地移除，超时 DELETE）。`MemoDrawer` 全部列表 + 输入。首页其他区域暂为空占位。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/memos.test.ts tests/client/memos.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/server/db/migrations/002_memos.sql src/server/repositories/memos.ts src/server/routes/memos.ts src/client/features/home tests/server/memos.test.ts tests/client/memos.test.tsx
git commit -m "feat: add quick memos with pin and undo delete"
```

---

### Task 8: 手动事项与今日计划页（日期、编辑、顺延）

**Files:**
- Create: `src/server/db/migrations/003_tasks.sql`, `src/server/repositories/tasks.ts`, `src/server/routes/tasks.ts`
- Create: `src/client/features/today/TodayPage.tsx`, `TaskGroup.tsx`, `TaskRow.tsx`, `TaskModal.tsx`, `DateHeader.tsx`
- Modify: `src/server/app.ts`, `src/client/router.tsx`
- Test: `tests/server/tasks.test.ts`, `tests/client/today.test.tsx`

**Interfaces:**
- `GET /api/tasks?date=YYYY-MM-DD -> Task[]`；`POST /api/tasks -> Task`；`PATCH /api/tasks/:id -> Task`；`DELETE /api/tasks/:id -> { ok: true }`；`POST /api/tasks/:id/carry-over { targetDate } -> Task`。
- 手动事项字段见 `Task`；时间可空；分类/优先级枚举；`done` 布尔。
- 今日计划 URL：`/today?date=YYYY-MM-DD`，默认今天；`DateHeader` 前后翻、今天按钮、小日历。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/tasks.test.ts
// 创建事项 -> 按日期查询只返回该日；PATCH done=true；carry-over 后 date 变为目标日；DELETE 后消失。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/tasks.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现迁移、仓储、路由**

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('work','life','other')),
  priority TEXT NOT NULL CHECK (priority IN ('high','medium','low')),
  time TEXT,
  note TEXT NOT NULL DEFAULT '',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX idx_tasks_date ON tasks(date);
```
排序：未完成优先，优先级高→低，时间空在后，创建时间。`carry-over` 只改 `date`，保留原记录（同一记录移动）。路由校验日期。

- [ ] **Step 4: 实现今日计划页与事项弹窗**

页面顶部 `DateHeader` + 进度“3 / 6 完成”；分组“我的事项 / 学习 / 健身 / 饮食”，Task 8 只渲染“我的事项”，其他组显示占位“尚未接入”；`TaskRow` 勾选/PATCH、点击编辑、`⋯` 菜单（编辑/顺延到明天/删除，删除 5 秒撤销）；`TaskModal` 表单（标题、分类、优先级、时间、备注）；空状态。URL 用 `useSearchParams` 保存日期。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/tasks.test.ts tests/client/today.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/db/migrations/003_tasks.sql src/server/repositories/tasks.ts src/server/routes/tasks.ts src/client/features/today tests/server/tasks.test.ts tests/client/today.test.tsx
git commit -m "feat: add manual tasks and today view with carry-over"
```

---

### Task 9: 首页今日计划卡、全局快速添加、摘要卡占位

**Files:**
- Create: `src/client/features/home/HomePage.tsx`, `TodayPlanCard.tsx`, `SummaryCards.tsx`, `StudySummaryCard.tsx`, `FitnessSummaryCard.tsx`, `DietSummaryCard.tsx`, `GameSummaryCard.tsx`
- Create: `src/client/hooks/useQuickAdd.tsx`, `src/client/features/home/QuickAddMenu.tsx`
- Modify: `src/client/components/layout/TopBar.tsx`, `src/client/router.tsx`
- Test: `tests/client/home.test.tsx`

**Interfaces:**
- `useQuickAdd()` 提供 `openQuickAdd(kind)`，kind 为 `'task' | 'study' | 'weight' | 'water' | 'memo'`；Task 9 实现 `task`、`memo`，其余项禁用并提示“模块接入后开放”。
- Home 读 `tasks?date=today` 与 `memos`；摘要卡显示空状态，后续任务替换。
- 今日计划卡最多 5 条未完成；排序“我的事项→学习→健身→饮食”；底部“已完成 n 件”和“＋ 加一件事”。

- [ ] **Step 1: 写失败测试**

```tsx
// tests/client/home.test.tsx
// 渲染 HomePage（mock API 返回 6 条未完成事项）-> 只显示 5 条 + “查看全部”；
// 点击“＋ 加一件事” -> 打开 TaskModal；点击备忘回车 -> POST 被调用。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/client/home.test.tsx`
Expected: FAIL。

- [ ] **Step 3: 实现首页布局与快速添加**

`HomePage`：顶部“今天”+“还有 n 件事没做”+进度；两列“今日计划卡 / 快速备忘卡”；下面 2×2 摘要卡（学习/健身/饮食/游戏），空状态文案按 PRD。`TodayPlanCard` 读任务，勾选调 PATCH，点行打开 TaskModal，“查看全部”导航 `/today`。`QuickAddMenu` 由 TopBar 的“＋ 快速添加”打开，弹层五项；`task`/`memo` 可用，其余禁用。`SummaryCards` 用 PRD 的空状态和“去…”按钮，暂不显示数字。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/client/home.test.tsx`
Expected: PASS。

- [ ] **Step 5: 手工验证持久化**

Run: `npm run dev`，加 6 条事项、1 条备忘 → 刷新 → 数据还在；关闭浏览器重开 → 数据还在。
Expected: 满足 Review Focus 第 1 条（阶段验证）。

- [ ] **Step 6: 提交**

```powershell
git add src/client/features/home src/client/hooks/useQuickAdd.tsx src/client/components/layout/TopBar.tsx src/client/router.tsx tests/client/home.test.tsx
git commit -m "feat: add home dashboard, today card and quick add menu"
```

---

### Task 10: 学习 schema、科目、今日学习安排

**Files:**
- Create: `src/server/db/migrations/004_study.sql`, `src/server/repositories/subjects.ts`, `src/server/repositories/studyArrangements.ts`, `src/server/routes/subjects.ts`, `src/server/routes/studyArrangements.ts`
- Create: `src/client/features/study/SubjectsPage.tsx`, `SubjectCard.tsx`, `SubjectDetailPage.tsx`, `SubjectModal.tsx`, `ArrangementModal.tsx`
- Modify: `src/server/app.ts`, `src/client/router.tsx`, `src/client/features/today/TodayPage.tsx`（学习组占位文案）
- Test: `tests/server/subjects.test.ts`, `tests/client/studySubjects.test.tsx`

**Interfaces:**
- `GET /api/subjects?archived=1 -> Subject[]`（默认未归档）；`POST/PATCH/DELETE`；`POST /api/subjects/:id/archive`、`/restore`。
- `GET /api/study/arrangements?date=... -> StudyArrangement[]`；`POST/PATCH/DELETE`。
- 科目字段：`name`、`color`、`goal`、`weeklyTargetMinutes`、`archived`。
- 颜色从 8 个预设中选；周目标用小时输入，存分钟。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/subjects.test.ts
// 创建科目 -> GET；归档 -> 默认列表不含，归档列表含；恢复 -> 回来；
// 创建今日安排 -> GET date 返回；删除。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/subjects.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现学习 schema 与仓储/路由**

`004_study.sql` 创建 `files`、`subjects`、`materials`、`study_arrangements`、`study_sessions`、`study_timer`、`checkin_photos`（字段见 PRD §5.3/5.4；外键在同迁移内按依赖顺序）。`study_sessions.material_id` 和 `arrangement_id` 用 `ON DELETE SET NULL`；`materials.file_id` 用 `ON DELETE SET NULL`；`checkin_photos.file_id` 用 `ON DELETE CASCADE`。`subjects` 仓储：归档用 `archived=1`，不物理删除。`study_arrangements`：按日期+创建时间排序；删除给 5 秒撤销由客户端实现。路由校验日期和分钟数（1–600）。

- [ ] **Step 4: 实现科目列表/详情/安排 UI**

`SubjectsPage`：顶部“今天要学”+“本周学习”占位；科目卡片 3 列（颜色条、名称、目标、周进度、累计、资料数、“开始学习”占位）；“＋ 新增科目”；“已归档”入口。`SubjectModal` 表单；`ArrangementModal` 科目/内容/分钟；`SubjectDetailPage` 三个标签占位（概览/资料/记录），Task 11/13 填充。`TodayPage` 学习组显示今天安排（只读 + 完成勾选），Task 25 再完整联动。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/subjects.test.ts tests/client/studySubjects.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/db/migrations/004_study.sql src/server/repositories/subjects.ts src/server/repositories/studyArrangements.ts src/server/routes/subjects.ts src/server/routes/studyArrangements.ts src/client/features/study tests/server/subjects.test.ts tests/client/studySubjects.test.tsx
git commit -m "feat: add study subjects and today study arrangements"
```

---

### Task 11: 学习计时器、学习记录、每周统计

**Files:**
- Create: `src/server/repositories/studySessions.ts`, `src/server/repositories/studyTimer.ts`, `src/server/routes/studyTimer.ts`, `src/server/routes/studySessions.ts`, `src/server/services/studyStats.ts`
- Create: `src/client/hooks/useStudyTimer.tsx`, `src/client/components/layout/StudyTimerBar.tsx`, `src/client/features/study/SubjectSessions.tsx`, `SessionModal.tsx`, `StudyWeekCard.tsx`, `SubjectOverview.tsx`
- Modify: `src/server/app.ts`, `src/client/features/study/SubjectDetailPage.tsx`, `src/client/features/study/SubjectsPage.tsx`, `src/client/router.tsx`
- Test: `tests/server/studyTimer.test.ts`, `tests/client/studyTimer.test.tsx`

**Interfaces:**
- `GET /api/study/timer -> StudyTimer`；`POST /api/study/timer/start { subjectId, materialId?, arrangementId? }`；`POST /pause`；`POST /resume`；`POST /stop { note? } -> StudySession`。
- `GET /api/study/sessions?subjectId?&from?&to? -> StudySession[]`；`POST /api/study/sessions`（补记）；`PATCH/DELETE /api/study/sessions/:id`。
- `GET /api/study/stats?week=YYYY-MM-DD -> { days: { date, minutes }[]; totalMinutes: number; bySubject: { subjectId, minutes }[] }`。
- 计时少于 1 分钟不创建记录；`stop` 用服务端时间计算，忽略暂停区间。
- 一次只能有一个计时；已有 running/paused 计时时，`start` 返回 409 `TIMER_RUNNING`，客户端提示先结束或继续。
- 会话日期 = 计时开始日；跨午夜结束仍算开始那天。
- 应用重新打开时若 timer 非 idle，弹“继续计时 / 结束并保存”，不静默继续。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/studyTimer.test.ts
// start -> timer.status='running'；pause -> paused；resume -> running；
// stop -> session.durationMinutes >= 1；GET stats 的 totalMinutes 等于 session 之和。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/studyTimer.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现计时器/记录/统计**

`study_timer` 单行 `id=1`；`start` 若已有 running/paused 返回 409 `TIMER_RUNNING`，否则写 status/running/subject/startAt/accumulated=0；`pause` 累加已过秒数并置 paused；`resume` 重置 startedAt；`stop` 计算总秒数，>=60 才创建 session（duration 取整分钟，date = 计时开始日），重置 timer。`studySessions` 仓储与路由；统计按周的周一到周日，`startOfWeek` 用设置 `weekStart`。`StudyWeekCard` 7 根柱；`SubjectOverview` 目标/本周/累计/资料/记录；`SubjectSessions` 列表 + 补记 + 编辑/删除；`StudyTimerBar` 全局，显示科目、已过时间、暂停/结束；`useStudyTimer` 用 Query + interval；应用启动时若 timer 非 idle，弹“继续 / 结束并保存”对话。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/studyTimer.test.ts tests/client/studyTimer.test.tsx`
Expected: PASS。

- [ ] **Step 5: 手工验证刷新/重启恢复**

Run: `npm run dev`，开始计时 → 刷新 → 计时条还在；关掉 APP 再打开 → 询问“继续/结束并保存”；结束 → 记录/统计更新；开始第二个计时 → 提示先结束。
Expected: 满足 PRD §5.3 计时规则。

- [ ] **Step 6: 提交**

```powershell
git add src/server/repositories/studySessions.ts src/server/repositories/studyTimer.ts src/server/routes/studyTimer.ts src/server/routes/studySessions.ts src/server/services/studyStats.ts src/client/hooks/useStudyTimer.tsx src/client/components/layout/StudyTimerBar.tsx src/client/features/study tests/server/studyTimer.test.ts tests/client/studyTimer.test.tsx
git commit -m "feat: add global study timer, sessions and weekly stats"
```

---

### Task 12: 文件服务与学习打卡相册

**Files:**
- Create: `src/server/services/files.ts`, `src/server/repositories/checkins.ts`, `src/server/routes/checkins.ts`, `src/server/routes/files.ts`
- Create: `src/client/lib/compressImage.ts`, `src/client/features/study/CheckinAlbum.tsx`, `CheckinLightbox.tsx`, `CheckinUploader.tsx`
- Modify: `src/server/app.ts`, `src/client/features/study/SubjectDetailPage.tsx`
- Test: `tests/server/checkins.test.ts`, `tests/client/checkins.test.tsx`

**Interfaces:**
- Consumes: Task 10 的 `files` 表与 `FileRecord` 类型；Task 4 的 `apiUpload`。
- `FileService`：`save(buffer, originalName, mime, kind, subdir): Promise<FileRecord>`（压缩后的打卡图/封面）、`saveStream(stream, originalName, mime, kind, subdir): Promise<FileRecord>`（大资料文件）、`pathFor(fileId): string`、`delete(fileId): Promise<void>`。
- `GET /api/subjects/:id/checkins -> { photos: CheckinPhoto[]; days: number; totalPhotos: number }`（按日期倒序、sortOrder）。
- `POST /api/subjects/:id/checkins`（multipart：`date`、`files[]`）-> `CheckinPhoto[]`。
- `DELETE /api/checkins/:id -> { ok: true }`。
- 文件存 `data/files/checkins/<subjectId>/<date>/<uuid>.<ext>`；图片支持 JPG/PNG/WebP，原图 ≤20MB；客户端压缩到长边 2000px。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/checkins.test.ts
// 上传 2 张同科目同日 -> 返回 2 条，sortOrder 0/1；不同科目上传 -> 各自列表互不混入；
// 文件实际存在于 data/files/checkins/<subjectId>/<date>/；DELETE 后文件和记录消失。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/checkins.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现文件服务与打卡 API**

`files.ts`：`mkdir -p` 子目录；UUID 文件名；写文件；返回 `FileRecord`；`delete` 删文件；路径解析防目录穿越。`checkins.ts`：校验科目存在、日期不晚于今天（未来日期 400 `FUTURE_DATE`）；`sortOrder = max+1`；上传多文件逐张保存；删除记录+文件。`files.ts` 路由：`GET /api/files/:id?mode=inline|attachment` 按 MIME 返回流；禁止 `..`。`@fastify/multipart` 限制 20MB。

- [ ] **Step 4: 实现打卡 UI**

`CheckinUploader` 选择/拖拽多图 → `compressImage`（canvas，长边 2000，JPEG 0.85）→ FormData 上传；显示进度。`CheckinAlbum` 按日期分组，首张封面 + 张数；今日打卡卡；补打卡日期选择；`CheckinLightbox` 左右翻、删除、Esc。科目摘要显示打卡天数/照片数。不同科目页面只查当前科目（Review Focus 第 5 条：未来日期禁止）。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/checkins.test.ts tests/client/checkins.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/services/files.ts src/server/repositories/checkins.ts src/server/routes/checkins.ts src/server/routes/files.ts src/client/lib/compressImage.ts src/client/features/study src/server/app.ts tests/server/checkins.test.ts tests/client/checkins.test.tsx
git commit -m "feat: add per-subject daily check-in photo albums"
```

---

### Task 13: 学习资料（链接、笔记、文件、搜索筛选、预览）

**Files:**
- Create: `src/server/repositories/materials.ts`, `src/server/routes/materials.ts`, `src/server/services/materialFiles.ts`
- Create: `src/client/features/study/MaterialsPage.tsx`, `MaterialRow.tsx`, `MaterialDetailPage.tsx`, `MaterialLinkModal.tsx`, `MaterialNoteEditor.tsx`, `MaterialUploadModal.tsx`, `MaterialFilters.tsx`
- Modify: `src/server/app.ts`, `src/client/router.tsx`, `src/client/features/study/SubjectDetailPage.tsx`
- Test: `tests/server/materials.test.ts`, `tests/client/materials.test.tsx`

**Interfaces:**
- Consumes: Task 12 的 `FileService`（`saveStream` 用于大文件）；Task 10 的 `materials`/`files` 表。
- `GET /api/materials?q=&subjectId=&type=&status=&sort= -> Material[]`；`GET /api/materials/:id -> Material & { totalStudyMinutes: number; fileMissing: boolean }`。
- `POST /api/materials/link`、`POST /api/materials/note`、`POST /api/materials/files`（multipart，多文件）-> `Material[]`。
- `PATCH /api/materials/:id`（标题、科目、标签、状态、进度、摘录、正文）；`DELETE /api/materials/:id`。
- 状态/进度联动在服务端统一：100%→completed；completed→100；progress>0 且 not_started→learning。
- 文件预览：`GET /api/files/:id?mode=inline`；其他类型用 `mode=attachment`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/materials.test.ts
// 创建链接/笔记/文件 -> GET 列表；按 subject/type/status 筛选；PATCH progress=100 -> status completed；
// 删除文件资料 -> 文件也被删除；文件丢失时 GET 详情返回 fileMissing=true。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/materials.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现资料仓储/路由/文件服务**

`materials` 仓储：标签 JSON 解析；`totalStudyMinutes` 聚合 `study_sessions.material_id`；文件资料用 `FileService.saveStream` 流式保存，再插记录，失败清理文件。路由校验 URL（http/https，自动补 https）、标题非空、状态/进度枚举。链接只存用户填的标题/URL，不发起外部请求抓标题/缩略图。笔记 `body` 纯文本；`excerpt` 用于链接/文件；笔记没有状态和进度：API 对笔记忽略 `status/progress` 更新，UI 不显示，库里保留默认 `not_started/0`。文件上传限 100MB。

- [ ] **Step 4: 实现资料 UI**

`MaterialsPage`：搜索/科目/类型/状态筛选、排序（筛选写进 URL query，刷新/后退保留）、列表行（类型图标、标题、科目 chip、状态、进度、标签、更新时间、“⋯”）；“添加资料”下拉（链接/笔记/文件）；空状态。`MaterialDetailPage`：链接卡片 + 摘录；PDF iframe/图片 `<img>`/其他文件卡片；笔记整页编辑器（自动保存 500ms 防抖、字数）；右侧元数据（科目/状态/进度/标签/累计学习/时间）；“开始学习”启动计时；删除确认。`SubjectDetailPage` 的“资料”标签复用列表，预填科目。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/materials.test.ts tests/client/materials.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/repositories/materials.ts src/server/routes/materials.ts src/server/services/materialFiles.ts src/client/features/study src/server/app.ts src/client/router.tsx tests/server/materials.test.ts tests/client/materials.test.tsx
git commit -m "feat: add study materials with links, notes and local files"
```

---

### Task 14: 健身 schema、周计划、动作库

**Files:**
- Create: `src/server/db/migrations/005_fitness.sql`, `src/server/db/seed/exercises.ts`, `src/server/repositories/exercises.ts`, `src/server/repositories/fitnessPlan.ts`, `src/server/routes/exercises.ts`, `src/server/routes/fitnessPlan.ts`
- Create: `src/client/features/fitness/FitnessPage.tsx`, `FitnessTabs.tsx`, `WeeklyPlanPage.tsx`, `PlanDayModal.tsx`, `ExercisePicker.tsx`, `ExerciseLibraryPage.tsx`, `ExerciseModal.tsx`, `TodayTrainingPage.tsx`（占位）
- Modify: `src/server/app.ts`, `src/client/router.tsx`
- Test: `tests/server/fitnessPlan.test.ts`, `tests/client/fitnessPlan.test.tsx`

**Interfaces:**
- `GET /api/fitness/plan -> PlanDay[]`（7 天，总是返回）；`PUT /api/fitness/plan/:weekday` body `{ name, isRest, exercises: PlanExercise[] } -> PlanDay`。
- `GET /api/fitness/exercises?q=&muscleGroup=&equipment=&type= -> Exercise[]`；`POST/PATCH/DELETE`；内置动作不可改/删。
- 迁移 005 创建 `exercises`、`training_plan_days`、`training_plan_exercises`、`workout_sessions`、`workout_sets`、`exercise_upgrades`、`weight_logs`；种子 7 天（默认休息）和 ≥15 个内置动作。
- 动作字段：`muscleGroup`（胸/背/腿/肩/手臂/核心/全身）、`equipment`（杠铃/哑铃/器械/绳索/自重/其他）、`type`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/fitnessPlan.test.ts
// GET plan 返回 7 天；PUT 周一训练+2 个动作；GET 周一返回同样动作顺序；
// 创建自定义动作；内置动作 PATCH 返回 403；DELETE 自定义动作。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/fitnessPlan.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 schema/种子/仓储/路由**

迁移 SQL 按字段实现（见 PRD §5.5）。外键删除策略：`training_plan_exercises.exercise_id ON DELETE CASCADE`；`workout_sets.exercise_id ON DELETE SET NULL`；`exercise_upgrades.exercise_id ON DELETE SET NULL`；`workout_sets.exercise_name` 和 `exercise_upgrades.exercise_name` 保存快照。种子：7 行 `training_plan_days(weekday 1..7, name='', is_rest=1)`；内置动作至少覆盖胸/背/腿/肩/手臂/核心/全身，重量/徒手都有。`PUT plan/:weekday` 用事务：upsert day，删除旧 exercises，插入新顺序。删除自定义动作时，计划行级联删除，历史 sets/upgrades 保留名称快照，不会因外键失败。周计划是每周重复模板，PUT 改模板只影响以后，不改历史会话。种子用固定 ID + `INSERT OR IGNORE`，`app.ts` 在迁移后调用 `seedExercises(db)` 保证幂等。

- [ ] **Step 4: 实现周计划/动作库 UI**

`FitnessTabs` 四个标签；`WeeklyPlanPage` 七列卡片（训练名/动作数/总组数/编辑，当前天高亮）；`PlanDayModal` 训练名、休息开关、动作行（目标组数/次数、上移下移、删除）、添加动作；`ExercisePicker` 搜索/筛选/多选；`ExerciseLibraryPage` 卡片列表 + 新增/编辑/删除；`TodayTrainingPage` 占位显示今天计划名和“开始训练”禁用（Task 15 接）。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/fitnessPlan.test.ts tests/client/fitnessPlan.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/db/migrations/005_fitness.sql src/server/db/seed/exercises.ts src/server/repositories/exercises.ts src/server/repositories/fitnessPlan.ts src/server/routes/exercises.ts src/server/routes/fitnessPlan.ts src/client/features/fitness src/server/app.ts src/client/router.tsx tests/server/fitnessPlan.test.ts tests/client/fitnessPlan.test.tsx
git commit -m "feat: add weekly training plan and exercise library"
```

---

### Task 15: 训练会话、专注记录页、训练历史

**Files:**
- Create: `src/server/repositories/workouts.ts`, `src/server/routes/workouts.ts`
- Create: `src/client/features/fitness/SessionPage.tsx`, `ExerciseSetCard.tsx`, `SetRow.tsx`, `FinishSessionDialog.tsx`, `SessionSummaryDrawer.tsx`, `TrainingHistory.tsx`
- Modify: `src/server/app.ts`, `src/client/features/fitness/TodayTrainingPage.tsx`, `src/client/router.tsx`
- Test: `tests/server/workouts.test.ts`, `tests/client/session.test.tsx`

**Interfaces:**
- `GET /api/fitness/today?date= -> { plan: PlanDay | null; session: WorkoutSession | null }`。
- `POST /api/fitness/sessions { date, name, exercises?: PlanExercise[] } -> WorkoutSession`（草稿，按计划预填 sets）。
- `GET /api/fitness/sessions/:id -> WorkoutSession`；`PATCH`（name/note/duration/status）；`DELETE`（放弃草稿）。
- `POST /api/fitness/sessions/:id/sets`、`PATCH/DELETE /api/fitness/sets/:id`。
- `POST /api/fitness/sessions/:id/finish { durationMinutes, note } -> WorkoutSession`（status completed）。
- `GET /api/fitness/sessions?from=&to= -> WorkoutSession[]`（completed）。
- 训练量 = 有重量且完成的 sets 的 `weightKg * reps` 之和；徒手不计。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/workouts.test.ts
// 创建草稿 -> 2 个动作各 1 组；PATCH set 完成；finish -> status completed，duration；
// 再 GET today -> session.status completed；训练量只算重量组；
// 休息日创建空会话“临时练一次”成功，且不改周计划。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/workouts.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现训练仓储/路由**

会话创建：按计划动作生成目标组数的空 sets（weight null, reps 预填目标次数）；状态 draft；同一天已有 draft 时返回它；休息日/无计划可传空 exercises 创建“临时训练”。`PATCH set` 允许 weight/reps/done；删除 set 重排 set_no。`finish` 允许无组但要求 `confirmEmpty: true`（客户端确认后传）。`durationMinutes` 可改，会话 date = 开始那天，跨午夜仍算开始日。历史只返回 completed。

- [ ] **Step 4: 实现专注记录页与历史**

`SessionPage` 全屏（不渲染 Sidebar），顶部返回/训练名/日期/已用时间/结束；每个动作卡片显示“上次 X kg × Y”（从最近完成会话查）；重量/次数/完成表格；加组默认沿用上一组；加动作/删动作；结束弹窗（时长、组数、训练量、备注、未完成组提示）；返回保留草稿；放弃确认。`TodayTrainingPage` 显示状态（未开始/训练中/已完成/休息），按钮开始/继续/查看记录；休息日显示“临时练一次”，创建空会话、不改周计划；**不显示勾选框**（Review Focus 第 3 条）。`TrainingHistory` 列表 + 查看/编辑/删除；编辑复用 `SessionPage` 的编辑模式。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/workouts.test.ts tests/client/session.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/repositories/workouts.ts src/server/routes/workouts.ts src/client/features/fitness src/server/app.ts src/client/router.tsx tests/server/workouts.test.ts tests/client/session.test.tsx
git commit -m "feat: add workout sessions, focus logging and history"
```

---

### Task 16: 当前重量、升级记录、周计划页表/抽屉

**Files:**
- Create: `src/server/repositories/upgrades.ts`, `src/server/routes/upgrades.ts`, `src/server/services/currentWeights.ts`
- Create: `src/client/features/fitness/CurrentWeightTable.tsx`, `UpgradeDrawer.tsx`, `UpgradeModal.tsx`
- Modify: `src/server/app.ts`, `src/client/features/fitness/WeeklyPlanPage.tsx`, `src/client/features/fitness/ExerciseLibraryPage.tsx`, `src/client/features/fitness/SessionPage.tsx`
- Test: `tests/server/upgrades.test.ts`, `tests/client/upgrades.test.tsx`

**Interfaces:**
- `GET /api/fitness/current-weights -> { exerciseId, exerciseName, currentWeightKg, latestUpgrade }[]`（计划里的动作 + 有升级记录的其他动作）。
- `GET /api/fitness/upgrades?exerciseId= -> ExerciseUpgrade[]`；`POST/PATCH/DELETE /api/fitness/upgrades/:id`。
- 当前重量 = 最近升级 `to_weight_kg`；无升级取最近 completed session 中该动作最大重量；无数据 null。
- `POST` 校验 exercise 为 weight 类型、`to != from`、日期不晚于今天；`from` 默认当前重量。
- 删除最新升级后重新计算当前重量。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/upgrades.test.ts
// 创建升级 60->62.5 -> current=62.5；再 62.5->65 -> current=65；
// 删除最新 -> current 回 62.5；删除全部 -> 回退到最近训练最大重量；bodyweight 动作返回 400。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/upgrades.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现升级仓储/路由/当前重量**

`currentWeights` 查询：计划动作 union 有升级的动作；每个取最新 upgrade 或最近 completed session 的 max(weight)。升级写入事务；`from` 由客户端传，服务端也允许省略并自动取当前重量。删除后无需存 current（派生），接口即时重算。路由校验日期/动作类型。

- [ ] **Step 4: 实现周计划表与抽屉**

`WeeklyPlanPage` 下方“动作重量与升级”表：动作/部位器械/当前重量/最近升级/[升级][历史]；顶部搜索 + “＋ 记录升级”；“其他动作”分组。`UpgradeModal`：动作、日期、从/到、备注、实时差额；保存后 invalidate current-weights + upgrades + plan。`UpgradeDrawer`：该动作历史（按月分组）、当前重量、记录/编辑/删除。`ExerciseLibraryPage` 卡片显示“当前 X kg / 升级 n 次”，菜单“查看升级记录”打开同一抽屉。`SessionPage` 重量输入默认当前重量，旁显示上次实际（Review Focus 第 3 条的相关联动）。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/upgrades.test.ts tests/client/upgrades.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/repositories/upgrades.ts src/server/routes/upgrades.ts src/server/services/currentWeights.ts src/client/features/fitness src/server/app.ts tests/server/upgrades.test.ts tests/client/upgrades.test.tsx
git commit -m "feat: add exercise upgrades and current working weight"
```

---

### Task 17: 健身统计（周/月/年、四张图、体重记录）

**Files:**
- Create: `src/server/lib/statsRange.ts`, `src/server/services/fitnessStats.ts`, `src/server/routes/fitnessStats.ts`, `src/server/routes/weights.ts`
- Create: `src/client/features/fitness/StatsPage.tsx`, `FitnessStatsCards.tsx`, `WeightRecordDrawer.tsx`, `WeightModal.tsx`
- Create: `src/client/components/charts/LineChart.tsx`, `BarChart.tsx`, `ChartCard.tsx`
- Modify: `src/server/app.ts`, `src/client/features/fitness/FitnessPage.tsx`, `src/client/features/fitness/FitnessTabs.tsx`
- Test: `tests/server/fitnessStats.test.ts`, `tests/client/fitnessStats.test.tsx`

**Interfaces:**
- `GET /api/stats/fitness?view=week|month|year&anchor=YYYY-MM-DD&exerciseId= -> { range, summary, weight: SeriesPoint[], volume: SeriesPoint[], count: SeriesPoint[], strength: SeriesPoint[], exerciseOptions: { id, name }[] }`。
- `GET /api/weights?from=&to= -> WeightLog[]`；`POST/PATCH/DELETE /api/weights`。
- 统计口径见 PRD §5.5；体重周/月按天最后一次、年按月平均；训练量/次数周月按天、年按月合计；力量按每次会话最大重量/年每月最大；没记录留空，休息日次数 0。
- 体重图与饮食共用；记录后 invalidate `['weights']` 和两个 stats key。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/fitnessStats.test.ts
// 构造跨 3 天数据：2 次训练（重量 60x8x2 + 徒手 10x3）、体重 70/70.5/71；
// 周视图 volume 只含重量组、count=2、weight 点=每天最后；年视图体积为月合计；
// 无记录日期 value=null；换 view/anchor 范围正确。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/fitnessStats.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现统计服务/路由**

先把 `rangeFor(view, anchor, weekStart)` 提到 `src/server/lib/statsRange.ts`，返回 `{ from, to, points }`。week 用 `startOfWeek(anchor, settings.weekStart)` + 6 天；month 用月初到月末；year 用年初到年末。周/月生成每天一个点；年生成 12 个点。`volume` 只算 completed session 中 done 且 `weight_kg not null` 的 sets；`count` 数 completed session；`strength` 按选中 exercise（query `exerciseId` 可选，默认最近有数据）取每次/每月最大重量；`weight` 按日期最后/月平均。返回 `exerciseOptions` 只含有重量且有数据的动作。

- [ ] **Step 4: 实现统计 UI**

`StatsPage` 顶部 `DateNav` 式周期切换 `[周][月][年]` + 左右翻 + 回到现在；四张 `ChartCard` 2×2；周期/anchor 写进 URL query，刷新/后退保留；体重卡“记录体重 →”打开 `WeightModal`，抽屉列表编辑/删除；训练记录列表（本周期）打开 `SessionSummaryDrawer`；动作力量卡旁加“升级记录 →”，打开 Task 16 的 `UpgradeDrawer`（按当前动作）。`LineChart/BarChart` 用 Recharts，空数据时 `EmptyState`；颜色从 CSS 变量读取，深色模式可读；tooltip 显示单位和日期。`FitnessPage` 标签接 `统计`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/fitnessStats.test.ts tests/client/fitnessStats.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/lib/statsRange.ts src/server/services/fitnessStats.ts src/server/routes/fitnessStats.ts src/server/routes/weights.ts src/client/features/fitness src/client/components/charts src/server/app.ts tests/server/fitnessStats.test.ts tests/client/fitnessStats.test.tsx
git commit -m "feat: add fitness week/month/year stats and shared weight log"
```

---

### Task 18: 饮食 schema、食物库、内置食物种子

**Files:**
- Create: `src/server/db/migrations/006_diet.sql`, `src/server/db/seed/foods.ts`, `src/server/repositories/foods.ts`, `src/server/routes/foods.ts`
- Create: `src/client/features/diet/DietPage.tsx`, `DietTabs.tsx`, `FoodLibraryPage.tsx`, `FoodRow.tsx`, `FoodModal.tsx`
- Modify: `src/server/app.ts`, `src/client/router.tsx`
- Test: `tests/server/foods.test.ts`, `tests/client/foodLibrary.test.tsx`

**Interfaces:**
- Consumes: Task 14 的 `weight_logs` 表（体重共用）。
- `GET /api/foods?q=&category= -> Food[]`；`POST/PATCH/DELETE`；内置 `builtIn=true` 不可改/删。
- `GET /api/foods/recent -> Food[]`（最近实际条目去重前 8）；`GET /api/foods/frequent -> Food[]`（实际条目次数前 8）。
- 迁移 006 创建 `foods`、`meal_entries`、`meal_status`、`water_logs`；`weight_logs` 复用 005。
- 食物字段：名称、分类、单位 g/ml、每 100 热量/蛋白质、可选常见一份、内置/自定义。种子 ≥25 种，覆盖主食/肉蛋奶/蔬菜/水果/豆类/零食/饮料/家常菜。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/foods.test.ts
// GET 内置 >=25 且覆盖 8 个分类；创建自定义；PATCH 自定义成功；PATCH 内置 403；
// DELETE 自定义后 GET 不含；recent/frequent 基于 meal_entries 实际条目去重/排序。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/foods.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 schema/种子/仓储/路由**

迁移 SQL 见 PRD §5.6；`meal_entries.food_id` 无外键（快照）；`meal_entries` 必须存 `per100_calories`、`per100_protein` 快照，改分量时可重算；`foods` 删除不级联历史。种子用常见参考值（每 100g/ml），至少有米饭、面条、燕麦、鸡蛋、牛奶、鸡胸肉、牛肉、鱼、豆腐、西兰花、菠菜、苹果、香蕉、坚果、酸奶、可乐等；分类用 PRD 的 8 类。种子用固定 ID + `INSERT OR IGNORE`，`app.ts` 在迁移后调用 `seedFoods(db)` 保证幂等。`recent`/`frequent` 按 `meal_entries.kind='actual'` 聚合，返回当前食物记录。

- [ ] **Step 4: 实现食物库 UI**

`FoodLibraryPage`：搜索、分类 chips、列表（名称/分类/每 100 热量蛋白/常见一份/内置或自定义/“⋯”）；“新增自定义食物”弹窗（名称、分类、单位、每 100 热量蛋白、可选一份名称+克数）；内置只读；删除自定义确认；空/无结果状态。`DietPage` 三标签占位；`FoodModal` 复用于新增/编辑。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/foods.test.ts tests/client/foodLibrary.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/db/migrations/006_diet.sql src/server/db/seed/foods.ts src/server/repositories/foods.ts src/server/routes/foods.ts src/client/features/diet src/server/app.ts src/client/router.tsx tests/server/foods.test.ts tests/client/foodLibrary.test.tsx
git commit -m "feat: add food library with built-in foods and custom foods"
```

---

### Task 19: 今日饮食、餐计划/实际、加食物抽屉

**Files:**
- Create: `src/server/repositories/meals.ts`, `src/server/routes/meals.ts`, `src/server/services/dietDay.ts`
- Create: `src/client/features/diet/DietTodayPage.tsx`, `MealCard.tsx`, `MealEntryRow.tsx`, `FoodPickerDrawer.tsx`, `PortionStep.tsx`, `CopyPlanDialog.tsx`
- Modify: `src/server/app.ts`, `src/client/features/diet/DietPage.tsx`
- Test: `tests/server/meals.test.ts`, `tests/client/dietToday.test.tsx`

**Interfaces:**
- `GET /api/diet/day?date= -> { date, meals: { meal, plannedEntries, actualEntries, plannedCalories, plannedProtein, actualCalories, actualProtein, done }[], summary: { calories, protein }, targets }`。
- `POST /api/diet/entries { date, meal, kind, foodId, amount, unit, servingLabel? } -> MealEntry`（把食物名称和每 100 热量/蛋白作为快照存入，计算热量/蛋白）。
- `PATCH /api/diet/entries/:id { amount?, meal? } -> MealEntry`（用 `per100Calories/per100Protein` 快照重算，不依赖食物库当前值）；`DELETE`。
- `POST /api/diet/meals/:meal/done { date, done } -> MealState`。
- `POST /api/diet/meals/:meal/copy-plan { date, mode: 'replace' | 'append' } -> MealEntry[]`；`POST /api/diet/meals/:meal/clear { date, kind } -> { ok: true }`。
- 未来日期 `kind='actual'` 写入返回 400 `FUTURE_DATE`；计划允许。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/meals.test.ts
// 添加计划鸡胸肉 150g -> planned calories 按 100g 值计算，summary.calories=0；
// 添加实际 -> summary 增加；copy-plan 到空实际 -> 实际条目出现；已有实际时 replace/append 行为；
// 未来日期实际写入 400，计划写入 200。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/meals.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现餐仓储/路由/日期校验**

`dietDay` 查询四餐（固定顺序 breakfast/lunch/dinner/snack），join entries 和 meal_status；汇总实际热量/蛋白质；目标从 settings。`POST entry`：校验食物存在或自定义；把 `foodName/per100Calories/per100Protein` 存快照；计算 `calories = per100 * amount / 100`（单位一致；份=克/毫升）；`PATCH amount` 用快照重算；`done` 不变。`copy-plan` 事务：replace 删实际再插计划快照；append 追加；返回实际。`done` upsert。未来日期判断用 `toLocalDate(new Date())`。

- [ ] **Step 4: 实现今日饮食 UI 与食物抽屉**

`DietTodayPage`：日期导航（复用 `DateNav`，URL `?date=`）；左列四张 `MealCard`，右栏暂占位（Task 20 接）；每卡“实际/计划”Tabs、条目行（名称/分量/热量/蛋白/“⋯”）、加食物、空状态、按计划吃、清空、完成勾选。`FoodPickerDrawer`：搜索/最近/常吃/分类 → 选中 → `PortionStep`（克/毫升/份、实时计算、目标“午餐·实际”）→ 添加；找不到→新建自定义食物后回到分量。`CopyPlanDialog` 三选一。未来日期禁用实际控件并提示。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/meals.test.ts tests/client/dietToday.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/repositories/meals.ts src/server/routes/meals.ts src/server/services/dietDay.ts src/client/features/diet src/server/app.ts tests/server/meals.test.ts tests/client/dietToday.test.tsx
git commit -m "feat: add daily meals with plan/actual logging and food picker"
```

---

### Task 20: 饮水、体重、今日摄入右栏

**Files:**
- Create: `src/server/repositories/water.ts`, `src/server/routes/water.ts`
- Modify: `src/server/routes/weights.ts`（Task 17 已建，扩展复用）
- Create: `src/client/features/diet/DietSummaryRail.tsx`, `WaterCard.tsx`, `WeightCard.tsx`
- Reuse: Task 17 的 `WeightModal.tsx`、`WeightRecordDrawer.tsx`
- Modify: `src/server/services/dietDay.ts`, `src/client/features/diet/DietTodayPage.tsx`
- Test: `tests/server/waterWeight.test.ts`, `tests/client/dietSummary.test.tsx`

**Interfaces:**
- `POST /api/water { date, amountMl } -> WaterLog`；`DELETE /api/water/:id`；`POST /api/water/undo { date } -> { ok: true }`；`GET /api/water?date= -> WaterLog[]`。
- `GET/POST/PATCH/DELETE /api/weights`（见 Task 17）；饮食页复用同一 API/组件。
- `dietDay.summary` 增加 `waterMl`、`waterTarget`、`weightKg`、`weightLoggedAt`。
- 未来日期禁止水/体重写入；过去可补。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/waterWeight.test.ts
// 加水 250+500 -> 总量 750；undo 删除最后一条 -> 500；未来日期 400；
// 体重记录同日两条 -> dietDay 返回最后一条；健身 stats 的 weight 也更新（共用）。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/waterWeight.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现水/体重 API 与右栏**

`water` 仓储：按日期插入/删除/取最后一条；`undo` 删除最新。`dietDay` 汇总水量、目标、最近体重。`DietSummaryRail`：热量/蛋白质进度条 + 还差/超出；饮水卡（1.2/2L、+250/+500/自定义、撤销）；体重卡（最近值、记录）；“改目标”链接设置。`WeightModal` 日期+体重（单位跟随设置）；`WeightRecordDrawer` 列表编辑/删除。未来日期控件禁用。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/waterWeight.test.ts tests/client/dietSummary.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/server/repositories/water.ts src/server/routes/water.ts src/server/services/dietDay.ts src/client/features/diet src/server/app.ts tests/server/waterWeight.test.ts tests/client/dietSummary.test.tsx
git commit -m "feat: add water, shared weight card and daily intake summary"
```

---

### Task 21: 饮食统计（周/月/年、四张图、蛋白质目标）

**Files:**
- Create: `src/server/services/dietStats.ts`, `src/server/routes/dietStats.ts`
- Create: `src/client/features/diet/DietStatsPage.tsx`, `DietStatsCards.tsx`
- Modify: `src/server/app.ts`, `src/client/features/diet/DietPage.tsx`, `src/client/features/settings/SettingsPage.tsx`
- Create: `src/client/features/settings/PreferencesTab.tsx`（先做蛋白质目标，Task 23 补全其余偏好）
- Test: `tests/server/dietStats.test.ts`, `tests/client/dietStats.test.tsx`

**Interfaces:**
- `GET /api/stats/diet?view=week|month|year&anchor=YYYY-MM-DD -> { range, summary: { recordedDays, avgCalories, avgProtein, avgWaterMl, weightChange }, calories: SeriesPoint[], protein: SeriesPoint[], water: SeriesPoint[], weight: SeriesPoint[] }`。
- 热量/蛋白/水周月按天、年按有记录日子的月日均；体重周月按天最后、年按月平均；没记录 `value=null`；目标线用当前 settings。
- `POST /api/settings/protein-reference -> { proteinTarget: number }`，基于最近体重 ×1.6；无体重返回 400 `NO_WEIGHT`。此接口在 Task 21 实现，Task 23 直接复用。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/dietStats.test.ts
// 3 天记录：热量 1800/1600/空，体重 70/70.5/空；周视图 calories 第 3 天 value=null，
// summary.recordedDays=2，avgCalories=1700；年视图按有记录日均，空月 null；
// protein-reference 无体重 400，有体重 70 -> 112。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/dietStats.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现饮食统计服务/路由**

复用 Task 17 的 `rangeFor(view, anchor, weekStart)`（`src/server/lib/statsRange.ts`）。按日期聚合 `meal_entries(kind='actual')` 的热量/蛋白；`water_logs` 求和；`weight_logs` 按日期取最后/月平均；`recordedDays` 为有热量或蛋白记录的天数。返回目标值。蛋白质参考值：最近 `weight_logs` × 1.6 四舍五入。

- [ ] **Step 4: 实现饮食统计 UI**

`DietStatsPage`：周期切换、四张图（热量/蛋白/水柱状 + 目标线，体重折线）、`recordedDays` 文案、体重记录入口；周期/anchor 写进 URL query，刷新/后退保留；空状态。`DietPage` 接标签。`PreferencesTab` 加蛋白质目标输入 + “按体重建参考值”按钮（调用 Task 21 的接口）；Task 23 完成整页。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/dietStats.test.ts tests/client/dietStats.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/services/dietStats.ts src/server/routes/dietStats.ts src/client/features/diet src/client/features/settings/SettingsPage.tsx src/client/features/settings/PreferencesTab.tsx src/server/app.ts tests/server/dietStats.test.ts tests/client/dietStats.test.tsx
git commit -m "feat: add diet week/month/year stats and protein target reference"
```

---

### Task 22: 游戏娱乐（游戏库、详情、状态/评分/时长/封面）

**Files:**
- Create: `src/server/db/migrations/007_games.sql`, `src/server/repositories/games.ts`, `src/server/routes/games.ts`
- Create: `src/client/features/games/GamesPage.tsx`, `GameCard.tsx`, `GameDetailPage.tsx`, `GameModal.tsx`, `GameStatsStrip.tsx`, `GameCoverUploader.tsx`
- Modify: `src/server/app.ts`, `src/client/router.tsx`
- Test: `tests/server/games.test.ts`, `tests/client/games.test.tsx`

**Interfaces:**
- Consumes: Task 12 的 `FileService`；Task 10 的 `files` 表。
- `GET /api/games?status=&platform=&q=&sort= -> Game[]`；`GET /api/games/:id -> Game & { coverUrl: string | null }`；`POST/PATCH/DELETE`。
- `POST /api/games/:id/playtime { minutes } -> Game`；`POST /api/games/:id/cover`（multipart）-> `Game`；`DELETE /api/games/:id/cover`。
- `GET /api/games/stats -> { playing, wishlist, completed, paused, totalMinutes, completedThisYear, recentCompleted, currentPlaying }`。
- 状态切换日期规则见 PRD §5.7；删除游戏删封面文件；封面 `files.kind='cover'`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/games.test.ts
// 创建想玩 -> 改在玩（startDate=今天, finishDate=null）-> 改已通关（finishDate=今天）-> 改想玩（日期清空）；
// +30 分钟累加；stats 计数/今年通关正确；删除游戏封面文件删除。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/games.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现游戏 schema/仓储/路由**

迁移 007 建 `games`（字段见 PRD §5.7），`cover_file_id` 引用 `files` 并用 `ON DELETE SET NULL`。状态变更时按规则更新日期；`PATCH` 允许显式日期覆盖。`playtime` 累加非负分钟。`stats` 用 SQL 聚合；`completedThisYear` 用 `finish_date` 年份 = 当前年；`recentCompleted` 取最近 finish_date；`currentPlaying` 取最近 updated 的 playing。封面替换时删除旧文件。

- [ ] **Step 4: 实现游戏 UI**

`GamesPage`：统计条、状态 Tabs（全部/在玩/想玩/已通关/搁置）、平台筛选/搜索/排序、3:4 封面网格（占位图）、状态/星级/时长；空状态。`GameDetailPage`：封面、平台/状态/评分、游玩时长 + 快捷累加、开始/通关日期、备注自动保存、“标记为已通关”、编辑/删除。`GameModal` 表单；`GameCoverUploader` 压缩上传；`GameStatsStrip` 数据来自 `/api/games/stats`。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/games.test.ts tests/client/games.test.tsx`
Expected: PASS。

- [ ] **Step 6: 提交**

```powershell
git add src/server/db/migrations/007_games.sql src/server/repositories/games.ts src/server/routes/games.ts src/client/features/games src/server/app.ts src/client/router.tsx tests/server/games.test.ts tests/client/games.test.tsx
git commit -m "feat: add game library with status, rating, playtime and covers"
```

---

### Task 23: 设置偏好、数据概览、蛋白质参考值

**Files:**
- Modify: `src/server/routes/settings.ts`, `src/client/features/settings/SettingsPage.tsx`, `PreferencesTab.tsx`, `DataTab.tsx`
- Create: `src/server/services/dataInfo.ts`, `src/server/routes/dataInfo.ts`, `src/client/features/settings/DangerTab.tsx`（清空按钮 Task 24 接）
- Test: `tests/server/dataInfo.test.ts`, `tests/client/settingsPreferences.test.tsx`

**Interfaces:**
- `PATCH /api/settings` 支持 `weekStart`、`weightUnit`、`calorieTarget`、`proteinTarget`、`waterTarget`。
- `GET /api/data/info -> { dataDir, counts: { tasks, memos, subjects, materials, checkins, sessions, workouts, meals, games }, storage: { dbBytes, filesBytes, totalBytes }, lastBackupAt, version }`。
- `POST /api/settings/protein-reference` 已在 Task 21 实现；Task 23 的偏好页直接复用，不重复实现。
- 数据概览计数与占用来自 DB `stat` + 文件目录递归大小。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/dataInfo.test.ts
// 创建 1 个科目/1 个资料/1 个游戏 -> counts 正确；storage 总量 >= dbBytes；
// PATCH settings weekStart=0/weightUnit=jin/targets -> GET 保持。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/dataInfo.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现 dataInfo 与偏好 API**

`dataInfo.ts`：对各表 `COUNT(*)`；`fs.stat` 数据库；递归 `files` 求和；`lastBackupAt` 从 settings；`dataDir` 绝对路径。`settings` PATCH 转换数字/布尔。`PreferencesTab`：每周从、体重单位、热量/蛋白/饮水目标，自动保存 + 校验（非负）；“按体重建参考值”按钮调用 Task 21 的 `protein-reference`，无体重提示。`DataTab`：计数、占用、上次备份、路径/复制/打开、退出。`DangerTab` 占位“清空”按钮，Task 24 接确认。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/dataInfo.test.ts tests/client/settingsPreferences.test.tsx`
Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/server/services/dataInfo.ts src/server/routes/dataInfo.ts src/server/routes/settings.ts src/client/features/settings tests/server/dataInfo.test.ts tests/client/settingsPreferences.test.tsx
git commit -m "feat: add settings preferences and data overview"
```

---

### Task 24: 备份、恢复、清空、恢复前留底

**Files:**
- Create: `src/server/services/backup.ts`, `src/server/routes/backup.ts`
- Create: `src/client/features/settings/BackupTab.tsx`, `RestoreDialog.tsx`, `ClearDataDialog.tsx`
- Modify: `src/server/routes/settings.ts`（lastBackupAt）、`src/client/features/settings/DataTab.tsx`, `DangerTab.tsx`
- Test: `tests/server/backup.test.ts`, `tests/client/backup.test.tsx`

**Interfaces:**
- `GET /api/backup -> application/zip` 下载，文件名 `IndexSama的魔法录-备份-YYYY-MM-DD-HHmm.zip`；zip 含 `manifest.json`、`app.db`、`files/**`。
- `POST /api/restore`（multipart zip）-> `{ ok: true, manifest }`；校验版本/格式/数据库；恢复前写 `data/backups/pre-restore-<timestamp>.zip`；失败回退。
- `POST /api/data/clear` body `{ confirm: '清空' } -> { ok: true }`；删除 DB/文件/设置，重建空库。
- 备份成功后写 `settings.lastBackupAt`。
- 恢复/清空需要服务端关闭并重开 DB；客户端成功后 `window.location.reload()`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/backup.test.ts
// 创建科目/资料文件/打卡照片/游戏封面/训练/饮食/游戏 -> GET backup 解压含 manifest/app.db/files；
// 清空 -> 计数为 0；restore 备份 -> 数据/文件/照片/封面恢复；
// 上传坏 zip -> 400，当前数据不变；manifest.version 更高 -> 409。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/backup.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现备份/恢复/清空服务**

`backup.ts`：`db.backup(tempDbPath)` 得到一致快照；`archiver` 把临时 DB（命名 `app.db`）、`manifest.json`、`files` 目录流式写入响应；manifest 含 `formatVersion:1`、`appVersion`、`createdAt`、counts。`restore`：multipart 存临时 zip；`yauzl` 解压到 `data/.restore-tmp`；校验 manifest/`app.db` 可打开/版本；写当前数据到 `data/backups/pre-restore-*.zip`；`dbManager.close()`；替换 `app.db` 和 `files`；`dbManager.reopen()`；迁移（应为同版本）；清理临时目录；失败用留底回退。`clear`：关闭 DB、删除 `data/app.db`/`files`/`backups`（保留目录）、重开并迁移、重置 settings。`settings.lastBackupAt` 更新。

- [ ] **Step 4: 实现备份/恢复/清空 UI**

`BackupTab`：上次备份、导出按钮（fetch blob + 下载，进度）、恢复按钮（文件选择、校验结果、确认覆盖、进度、成功 reload）；超过 30 天黄条。`RestoreDialog` 显示备份日期/版本/数量 + 输入/勾选确认。`ClearDataDialog` 要求输入“清空”，提示先备份；成功后 reload。`DataTab` 显示 lastBackupAt；侧栏状态点由 settings 驱动。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/backup.test.ts tests/client/backup.test.tsx`
Expected: PASS。

- [ ] **Step 6: 手工验收备份完整性**

创建资料文件/打卡照片/封面 → 导出 → 清空 → 恢复 → 逐一检查文件可打开、打卡按科目/日期分开。
Expected: 满足 Review Focus 第 4 条。

- [ ] **Step 7: 提交**

```powershell
git add src/server/services/backup.ts src/server/routes/backup.ts src/server/routes/settings.ts src/client/features/settings tests/server/backup.test.ts tests/client/backup.test.tsx
git commit -m "feat: add full backup, restore with rollback and clear data"
```

---

### Task 25: 首页/今日计划全量聚合与联动

**Files:**
- Create: `src/server/services/day.ts`, `src/server/services/home.ts`, `src/server/routes/day.ts`, `src/server/routes/home.ts`
- Modify: `src/client/features/home/*`, `src/client/features/today/*`, `src/client/hooks/useQuickAdd.tsx`, `src/server/app.ts`
- Test: `tests/server/dayHome.test.ts`, `tests/client/homeFull.test.tsx`, `tests/client/todayFull.test.tsx`

**Interfaces:**
- `GET /api/day/:date -> { date, tasks, study: { arrangements: (StudyArrangement & { actualMinutes })[] }, fitness: { plan: PlanDay | null, session: WorkoutSession | null }, diet: { meals: { meal, plannedCalories, plannedProtein, actualCalories, actualProtein, done }[] }, progress: { done, total } }`。
- `GET /api/home -> { date, progress, items, memos, studySummary, fitnessSummary, dietSummary, gameSummary }`。
- 聚合规则见 PRD §6.2；进度：手动/学习安排/餐的 done + 健身 session completed；休息日不算；游戏不算。
- 今日计划健身行无勾选框；状态来自 session。餐勾选走 `meal_status`；学习安排勾选走 `study_arrangements.done`。
- 学习/餐/健身自动项在今日计划不可删除；点标题去模块。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/dayHome.test.ts
// 构造：1 手动未完成、1 学习安排已完成、1 计划餐未完成、1 完成训练、1 条备忘、1 款在玩/1 款已通关；
// day.progress = 2/4（手动+学习+餐+健身）；home.items 最多 5；摘要数字与模块一致；
// 健身无训练 -> 不算完成；餐勾了没实际 -> 不产生热量。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/dayHome.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现聚合服务/路由**

`day.ts`：查 tasks；study arrangements + 关联 session 分钟；fitness plan day + 当天 draft/completed session；diet 计划餐 + 实际汇总 + done；计算进度。`home.ts`：today 的 items（tasks + study + fitness + diet，按组序）、memos、study/fitness/diet/game 摘要（实际分钟/次数/热量蛋白水/游戏统计），复用模块统计函数。只读，不复制数据。

- [ ] **Step 4: 接入首页与今日计划 UI**

`HomePage` 改用 `/api/home`；今日计划卡按组序显示，健身行状态按钮无勾选，学习/餐勾选 PATCH 对应模块；摘要卡显示真实数字；快速添加五项全部可用（学习安排/记体重/记饮水接模块 modal）。`TodayPage` 改用 `/api/day/:date`；四个分组自动项；完成项折叠；昨天未完成横幅（查前一日 tasks，`全部顺延` 逐条 carry-over）；日期/URL；未来日期只读计划（实际控件禁用）。`useQuickAdd` 五项全部实现。

- [ ] **Step 5: 运行测试确认通过**

Run: `npm test -- tests/server/dayHome.test.ts tests/client/homeFull.test.tsx tests/client/todayFull.test.tsx`
Expected: PASS。

- [ ] **Step 6: 手工验证**

勾选学习/餐 → 模块同步；去训练完成 → 今日计划/首页变已完成；记录饮食 → 首页饮食卡更新；检查健身行无勾选框。
Expected: 满足 Review Focus 第 2、3 条。

- [ ] **Step 7: 提交**

```powershell
git add src/server/services/day.ts src/server/services/home.ts src/server/routes/day.ts src/server/routes/home.ts src/client/features/home src/client/features/today src/client/hooks/useQuickAdd.tsx src/server/app.ts tests/server/dayHome.test.ts tests/client/homeFull.test.tsx tests/client/todayFull.test.tsx
git commit -m "feat: aggregate home and today from all modules"
```

---

### Task 26: 打包、便携运行环境、启动器

**Files:**
- Create: `scripts/package-app.mjs`, `scripts/launcher.vbs`, `scripts/README.txt`
- Modify: `package.json` scripts, `src/server/index.ts`（端口回退、写 `server-url.txt`、退出清理）、`src/server/app.ts`（打包后的静态根）
- Test: `tests/server/package.test.ts`（或 `tests/e2e/package.spec.ts`）

**Interfaces:**
- `npm run package` 产出 `release/IndexSama的魔法录/`：
  - `启动IndexSama的魔法录.vbs`
  - `runtime/node.exe`（复制 `process.execPath`）
  - `app/server/index.mjs`（自包含，服务端依赖已打包）
  - `app/client/**`（vite build）
  - `data/`（已存在则保留，绝不覆盖/删除；仅首次创建空目录）
  - `README.txt`
- 启动器：检查 `http://127.0.0.1:43110/api/health`，已运行则直接开浏览器；否则隐藏启动 `runtime\node.exe app\server\index.mjs`，等待 `data/server-url.txt` 出现，读取 URL 打开默认浏览器。服务退出时删 URL 文件。
- 服务端口回退：43110–43119；全部占用则退出并写 `data/server-error.txt`。
- `DATA_DIR` 由启动器设置为 `<release>/data`；服务端优先使用 `DATA_DIR`。

- [ ] **Step 1: 写失败测试**

```ts
// tests/server/package.test.ts
// 运行 package 脚本（或直接调用 buildRelease(tempDir)）-> 断言 runtime/node.exe、app/server/index.mjs、
// app/client/index.html、app/node_modules/better-sqlite3 存在；
// 预先放 data/marker.txt -> 重新打包 -> marker 还在（程序更新不覆盖数据）；
// spawn 打包后的 server（DATA_DIR=temp/data, PORT=43112）-> GET /api/health 200 且 GET / 返回 index.html 200。
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/server/package.test.ts`
Expected: FAIL。

- [ ] **Step 3: 实现打包脚本与启动器**

`package-app.mjs`：`vite build`；`tsup src/server/index.ts --format esm --out-dir dist/server`；`npm ci --omit=dev` 到 staging（或复制后 `npm prune --omit=dev`）；复制 `process.execPath` 到 `runtime/node.exe`；复制 `dist/client`、`dist/server`、`node_modules`、`launcher.vbs`、`README.txt`；`data` 仅在不存在时创建，已存在时原样保留，禁止清空。`launcher.vbs` 用 `WScript.Shell` 执行隐藏命令，轮询 `server-url.txt`（最多 20 秒），再 `Run "http://..."`。`index.ts` 端口回退、写 URL 文件、`process.on('exit')` 删文件。`app.ts` 静态根改为 `path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../client')`（ESM 没有 `__dirname`；打包后 `app/server` 的上一级 `app/client`）；开发环境由 Vite 提供页面，不走静态托管。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- tests/server/package.test.ts`
Expected: PASS。

- [ ] **Step 5: 手工验证双击启动**

双击 `release/IndexSama的魔法录/启动IndexSama的魔法录.vbs` → 浏览器打开；关闭浏览器再双击 → 数据在；设置退出 → 服务停止。
Expected: 满足 PRD §2.1/§7.9。

- [ ] **Step 6: 提交**

```powershell
git add scripts package.json src/server/index.ts src/server/app.ts tests/server/package.test.ts
git commit -m "build: package portable app with launcher and bundled runtime"
```

---

### Task 27: E2E 验收、最终 QA、发布说明

**Files:**
- Create: `tests/e2e/helpers.ts`, `tests/e2e/startup.spec.ts`, `home-today.spec.ts`, `study.spec.ts`, `checkin.spec.ts`, `fitness.spec.ts`, `diet.spec.ts`, `games.spec.ts`, `backup.spec.ts`, `dates.spec.ts`
- Modify: `playwright.config.ts`, `README.md`
- Test: `npm run test:e2e`

**Interfaces:**
- Playwright `webServer`：`npm run build && node dist/server/index.mjs`，`DATA_DIR=.e2e-data`，`PORT=43111`；global setup 删除 `.e2e-data`。
- 每个 spec 覆盖 PRD §10 的对应验收项；使用 `data-testid` 或 role/label 定位。
- 外部网络检查：`page.on('request')` 断言 host 只允许 `127.0.0.1:43111`（用户点击外部链接的测试除外）。

- [ ] **Step 1: 写启动/持久化 E2E**

`startup.spec.ts`：
- 打开首页 → 8 个导航入口。
- 新增备忘/事项 → reload → 还在。
- 关闭页面重开（同一 webServer）→ 还在。
- 主题切换 → reload → 保留。
Expected: 全通过。

- [ ] **Step 2: 写首页/今日计划 E2E**

`home-today.spec.ts`：
- 首页今日计划卡最多 5 条；查看全部。
- 加 6 条事项 → 卡显示 5 条；进今日计划看到全部。
- 学习安排/计划餐/训练自动项出现；健身行无 checkbox。
- 顺延昨天未完成事项；昨日横幅。
Expected: 全通过。

- [ ] **Step 3: 写学习/打卡 E2E**

`study.spec.ts` + `checkin.spec.ts`：
- 建科目 → 加安排 → 今日计划出现 → 计时 → 结束 → 记录/统计。
- 上传 2 张打卡照片 → 首张封面/2 张；另一科目上传 → 互不混入；未来日期禁用。
Expected: 全通过（Review Focus 第 5 条）。

- [ ] **Step 4: 写健身/饮食 E2E**

`fitness.spec.ts`：
- 周计划编辑 → 今日训练 → 记录组 → 结束 → 统计/首页完成；升级 60→62.5 → 当前重量/专注页预填；删除最新升级回退。
- 徒手动作不进训练量。
`diet.spec.ts`：
- 计划午餐 → 实际为空 → 今日摄入 0 → 按计划吃 → 实际增加；蛋白质目标参考值；统计目标线；未来日期实际禁用。
Expected: 全通过（Review Focus 第 2 条）。

- [ ] **Step 5: 写游戏/备份 E2E**

`games.spec.ts`：添加游戏 → 状态在玩/已通关 → 日期/今年通关；+30 分钟；封面。
`backup.spec.ts`：创建资料文件/打卡照片/封面 → 导出 → 清空 → 恢复 → 检查文件/照片/封面/设置。
Expected: 全通过（Review Focus 第 4 条）。

- [ ] **Step 6: 写日期/不联网 E2E**

`dates.spec.ts`：
- 未来日期：实际饮食/饮水/体重/打卡禁用；今日计划未来可排计划。
- 跨午夜逻辑用 API 单测覆盖（Task 11/15）。
- 请求监听：无非 `127.0.0.1` 外部请求（用户点击链接除外）。
Expected: 全通过。

- [ ] **Step 7: 运行全部测试与构建**

Run:
```powershell
npm test
npm run test:e2e
npm run build
npm run package
```
Expected: 单元/组件/E2E 全绿；构建和打包成功。

- [ ] **Step 8: 手工对照 PRD §10 验收**

逐条勾选 PRD §10 的 A–J；重点复验：
- 清理浏览器数据后数据还在。
- 断网启动可用。
- 备份/恢复文件完整。
- 1280×720 无横向滚动。
- 控制台无未处理报错。

- [ ] **Step 9: 更新 README 与提交**

`README.md`：如何开发、测试、构建、打包、启动、备份、恢复、数据目录、已知限制（不加密、不支持 HEIC、需要普通 NTFS 目录）。
```powershell
git add tests/e2e playwright.config.ts README.md
git commit -m "test: add e2e acceptance coverage and release notes"
```

---

## PRD Coverage Map

| PRD 章节 | 覆盖任务 |
|---|---|
| 1 产品目标/场景 | 全计划；Task 25/27 验收 |
| 2 页面框架/导航 | Task 5、25 |
| 3 首页 | Task 7、9、25 |
| 4 模块用途 | Task 10–22 |
| 5.1 首页数据/操作 | Task 7、9、25 |
| 5.2 今日计划 | Task 8、25 |
| 5.3 学习科目/计时/打卡 | Task 10、11、12 |
| 5.4 学习资料 | Task 13 |
| 5.5 健身 | Task 14、15、16、17 |
| 5.6 饮食 | Task 18、19、20、21 |
| 5.7 游戏 | Task 22 |
| 5.8 数据与设置 | Task 6、23、24 |
| 6 模块关系/聚合 | Task 25 |
| 7 数据/备份/恢复 | Task 3、24、26 |
| 8 第一版必须完成 | Task 1–27 |
| 9 暂时不做 | 不实现；Task 27 README 记录 |
| 10 验收标准 | Task 27 + 各任务测试 |

## Execution Handoff

- 计划保存位置：`docs/superpowers/plans/2026-11-09-personal-life-app.md`
- 建议执行方式：**Subagent-driven**。任务之间共享类型、DB schema 和 API 契约，单个任务改错会影响后续多个模块；每个任务独立实现 + 独立 reviewer 更能挡住接口漂移。
- 执行前先解决 `E:\DSH-APP` 的 shell 写入权限，或在普通 NTFS 目录执行本计划。
- 每个 Task 完成后运行该 Task 的测试并提交；不要攒到最后一次性提交。
