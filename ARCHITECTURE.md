# Архитектура Meshtastic News Bot 🏗️

## Общая схема

```
┌─────────────────────────────────────────────────────────────┐
│                    Meshtastic Blog                           │
│            https://meshtastic.org/blog/                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP запрос (каждые 5 мин)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         GitHub Actions Workflow (Ubuntu)                     │
│                                                               │
│  1. Fetch HTML блога                                        │
│  2. Parse articles (cheerio)                                │
│  3. Check Supabase for duplicates                           │
│  4. Generate summaries                                      │
│  5. Save to PostgreSQL                                      │
│  6. Send to Telegram                                        │
└─────────────────────────────────────────────────────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌───────────────────┐       ┌──────────────────────┐
│  Supabase         │       │  Telegram Bot API    │
│  PostgreSQL       │       │                      │
│                   │       │  - sendMessage()     │
│ meshtastic_       │       │  - Parse mode HTML   │
│ articles          │       │  - Rich formatting   │
│                   │       │                      │
│ - title (UNIQUE)  │       └──────────────────────┘
│ - url (UNIQUE)    │                │
│ - summary_short   │                │
│ - summary_long    │                │
│ - published_at    │                ▼
│ - sent_telegram   │       ┌──────────────────────┐
│ - created_at      │       │   User Telegram      │
└───────────────────┘       │   Chat (303406594)   │
                            └──────────────────────┘
```

## Компоненты

### 1. GitHub Actions Workflow
**Файл:** `.github/workflows/meshtastic-news.yml`

```yaml
Расписание: */5 * * * * (каждые 5 минут)
Задачи:
  ├─ Checkout code
  ├─ Setup Node.js 18
  ├─ Install pnpm
  ├─ Install dependencies
  ├─ Run parse-blog.js
  └─ Report status
```

**Преимущества:**
- ✅ Полностью бесплатно (GitHub Actions Free Tier)
- ✅ Максимум 5 минут между проверками
- ✅ Масштабируемо до 20 параллельных воркеров
- ✅ Логирование во встроенной системе

### 2. Node.js Парсер
**Файл:** `src/parse-blog.js`

```
1. fetchBlogPage()
   └─ GET https://meshtastic.org/blog/

2. parseArticles(html)
   ├─ Load HTML с cheerio
   ├─ Extract: title, url, date, summary
   └─ Return array of articles

3. processArticles()
   ├─ For each article:
   │  ├─ Check if exists in Supabase
   │  ├─ Generate summaries
   │  ├─ Insert into PostgreSQL
   │  ├─ Send to Telegram
   │  └─ Mark as sent
   └─ Log results
```

**Технологии:**
- `node-fetch` - HTTP запросы
- `cheerio` - DOM парсинг (jQuery syntax)
- `supabase.js` - DB операции
- `telegram.js` - Отправка сообщений

### 3. Supabase PostgreSQL
**Таблица:** `meshtastic_articles`

```sql
CREATE TABLE meshtastic_articles (
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,          -- Название статьи
  url TEXT UNIQUE NOT NULL,            -- URL (UNIQUE для дедупликации)
  published_at TIMESTAMP NOT NULL,     -- Дата публикации
  summary_short TEXT,                  -- Краткое резюме (200 символов)
  summary_long TEXT,                   -- Подробный анализ (500 символов)
  sent_to_telegram BOOLEAN DEFAULT FALSE, -- Отправлена ли в чат
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_sent_to_telegram ON meshtastic_articles(sent_to_telegram);
CREATE INDEX idx_published_at ON meshtastic_articles(published_at DESC);
```

**Зачем нужны индексы:**
- `idx_sent_to_telegram` - быстрый поиск необработанных статей
- `idx_published_at` - сортировка по дате (новые сверху)

### 4. Telegram Bot
**Файл:** `src/telegram.js`

```javascript
TelegramBot
├─ constructor(token, userId)
├─ sendMessage(text, parseMode)
├─ formatMessage(article)          // Краткое сообщение
├─ formatDetailedMessage(article)  // Подробное сообщение
└─ sendArticle(article)            // Отправляет оба
```

**Формат сообщений:**

```
📡 Название статьи

Краткое резюме: ...

🔗 [Читать полную статью](ссылка)

Дата: 17.01.2025

---

📡 Название статьи

Краткое резюме: ...

Подробный анализ: ...

🔗 [Читать полную статью](ссылка)

Опубликовано: 17.01.2025
```

