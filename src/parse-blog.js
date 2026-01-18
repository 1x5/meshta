import 'dotenv/config.js';
import { load } from 'cheerio';

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
        summary: summary.substring(0, 500),
        published_at: dateStr || new Date().toISOString(),
      });
    }
  });

  return articles;
}

async function sendToSupabase(article) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⏭️  Пропуск отправки в Supabase (отсутствуют credentials)');
    return false;
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/meshtastic_articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        title: article.title,
        url: article.url,
        published_at: article.published_at,
        summary_short: article.summary.substring(0, 200) + '...',
        summary_long: article.summary.substring(0, 500) + '...',
        sent_to_telegram: false,
      }),
    });

    if (response.ok) {
      console.log(`✅ Сохранено в Supabase: ${article.title}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Ошибка Supabase: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка отправки: ${error.message}`);
    return false;
  }
}

async function sendToTelegram(article) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const userId = process.env.TELEGRAM_USER_ID;

  if (!botToken || !userId) {
    console.log('⏭️  Пропуск отправки в Telegram (отсутствуют credentials)');
    return false;
  }

  try {
    const message = `📡 ${article.title}\n\n${article.summary.substring(0, 200)}...\n\n🔗 <a href="${article.url}">Читать полную статью</a>`;

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: userId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (response.ok) {
      console.log(`✅ Отправлено в Telegram: ${article.title}`);
      return true;
    } else {
      const error = await response.text();
      console.error(`❌ Ошибка Telegram: ${error}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка отправки в Telegram: ${error.message}`);
    return false;
  }
}

async function processArticles() {
  try {
    console.log('🔄 Обработка статей...\n');

    // Загружаем HTML
    const html = await fetchBlogPage();

    // Парсим статьи
    const articles = parseArticles(html);
    console.log(`✅ Найдено статей: ${articles.length}\n`);

    let successCount = 0;

    for (const article of articles) {
      console.log(`📝 Обработка: ${article.title}`);
      
      // Отправляем в Supabase
      const savedToDb = await sendToSupabase(article);

      // Отправляем в Telegram
      if (savedToDb) {
        await sendToTelegram(article);
        successCount++;
      }

      // Задержка между отправками
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n📊 Итог: обработано ${successCount} статей`);
    return successCount;
  } catch (error) {
    console.error('❌ Критическая ошибка:', error.message);
    throw error;
  }
}

// Запуск
processArticles()
  .then(count => {
    console.log('\n✨ Успешно завершено');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Ошибка:', error);
    process.exit(1);
  });
