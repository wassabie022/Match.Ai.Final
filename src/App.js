// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import IntroScreen from './components/IntroScreen';
import FootballMatchesScreen from './components/FootballMatchesScreen';
import StrategyScreen from './components/StrategyScreen';
import RequestAccepted from './components/RequestAccepted'; // Импортируем новый компонент
import { SelectedMatchesProvider } from './context/SelectedMatchesContext'; // Импортируем провайдер контекста
import SubscriptionScreen from './components/SubscriptionScreen';
import { checkSubscriptionStatus } from './services/subscriptionService';
import './App.css'; // Ваш общий CSS, если есть

function App() {
  const [isLoading, setIsLoading] = useState(true); // Экран загрузки
  const [showIntro, setShowIntro] = useState(false); // Экран интро
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [chatId, setChatId] = useState(null); // Сохраняем chat ID

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        const telegram = window.Telegram?.WebApp;
        const userId = telegram?.initDataUnsafe?.user?.id || "6045806877"; // для тестирования
        
        console.log('Проверяем пользователя:', userId);
        
        const status = await checkSubscriptionStatus(userId);
        console.log('Статус подписки:', status);
        
        setSubscriptionStatus(status);

        if (status.status === 'active' || status.status === 'trial') {
          setShowIntro(true);
        }
      } catch (error) {
        console.error('Ошибка:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleLoadingComplete = () => {
    console.log('LoadingScreen завершён'); // Проверка
    setIsLoading(false);
    setShowIntro(true);
  };

  const handleIntroStart = () => {
    console.log('IntroScreen завершён'); // Проверка
    setShowIntro(false);
  };

  return (
    <Router>
      <SelectedMatchesProvider>
        {isLoading ? (
          <LoadingScreen onLoadingComplete={handleLoadingComplete} />
        ) : subscriptionStatus?.status === 'expired' ? (
          <SubscriptionScreen />
        ) : showIntro ? (
          <IntroScreen onStart={handleIntroStart} />
        ) : (
          <Routes>
            <Route path="/" element={<FootballMatchesScreen chatId={chatId} />} />
            <Route path="/strategy" element={<StrategyScreen chatId={chatId} />} />
            <Route path="/request-accepted" element={<RequestAccepted chatId={chatId} />} />
            <Route path="/oplata" element={<SubscriptionScreen />} />
          </Routes>
        )}
      </SelectedMatchesProvider>
    </Router>
  );
}

export default App;
