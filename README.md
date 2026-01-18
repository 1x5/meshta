# Meshtastic News Bot 📡

Автоматический бот для отправки саммери статей с блога Meshtastic в Telegram.

## Функционал

- ✅ Парсинг блога https://meshtastic.org/blog/
- ✅ Генерация саммери на русском языке (краткий и подробный)
- ✅ Хранение обработанных статей в Supabase
- ✅ Отправка в Telegram
- ✅ GitHub Actions для автоматизации (каждые 5 минут)

## Требования

- Node.js 16+
- Supabase аккаунт
- Telegram бот (токен от @BotFather)

## Переменные окружения

Создай файл `.env` в корне проекта:

```env
# Supabase
VITE_SUPABASE_URL=https://jqzkhsnyzrfcuhczsxnj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxemtoc255emJmY3VoY3pzeG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzA3NjksImV4cCI6MjA4Mjk0Njc2OX0.5ls9jWuFDQjmGZR0DnvacsV2KkGtLDkuqsBYPLzd2u0

# Telegram
TELEGRAM_BOT_TOKEN=8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4
TELEGRAM_USER_ID=303406594

# OpenAI для генерации саммери
OPENAI_API_KEY=your_api_key_here
```

## Подготовка Supabase

1. Откройте https://supabase.com
2. Перейдите в проект
3. Откройте SQL Editor и выполните:

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

## Локальный запуск

```bash
pnpm install
pnpm parse
```

## GitHub Actions

Workflow автоматически запускается каждые 5 минут и:
1. Парсит новые статьи с блога
2. Генерирует саммери через OpenAI API
3. Отправляет в Telegram
4. Сохраняет в Supabase

Смотреть логи: https://github.com/1x5/meshta/actions

## Структура проекта

```
.
├── src/
│   ├── parse-blog.js       # Основной скрипт парсинга
│   ├── supabase.js         # Клиент Supabase
│   └── telegram.js         # Отправка сообщений
├── .github/
│   └── workflows/
│       └── meshtastic-news.yml # GitHub Actions
├── .env                    # Переменные окружения
├── package.json
└── README.md
```

## Нужна помощь?

Проверь логи GitHub Actions или запусти локально для дебага.
