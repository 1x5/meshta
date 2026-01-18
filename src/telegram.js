
class TelegramBot {
  constructor(token, userId) {
    this.token = token;
    this.userId = userId;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(text, parseMode = 'HTML') {
    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.userId,
        text,
        parse_mode: parseMode,
        disable_web_page_preview: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${error}`);
    }

    return await response.json();
  }

  formatMessage(article) {
    const shortSummary = `
<b>📡 ${article.title}</b>

<i>${article.summary_short}</i>

🔗 <a href="${article.url}">Читать полную статью</a>

<code>Дата: ${new Date(article.published_at).toLocaleDateString('ru-RU')}</code>
    `.trim();

    return shortSummary;
  }

  formatDetailedMessage(article) {
    const detailedSummary = `
<b>📡 ${article.title}</b>

<b>Краткое резюме:</b>
${article.summary_short}

<b>Подробный анализ:</b>
${article.summary_long}

🔗 <a href="${article.url}">Читать полную статью</a>

<code>Опубликовано: ${new Date(article.published_at).toLocaleDateString('ru-RU')}</code>
    `.trim();

    return detailedSummary;
  }

  async sendArticle(article) {
    try {
      // Отправляем краткое резюме
      await this.sendMessage(this.formatMessage(article));

      // Небольшая задержка перед отправкой подробного
      await new Promise(resolve => setTimeout(resolve, 500));

      // Отправляем подробный анализ
      await this.sendMessage(this.formatDetailedMessage(article));

      return true;
    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
      throw error;
    }
  }
}

export default TelegramBot;
