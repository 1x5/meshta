# Инструкция по настройке Meshtastic News Bot 🚀

## Шаг 1: Подготовка Supabase

### 1.1 Создание таблицы

Откройте https://app.supabase.com → твой проект → SQL Editor и скопируй эту команду:

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

Нажми ▶ Run и дождись успеха.

### 1.2 Получение credentials

В левом меню Supabase → Settings → API:

1. **Project URL** - скопируй `https://xxxxx.supabase.co`
2. **Anon Key** (public) - скопируй весь ключ

У тебя уже есть:
- VITE_SUPABASE_URL: `https://jqzkhsnyzrfcuhczsxnj.supabase.co`
- VITE_SUPABASE_ANON_KEY: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Шаг 2: Настройка GitHub Secrets

Откройте: https://github.com/1x5/meshta/settings/secrets/actions

Нажми "New repository secret" для каждого:

| Название | Значение |
|----------|----------|
| `VITE_SUPABASE_URL` | `https://jqzkhsnyzrfcuhczsxnj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `TELEGRAM_BOT_TOKEN` | `8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4` |
| `TELEGRAM_USER_ID` | `303406594` |

**Опционально:**
- `OPENAI_API_KEY` - если хочешь лучшие резюме через OpenAI

## Шаг 3: Включение GitHub Actions

1. Перейди на https://github.com/1x5/meshta
2. Вкладка **Actions**
3. Если видишь "I understand..." - нажми "I understand my workflows..."
4. Нажми "Meshtastic News Parser" в левой колонке
5. Нажми "Enable workflow"

## Шаг 4: Локальная проверка (опционально)

```bash
cd /Users/ii/cursor/новости\ мештастик

# Установка зависимостей
pnpm install

# Проверка .env
cat > .env << EOF
VITE_SUPABASE_URL=https://jqzkhsnyzrfcuhczsxnj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN=8381060632:AAFO0PL713dLcy62wRs0_5cADrxod4stRA4
TELEGRAM_USER_ID=303406594
EOF

# Запуск
pnpm parse
```

## Что происходит

1. **GitHub Actions** запускается каждые 5 минут
2. **Парсит** https://meshtastic.org/blog/ на новые статьи
3. **Сохраняет** в Supabase PostgreSQL
4. **Отправляет** в твой Telegram (оба формата - краткий + подробный)

## Проверка статуса

- **Логи Actions**: https://github.com/1x5/meshta/actions
- **Telegram**: Проверь чат с ботом `@MeshtasticNewsBot`
- **Supabase**: https://app.supabase.com → твой проект → Table Editor

## Если что-то не работает

### Ошибка "Workflow disabled"
→ Включи на вкладке Actions

### Нет сообщений в Telegram
→ Проверь:
- Токен бота правильный
- User ID правильный
- Telegram bot отвечает на `/start`
- Secrets на GitHub установлены

### Ошибка парсинга
→ Смотри логи на https://github.com/1x5/meshta/actions

## Что дальше?

Вот идеи для улучшения:

1. **OpenAI интеграция** - лучшие резюме
2. **Телеграм группа** - отправлять в группу вместо личного чата
3. **Фильтры** - получать только статьи по определённым темам
4. **Web interface** - просмотр истории статей на сайте

Готово! 🎉
