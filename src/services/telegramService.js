import axios from 'axios';

const BOT_TOKEN = '7786910973:AAHgQdocOzO7NtmY4RedQQm-PL_kgO_ek0o';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const ADMIN_CHAT_ID = '6045806877'; // Фиксированный chat_id администратора

export const sendMatchesToTelegram = async (matches, amount, riskLevel, chatId) => {
    try {
        console.log('Отправка в Telegram:', {
            botToken: BOT_TOKEN,
            chatId: chatId,
            matches: matches,
            amount: amount,
            riskLevel: riskLevel
        });

        // Проверяем chat_id
        if (!chatId || chatId === "unknown") {
            throw new Error('Не указан chat_id');
        }

        // Форматируем сообщение
        const matchesText = matches.map(match => 
            `🏆 ${match.homeTeam} - ${match.awayTeam}\n` +
            `⏰ ${match.time}\n`
        ).join('\n');

        const riskLevelText = {
            'low': 'Низкий риск (Консервативный подход)',
            'medium': 'Средний риск (Сбалансированный подход)',
            'high': 'Высокий риск (Агрессивный подход)'
        }[riskLevel];

        // Всегда отправляем в чат администратора, игнорируя входящий chatId
        const message = 
            `🎯 *Новая ставка*\n\n` +
            `*Выбранные матчи:*\n${matchesText}\n` +
            `💰 *Сумма:* ${amount} ₽\n` +
            `⚠️ *Стратегия:* ${riskLevelText}\n` +
            `👤 *От пользователя:* ${chatId}\n`; // Показываем ID пользователя, который сделал ставку

        // Отправляем сообщение только администратору
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
            chat_id: ADMIN_CHAT_ID, // Всегда отправляем администратору
            text: message,
            parse_mode: 'Markdown'
        });

        if (!response.data.ok) {
            throw new Error(response.data.description || 'Ошибка при отправке сообщения');
        }

        console.log('Сообщение успешно отправлено:', response.data);
        return response.data;

    } catch (error) {
        console.error('Ошибка при отправке в Telegram:', error);
        if (error.response) {
            console.error('Детали ошибки:', error.response.data);
        }
        throw error;
    }
}; 