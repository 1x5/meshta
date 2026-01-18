# GitHub Setup - Пошаговая инструкция 🐙

После создания проекта нужно загрузить его на GitHub.

## Шаг 1: Проверяем что код готов

```bash
cd "/Users/ii/cursor/новости мештастик"
git log --oneline
```

Должен увидеть:
```
cc43b58 docs: Add comprehensive setup and documentation guides
0d818ea feat: Initialize Meshtastic News Bot with Telegram integration
```

Оба коммита есть? Отлично! ✅

## Шаг 2: Добавляем GitHub как remote

```bash
git remote add origin https://github.com/1x5/meshta.git
```

Проверяем:
```bash
git remote -v
```

Должно быть:
```
origin  https://github.com/1x5/meshta.git (fetch)
origin  https://github.com/1x5/meshta.git (push)
```

## Шаг 3: Загружаем на GitHub

```bash
git branch -M main
git push -u origin main
```

**Если ошибка про пароль:**

GitHub требует Personal Access Token вместо пароля:

1. Откройте https://github.com/settings/tokens/new
2. Нажмите "Generate new token (classic)"
3. Дайте название: `meshtastic-news-bot`
4. Выберите `repo` (полный доступ)
5. Нажмите "Generate token"
6. **Скопируйте токен!** (больше не покажет)
7. При запросе пароля - вставьте токен

После этого:
```bash
git push -u origin main
```

## Шаг 4: Проверяем что код на GitHub

1. Откройте https://github.com/1x5/meshta
2. Должны видеть все файлы:
   - ✅ `src/` папка
   - ✅ `.github/workflows/` папка
   - ✅ Все `.md` файлы
   - ✅ `package.json`

3. Нажмите на вкладку "Actions"
4. Должна быть история коммитов

Отлично! Код на GitHub! 🎉

---

## Шаг 5: Добавляем Secrets

### 5.1 Переходим в Settings

https://github.com/1x5/meshta/settings/secrets/actions

### 5.2 Нажимаем "New repository secret"

Добавляем 4 secret'а по одному:

#### Secret #1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://jqzkhsnyzrfcuhczsxnj.supabase.co
```
→ "Add secret"

#### Secret #2: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxemtoc255emJmY3VoY3pzeG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA3NjksImV4cCI6MjA4Mjk0Njc2OX0.5ls9jWuFDQjmGZR0DnvacsV2KkGtLDkuqsBYPLzd2u0
```
→ "Add secret"

#### Secret #3: TELEGRAM_BOT_TOKEN
```
Name: TELEGRAM_BOT_TOKEN
Value: 8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4
```
→ "Add secret"

#### Secret #4: TELEGRAM_USER_ID
```
Name: TELEGRAM_USER_ID
Value: 303406594
```
→ "Add secret"

### 5.3 Проверяем что все добавили

Должны видеть в списке:
- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ TELEGRAM_BOT_TOKEN
- ✅ TELEGRAM_USER_ID

---

## Шаг 6: Включаем GitHub Actions Workflow

### 6.1 Переходим на Actions

https://github.com/1x5/meshta/actions

### 6.2 Видим "Meshtastic News Parser"

Нажимаем на это название в левой панели.

### 6.3 Нажимаем "Enable workflow"

Если видите эту кнопку - нажмите.

### 6.4 Тестовый запуск

Нажимаем "Run workflow" → "Run workflow"

Дождитесь пока статус станет зелёным ✅ (примерно 1-2 минуты).

---

## Шаг 7: Проверяем что всё работает

### 7.1 GitHub Actions логи

На странице Actions должны видеть зелёную галочку ✅

Нажмите на последний запуск → видите:
```
✓ Checkout code
✓ Setup Node.js
✓ Install pnpm
✓ Install dependencies
✓ Parse and send
✓ Completed
```

### 7.2 Telegram уведомления

Откройте Telegram и бота `@MeshtasticNewsBot`

Должны были придти новые сообщения со статьями:
- 📡 Название статьи
- краткое резюме
- ссылка

### 7.3 Supabase БД

Откройте https://app.supabase.com → таблица `meshtastic_articles`

Должны видеть новые строки!

---

## Если что-то не работает

### Actions не запускается

**Проблема:** Не видишь "Run workflow"

**Решение:**
1. Проверь что workflow файл в `.github/workflows/meshtastic-news.yml`
2. Иди в Actions → "I understand my workflows..." → нажми
3. Включи workflow (кнопка "Enable workflow")

### Workflow запускается но ошибки

**Проблема:** Красный X вместо зелёной галочки

**Решение:**
1. Нажми на запуск
2. Посмотри логи в "Run parse and send" step
3. Проверь:
   - Все 4 Secrets добавлены
   - Нет опечаток в значениях
   - Таблица Supabase создана

### Telegram не получает сообщения

**Проблема:** GitHub Actions работает, но нет уведомлений

**Решение:**
1. Проверь User ID (должно быть число 303406594)
2. Отправь боту `/start` чтобы разблокировать
3. Проверь что Telegram Bot Token правильный
4. Посмотри логи GitHub Actions

---

## Финальная проверка ✅

**Все готово если:**

- [ ] Код на GitHub (https://github.com/1x5/meshta)
- [ ] 4 Secrets добавлены
- [ ] Workflow включен и работает (зелёная галочка)
- [ ] Telegram получает сообщения
- [ ] Supabase хранит статьи

**Отлично! GitHub Setup завершен! 🎉**

---

## Следующее

Теперь workflow будет автоматически:
1. Запускаться каждые 5 минут
2. Проверять новые статьи
3. Отправлять в Telegram
4. Сохранять в Supabase

Ты готов! 📡

---

## Команды которые использовали

```bash
# 1. Инициализируем локальный git (уже сделано)
git init

# 2. Добавляем файлы (уже сделано)
git add -A

# 3. Делаем коммиты (уже сделано)
git commit -m "message"

# 4. Добавляем remote
git remote add origin https://github.com/1x5/meshta.git

# 5. Переименовываем ветку в main
git branch -M main

# 6. Загружаем на GitHub
git push -u origin main

# 7. Проверяем
git remote -v
git log --oneline
```

После этого - всё в интерфейсе GitHub (Secrets, Actions).

Всё просто! 🚀
