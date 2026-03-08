# Skill: Environment & Validation Protocol

Инструкция по работе в специфической среде проекта.

## 1. Ограничения среды (Supabase Edge Functions)
- **Runtime**: Deno. Не используй Node.js специфичные библиотеки без префикса `npm:`.
- **Runtime**: Не пытайся вызывать Python-скрипты напрямую из `index.ts`. Для аналитики используй внешние API (например, QuickChart) или асинхронную обработку.

## 2. Протокол проверки (Verification)
- Перед предложением деплоя, агент `Tester` или `Bot-Dev` ОБЯЗАТЕЛЬНО должен запустить локальную симуляцию.
- Файлы для тестов: `scripts/test_webhook.py`.

## 3. Design Review (Planner)
- Planner не должен давать команду на кодинг, пока не опишет архитектуру в `.swarm/task_plan.md` и не получит подтверждение, что она не нарушает ограничения Edge Functions.
