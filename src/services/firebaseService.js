import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const saveMatchesToFirebase = async (matches, budget, riskLevel, chatId) => {
  try {
    // Создаем объект с данными
    const predictionData = {
      matches: matches.map(match => ({
        id: match.id,
        name: match.name,
        date: match.date,
        time: match.time,
        league: match.league
      })),
      budget,
      riskLevel,
      chatId,
      createdAt: serverTimestamp(),
      status: 'pending'
    };

    // Сохраняем в Firebase
    const docRef = await addDoc(collection(db, 'predictions'), predictionData);
    
    // Проверяем сохранение
    const savedDoc = await getDoc(docRef);
    if (!savedDoc.exists()) {
      throw new Error('Документ не был сохранен');
    }
    
    console.log('Документ успешно сохранен в Firebase:', savedDoc.data());
    return docRef.id;
  } catch (error) {
    console.error('Ошибка при сохранении в Firebase:', error);
    throw new Error('Не удалось сохранить данные в базу: ' + error.message);
  }
};

// Добавляем функцию для получения прогноза по ID
export const getPrediction = async (predictionId) => {
  try {
    const docRef = doc(db, 'predictions', predictionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Прогноз не найден');
    }
  } catch (error) {
    console.error('Ошибка при получении прогноза:', error);
    throw error;
  }
}; 