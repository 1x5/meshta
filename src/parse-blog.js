import 'dotenv/config.js';
import { load } from 'cheerio';

// Получаем API ключ и настройки
function getAIConfig() {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const apiKey = deepseekKey || openaiKey;
  const apiUrl = deepseekKey 
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  const model = deepseekKey ? 'deepseek-chat' : 'gpt-4o-mini';
  const provider = deepseekKey ? 'DeepSeek' : 'OpenAI';
  
  return { apiKey, apiUrl, model, provider };
}

// Генерация краткого саммери на русском
async function generateRussianSummary(title, content) {
  const { apiKey, apiUrl, model, provider } = getAIConfig();
  
  if (!apiKey) {
    console.log('⚠️  AI API не настроен, используем оригинальный текст');
    return content.substring(0, 300) + '...';
  }

  console.log(`🤖 Генерируем саммери через ${provider}...`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Ты помощник радиолюбителя. Создавай краткие и информативные резюме статей о Meshtastic на русском языке. Фокусируйся на практической пользе для радиолюбителей. Отвечай только текстом резюме, без форматирования.'
          },
          {
            role: 'user',
            content: `Создай краткое резюме (3-5 предложений) этой статьи о Meshtastic на русском языке:

Заголовок: ${title}

Содержание: ${content.substring(0, 2000)}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Ошибка AI API:', error);
      return content.substring(0, 300) + '...';
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();
    console.log('✅ Саммери сгенерировано');
    return summary;
  } catch (error) {
    console.error('❌ Ошибка генерации саммери:', error.message);
    return content.substring(0, 300) + '...';
  }
}

// Перевод полной статьи на русский
async function translateFullArticle(title, content) {
  const { apiKey, apiUrl, model, provider } = getAIConfig();
  
  if (!apiKey) {
    console.log('⚠️  AI API не настроен, пропускаем перевод');
    return null;
  }

  console.log(`🌐 Переводим статью через ${provider}...`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'Ты переводчик технических статей о Meshtastic и радиосвязи. Переводи точно и сохраняй технические термины. Формат: простой текст без markdown.'
          },
          {
            role: 'user',
            content: `Переведи эту статью о Meshtastic на русский язык. Сохрани структуру и все технические детали:

Заголовок: ${title}

${content.substring(0, 4000)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Ошибка перевода:', error);
      return null;
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();
    console.log('✅ Статья переведена');
    return translation;
  } catch (error) {
    console.error('❌ Ошибка перевода статьи:', error.message);
    return null;
  }
}

// Загрузка полного текста статьи
async function fetchFullArticle(url) {
  try {
    console.log(`📄 Загружаем полную статью: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Ошибка загрузки статьи: ${response.status}`);
      return null;
    }
    
    const html = await response.text();
    const $ = load(html);
    
    // Извлекаем основной контент статьи
    const content = $('article, .blog-post, [class*="content"], main')
      .find('p, h2, h3, li')
      .map((i, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 20)
      .join('\n\n');
    
    return content || null;
  } catch (error) {
    console.error(`❌ Ошибка загрузки статьи: ${error.message}`);
    return null;
  }
}

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

async function sendToSupabase(article, summary, fullText) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⏭️  Пропуск отправки в Supabase');
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
        summary_short: summary,
        summary_long: fullText || summary,
        sent_to_telegram: true,
      }),
    });

    if (response.ok) {
      console.log(`✅ Сохранено в Supabase`);
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

// Разбивка длинного текста на части для Telegram (макс 4096 символов)
function splitMessage(text, maxLength = 4000) {
  if (text.length <= maxLength) return [text];
  
  const parts = [];
  let current = '';
  const paragraphs = text.split('\n\n');
  
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > maxLength) {
      if (current) parts.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current) parts.push(current.trim());
  
  return parts;
}

async function sendToTelegram(article, summary, fullTranslation) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const userId = process.env.TELEGRAM_USER_ID;

  if (!botToken || !userId) {
    console.log('⏭️  Пропуск отправки в Telegram');
    return false;
  }

  try {
    // 1️⃣ Отправляем краткое саммери
    const summaryMessage = `📡 <b>${article.title}</b>\n\n<b>📋 Краткое саммери:</b>\n${summary}\n\n🔗 <a href="${article.url}">Читать оригинал на английском</a>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: summaryMessage,
        parse_mode: 'HTML',
      }),
    });

    console.log(`✅ Отправлено саммери в Telegram`);

    // 2️⃣ Отправляем полную статью на русском (если есть)
    if (fullTranslation) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const parts = splitMessage(fullTranslation);
      
      for (let i = 0; i < parts.length; i++) {
        const header = i === 0 ? `📖 <b>Полная статья на русском:</b>\n\n` : '';
        const footer = i === parts.length - 1 ? `\n\n<i>Часть ${i + 1}/${parts.length}</i>` : `\n\n<i>Часть ${i + 1}/${parts.length} (продолжение ниже)</i>`;
        
        const fullMessage = parts.length === 1 
          ? `📖 <b>Полная статья на русском:</b>\n\n${parts[0]}`
          : `${header}${parts[i]}${footer}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: userId,
            text: fullMessage,
            parse_mode: 'HTML',
          }),
        });
        
        // Задержка между частями
        if (i < parts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log(`✅ Отправлена полная статья (${parts.length} частей)`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Ошибка отправки в Telegram: ${error.message}`);
    return false;
  }
}

async function processArticles() {
  try {
    console.log('🔄 Обработка статей...\n');

    const html = await fetchBlogPage();
    const articles = parseArticles(html);
    console.log(`✅ Найдено статей: ${articles.length}\n`);

    let successCount = 0;

    for (const article of articles) {
      console.log(`\n📝 Обработка: ${article.title}`);
      console.log('─'.repeat(50));
      
      // 1. Загружаем полный текст статьи
      const fullContent = await fetchFullArticle(article.url);
      
      // 2. Генерируем краткое саммери на русском
      const summary = await generateRussianSummary(article.title, fullContent || article.summary);
      
      // 3. Переводим полную статью на русский
      let fullTranslation = null;
      if (fullContent) {
        fullTranslation = await translateFullArticle(article.title, fullContent);
      }
      
      // 4. Сохраняем в Supabase
      await sendToSupabase(article, summary, fullTranslation);

      // 5. Отправляем в Telegram
      await sendToTelegram(article, summary, fullTranslation);
      successCount++;

      // Задержка между статьями
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📊 Итог: обработано ${successCount} статей`);
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
