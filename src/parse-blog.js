import { load } from 'cheerio';
import SupabaseClient from './supabase.js';
import TelegramBot from './telegram.js';

// Инициализация клиентов
const supabase = new SupabaseClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const telegram = new TelegramBot(
  process.env.TELEGRAM_BOT_TOKEN,
  process.env.TELEGRAM_USER_ID
);

async function fetchBlogPage() {
  console.log('📥 Загрузка блога Meshtastic...');
  const response = await fetch('https://meshtastic.org/blog/');

  if (!response.ok) {
    throw new Error(`Ошибка загрузки: ${response.status}`);
  }

  return await response.text();
}

function parseArticles(html) {
  const $ = load(html);
  const articles = [];

  // Парсим статьи с блога
  $('article, .blog-post, [class*="post"]').each((i, elem) => {
    const titleElem = $(elem).find('h2, h3, .title, [class*="title"]').first();
    const title = titleElem.text().trim();

    const linkElem = $(elem).find('a').first();
    const url = linkElem.attr('href') || '';

    const dateElem = $(elem).find('[class*="date"], time').first();
    const dateStr = dateElem.text().trim() || dateElem.attr('datetime') || '';

    const summaryElem = $(elem).find('p, .summary, [class*="excerpt"]').first();
    const summary = summaryElem.text().trim();

    if (title && url && summary) {
      // Преобразуем относительные URL в абсолютные
      const fullUrl = url.startsWith('http') ? url : `https://meshtastic.org${url}`;

      articles.push({
        title,
        url: fullUrl,
        summary: summary.substring(0, 500), // Берём первые 500 символов
        published_at: dateStr || new Date().toISOString(),
      });
    }
  });

  return articles;
}

async function generateSummary(title, content) {
  // Если OpenAI API недоступен, используем простое резюме
  if (!process.env.OPENAI_API_KEY) {
    return {
      short: content.substring(0, 200) + '...',
      long: content.substring(0, 500) + '...',
    };
  }

  try {
    // Здесь можно интегрировать OpenAI API для лучшего резюме
    const shortSummary = content.substring(0, 200) + '...';
    const longSummary = content.substring(0, 500) + '...';

    return {
      short: shortSummary,
      long: longSummary,
    };
  } catch (error) {
    console.error('Ошибка генерации резюме:', error);
    return {
      short: content.substring(0, 200) + '...',
      long: content.substring(0, 500) + '...',
    };
  }
}

async function processArticles() {
  try {
    console.log('🔄 Обработка статей...');

    // Загружаем HTML
    const html = await fetchBlogPage();

    // Парсим статьи
    const articles = parseArticles(html);
    console.log(`✅ Найдено статей: ${articles.length}`);

    let newArticles = 0;

    for (const article of articles) {
      try {
        // Проверяем, есть ли уже такая статья
        const exists = await supabase.articleExists(article.url);

        if (exists) {
          console.log(`⏭️  Пропуск: ${article.title} (уже обработана)`);
          continue;
        }

        console.log(`📝 Обработка: ${article.title}`);

        // Генерируем резюме
        const summaries = await generateSummary(article.title, article.summary);

        // Сохраняем в Supabase
        const result = await supabase.insert('meshtastic_articles', {
          title: article.title,
          url: article.url,
          published_at: article.published_at,
          summary_short: summaries.short,
          summary_long: summaries.long,
          sent_to_telegram: true, // Отмечаем как отправленную сразу
        });

        // Отправляем в Telegram
        if (result && result.length > 0) {
          const articleData = result[0];
          await telegram.sendArticle(articleData);
          console.log(`✅ Отправлено в Telegram: ${article.title}`);
          newArticles++;
        }

        // Задержка между отправками для соблюдения rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Ошибка обработки статьи "${article.title}":`, error.message);
      }
    }

    console.log(`\n📊 Итог: обработано ${newArticles} новых статей`);
    return newArticles;
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    throw error;
  }
}

// Запуск
processArticles()
  .then(count => {
    console.log('\n✨ Успешно завершено');
    process.exit(count > 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Ошибка:', error);
    process.exit(1);
  });
