# Zustand Store 依赖关系

| Store | 文件 | 消费组件 | 依赖 |
|-------|------|---------|------|
| `useAuthStore` | `stores/useAuthStore.ts` | AppShell, Sidebar, MobileShell, router, LoginPage, RegisterPage | 无 |
| `useDialogueStore` | `stores/useDialogueStore.ts` | ChatContainer, Sidebar, ChatInput, MessageBubble | 无 |
| `useMoodStore` | `stores/useMoodStore.ts` | MoodPage, MoodCheckin, MoodCalendar, MoodChart, GrowthPage, useMoodTheme | 无 |
| `useLayoutStore` | `stores/useLayoutStore.ts` | AppShell | 无 |
| `useAssessmentStore` | `stores/useAssessmentStore.ts` | AssessmentPage, AssessmentCard, ScaleQuestion | 无 |
| `useCommunityStore` | `stores/useCommunityStore.ts` | CommunityPage, PostCard, PostComposer | 无 |
| `useThemeStore` | `stores/useThemeStore.ts` | useDayNight, ThemeToggle, AppShell | 无 |
| `useUniverseStore` | `stores/useUniverseStore.ts` | UniversePage, UniverseCanvas, EmotionPlanet | 无 |

## 隐式依赖

| 关系 | 说明 |
|------|------|
| `useMoodStore.todayEntry` → `useMoodTheme` | MoodPage 打卡后自动更新主题 |
| `useDayNight` → `useThemeStore` | Thin wrapper，非独立 |
| `useAuthStore.logout` → 清空所有 store | Sidebar 登出时需同步清空对话/mood 缓存 |


## 规则

- 所有 store 独立（无跨 store 订阅）
- `useThemeStore` 内部有 `setInterval` + `window.matchMedia` 副作用（模块级）
- `useUniverseStore` mock 数据仅开发用，生产需替换为 API 调用
