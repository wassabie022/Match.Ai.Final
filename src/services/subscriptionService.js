import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

// Проверка статуса подписки пользователя
export const checkSubscriptionStatus = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Пользователь впервые в приложении - даём пробный период
      await setDoc(userDocRef, {
        userId,
        trialUsed: true,
        trialStartDate: serverTimestamp(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
        subscriptionStatus: 'trial',
        createdAt: serverTimestamp()
      });
      return { status: 'trial', isNew: true };
    }

    const userData = userDoc.data();
    
    // Проверяем активную подписку
    if (userData.subscriptionStatus === 'active') {
      if (new Date(userData.subscriptionEndDate.toDate()) > new Date()) {
        return { status: 'active' };
      }
    }

    // Проверяем пробный период
    if (userData.subscriptionStatus === 'trial') {
      if (new Date(userData.trialEndDate.toDate()) > new Date()) {
        return { status: 'trial' };
      }
    }

    // Если нет активной подписки и пробный период использован/закончился
    return { status: 'expired' };
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    throw error;
  }
};

// Активация подписки
export const activateSubscription = async (userId, plan) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    let endDate;
    switch (plan) {
      case 'oneWeek':
        endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'oneMonth':
        endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'sixMonths':
        endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new Error('Неверный план подписки');
    }

    await setDoc(userDocRef, {
      subscriptionStatus: 'active',
      subscriptionPlan: plan,
      subscriptionStartDate: serverTimestamp(),
      subscriptionEndDate: endDate,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { status: 'active', plan };
  } catch (error) {
    console.error('Ошибка при активации подписки:', error);
    throw error;
  }
}; 