## Поток данных

```
1. GitHub Actions запускается каждые 5 минут
                     │
                     ▼
2. Загружает HTML блога Meshtastic
                     │
                     ▼
3. Парсит статьи (cheerio)
   - Извлекает: заголовок, URL, дату, описание
                     │
                     ▼
4. Для каждой статьи:
   │
   ├─ Проверяет есть ли в Supabase
   │  └─ Если есть: пропускает
   │  └─ Если нет: продолжает
   │
   ├─ Генерирует резюме
   │  ├─ Короткое (200 символов)
   │  └─ Подробное (500 символов)
   │
   ├─ Сохраняет в PostgreSQL
   │  └─ INSERT INTO meshtastic_articles
   │
   ├─ Отправляет в Telegram
   │  ├─ Краткое сообщение
   │  └─ Подробное сообщение
   │
   └─ Отмечает как отправленную
      └─ UPDATE sent_to_telegram = TRUE
                     │
                     ▼
5. Логирует результаты
                     │
                     ▼
6. GitHub Actions завершается
```

## Переменные окружения (Secrets)

```bash
# GitHub Actions будет использовать эти переменные
# Хранятся в Settings → Secrets → Actions

VITE_SUPABASE_URL              # URL проекта Supabase
VITE_SUPABASE_ANON_KEY         # Публичный ключ Supabase
TELEGRAM_BOT_TOKEN             # Токен бота от @BotFather
TELEGRAM_USER_ID               # Твой Telegram User ID
OPENAI_API_KEY                 # (опционально) для лучших резюме
```

## Масштабируемость

### Текущая архитектура

```
GitHub Actions (Бесплатный тариф)
├─ Каждые 5 минут: 1 запуск
├─ 20 параллельных воркеров (максимум)
└─ ~1-2 сек на проверку = ~150 проверок в день

Supabase (Бесплатный тариф)
├─ 50,000 строк (достаточно на год)
├─ 1 ГБ хранилища
└─ 500 MB/месяц бандвидта
```

### Если нужно масштабировать

1. **Чаще проверять (каждую минуту)**
   - Перейти на GitHub Actions Pro
   - Или использовать Supabase Edge Functions + Cron

2. **Больше ботов (группы, каналы)**
   - Добавить в переменные TELEGRAM_CHAT_ID_1, TELEGRAM_CHAT_ID_2
   - Переделать telegram.js для множественной отправки

3. **Улучшить резюме**
   - Добавить OpenAI API интеграцию
   - Генерировать на лету вместо простого обрезания

## Безопасность

### RLS (Row Level Security) - опционально

Если хочешь ограничить доступ к таблице:

```sql
ALTER TABLE meshtastic_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON meshtastic_articles
  FOR SELECT USING (true);

CREATE POLICY "Allow anon insert" ON meshtastic_articles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon update" ON meshtastic_articles
  FOR UPDATE USING (true) WITH CHECK (true);
```

### Переменные Secrets

- ✅ Никогда не коммитим `.env` в репо
- ✅ Используем GitHub Secrets для автоматизации
- ✅ Для локального тестирования: `.env` в `.gitignore`

## Мониторинг

### GitHub Actions логи
Откройте: https://github.com/1x5/meshta/actions

Видишь все запуски и ошибки

### Supabase метрики
Откройте: https://app.supabase.com → Statistics

Видишь:
- Количество запросов
- Использованное хранилище
- Бандвидт

### Telegram уведомления
Проверь чат с ботом на новые сообщения

---

## Диаграмма решения проблем

```
❌ Нет сообщений в Telegram
├─ Проверить токен бота
├─ Проверить User ID
├─ Проверить Secrets на GitHub
└─ Смотреть логи Actions

❌ Сообщения не сохраняются
├─ Проверить таблицу в Supabase
├─ Проверить Supabase URL и Key
├─ Проверить индексы
└─ Смотреть логи Actions

❌ Workflow не запускается
├─ Проверить что workflow включен
├─ Проверить все 4 Secrets добавлены
├─ Нажать "Run workflow" вручную
└─ Смотреть логи Actions
```

---

**Архитектура простая, надежная и полностью бесплатная!** 🚀
