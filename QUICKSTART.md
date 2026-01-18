# Быстрый старт ⚡

## Что уже готово?

✅ Проект инициализирован  
✅ Telegram бот создан  
✅ GitHub репозиторий готов  
✅ Supabase credentials есть  

## Что нужно сделать? (5 шагов - 10 минут)

### 1️⃣ Push проекта на GitHub

```bash
cd "/Users/ii/cursor/новости мештастик"

# Добавляем удалённый репозиторий
git remote add origin https://github.com/1x5/meshta.git

# Отправляем код
git branch -M main
git push -u origin main
```

### 2️⃣ Создаём таблицу в Supabase

1. Откройте https://app.supabase.com
2. Выберите проект (jqzkhsnyzrfcuhczsxnj)
3. SQL Editor → New Query → Скопируй и выполни:

```sql
CREATE TABLE meshtastic_articles (
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,
  url TEXT UNIQUE NOT NULL,
  published_at TIMESTAMP NOT NULL,
  summary_short TEXT,
  summary_long TEXT,
  sent_to_telegram BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sent_to_telegram ON meshtastic_articles(sent_to_telegram);
CREATE INDEX idx_published_at ON meshtastic_articles(published_at DESC);
```

✅ Нажми **Run** → Ждёшь "Success"

### 3️⃣ Добавляем GitHub Secrets

Перейди: https://github.com/1x5/meshta/settings/secrets/actions

Нажми **New repository secret** и добавь 4 переменных:

| Название | Значение |
|----------|----------|
| `VITE_SUPABASE_URL` | `https://jqzkhsnyzrfcuhczsxnj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxemtoc255emJmY3VoY3pzeG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA3NjksImV4cCI6MjA4Mjk0Njc2OX0.5ls9jWuFDQjmGZR0DnvacsV2KkGtLDkuqsBYPLzd2u0` |
| `TELEGRAM_BOT_TOKEN` | `8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4` |
| `TELEGRAM_USER_ID` | `303406594` |

✅ После каждого нажми **Add secret**

### 4️⃣ Тестируем локально

```bash
# Установка зависимостей
cd "/Users/ii/cursor/новости мештастик"
pnpm install

# Создаём .env (локальный файл, не в репо!)
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://jqzkhsnyzrfcuhczsxnj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxemtoc255emJmY3VoY3pzeG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA3NjksImV4cCI6MjA4Mjk0Njc2OX0.5ls9jWuFDQjmGZR0DnvacsV2KkGtLDkuqsBYPLzd2u0
TELEGRAM_BOT_TOKEN=8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4
TELEGRAM_USER_ID=303406594
EOF

# Запускаем парсинг
pnpm parse
```

Если видишь в консоли что-то типа:
```
✅ Найдено статей: 10
📝 Обработка: Zero-Cost Hops for Favorite Routers
✅ Отправлено в Telegram: Zero-Cost Hops...
```

→ **Работает!** ✨

### 5️⃣ Включаем автоматизацию

1. Откройте https://github.com/1x5/meshta/actions
2. Нажми на **Meshtastic News Parser** в левой панели
3. Нажми **Enable workflow** (если видишь такую кнопку)
4. Нажми **Run workflow** → **Run workflow** для тестовой проверки

✅ Workflow будет запускаться каждые **5 минут** автоматически!

---

## Проверяем работу 🧪

### В Telegram:
1. Напиши боту `@MeshtasticNewsBot` или найди его в контактах
2. Отправь `/start`
3. Жди сообщения от бота с последними статьями

### На GitHub:
Откройте https://github.com/1x5/meshta/actions  
Должны видеть успешные запуски каждые 5 минут ✅

### В Supabase:
Откройте https://app.supabase.com → Table Editor → meshtastic_articles  
Должны видеть список обработанных статей

---

## Если не работает 🔧

### Telegram не отвечает
- Проверь, что бот включен (нажми `/start`)
- Проверь User ID (должно быть число 303406594)
- Проверь Telegram Bot Token в Secrets

### GitHub Actions не запускается
- Проверь, что workflow включен в Actions
- Проверь что все 4 Secrets добавлены правильно
- Смотри логи на https://github.com/1x5/meshta/actions

### Ошибки парсинга
- Откройте лог GitHub Actions
- Скопируй ошибку в чат - помогу разобраться

---

## Что дальше?

После того, как всё работает:

1. **Улучшение резюме** - добавить OpenAI API для лучших саммери
2. **Фильтры** - получать только интересующие тебя категории
3. **Веб-интерфейс** - просмотр истории на сайте
4. **Группа Telegram** - отправлять в группу радиолюбителей

---

## Нужна помощь?

Если что-то не работает:
1. Проверь все 5 шагов выше
2. Смотри логи (GitHub Actions или терминал)
3. Убедись, что все данные скопированы правильно

**Успехов с Meshtastic! 📡**
