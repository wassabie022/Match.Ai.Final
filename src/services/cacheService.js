const CACHE_KEY = 'matches_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 минут

export const getCachedMatches = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
      // Если кэш устарел, удаляем его
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  } catch (error) {
    // В случае ошибки (например, превышение квоты), очищаем кэш
    console.warn('Cache error:', error);
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
    return null;
  }
};

export const setCachedMatches = (matches) => {
  try {
    // Сохраняем только необходимые поля для уменьшения размера данных
    const minimalMatches = matches.map(match => ({
      id: match.id,
      date: match.date,
      time: match.time,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      league: match.league
    }));

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: minimalMatches,
      timestamp: Date.now()
    }));
  } catch (error) {
    // В случае ошибки просто пропускаем кэширование
    console.warn('Failed to cache matches:', error);
  }
}; 