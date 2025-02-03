// src/components/StrategyScreen.js

import React, { useState, useEffect, useContext, useRef } from 'react';
import './StrategyScreen.css';
import { useNavigate } from 'react-router-dom';

// Вместо react-icons используем PNG-иконки
import shieldIcon from '../assets/shield.png';
import scaleIcon from '../assets/scale.png';
import fireIcon from '../assets/fire.png';

import { SelectedMatchesContext } from '../context/SelectedMatchesContext'; 
import EditMatchesModal from './EditMatchesModal'; 

// Импортируем функцию отправки в Telegram
import { sendMatchesToTelegram } from '../services/telegramService';
import { saveMatchesToFirebase } from '../services/firebaseService';

const RISK_OPTIONS = [
  { 
    key: 'low', 
    title: 'Низкий риск', 
    description: 'Консервативный подход', 
    icon: shieldIcon,
  },
  { 
    key: 'medium', 
    title: 'Средний риск', 
    description: 'Сбалансированный подход', 
    icon: scaleIcon,
  },
  { 
    key: 'high', 
    title: 'Высокий риск', 
    description: 'Агрессивный подход', 
    icon: fireIcon,
  },
];

const StrategyScreen = () => {
  const navigate = useNavigate();

  // Проверяем, запущено ли приложение в Telegram
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    alert("Приложение должно быть открыто в Telegram WebApp");
    // Можно также отключить кнопку отправки
    const sendDataBtn = document.querySelector('.calculate-button');
    if (sendDataBtn) {
      sendDataBtn.disabled = true;
    }
    // return; // Раскомментируйте, если хотите полностью остановить работу компонента
  }

  // Доступ к выбранным матчам из контекста
  const { selectedMatches } = useContext(SelectedMatchesContext);
  const matchesCount = selectedMatches.length; 

  const [selectedRisk, setSelectedRisk] = useState('medium');
  const [budget, setBudget] = useState(0); 

  const [isFocused, setIsFocused] = useState(false); 
  const inputRef = useRef(null); 

  const [isLoading, setIsLoading] = useState(false);

  // Если 0 матчей, возвращаем на первую страницу
  useEffect(() => {
    if (matchesCount === 0) {
      // navigate('/');
    }
  }, [matchesCount]);

  const handleRiskSelect = (riskKey) => {
    setSelectedRisk(riskKey);
  };

  const handleBudgetChange = (event) => {
    const value = event.target.value;
    // Разрешаем только цифры
    if (/^\d*$/.test(value)) {
      const val = Math.round(value);
      setBudget(val);
    }
  };

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
        const chatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "6045806877";
        
        // Сохраняем в Firebase
        const predictionId = await saveMatchesToFirebase(
            selectedMatches,
            budget,
            selectedRisk,
            chatId.toString()
        );
        
        console.log('Прогноз сохранен в Firebase с ID:', predictionId);

        // Отправляем в Telegram
        await sendMatchesToTelegram(
            selectedMatches,
            budget,
            selectedRisk,
            chatId.toString()
        );
        
        // Успешное сохранение
        navigate('/request-accepted');
        
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.");
    } finally {
        setIsLoading(false);
    }
  };

  const currentRisk = RISK_OPTIONS.find(r => r.key === selectedRisk);

  // Состояние для модального окна
  const [isModalVisible, setIsModalVisible] = useState(false);

  const openModal = () => {
    setIsModalVisible(true);
  };
  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Управляем прокруткой при открытии модалки
  useEffect(() => {
    if (isModalVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isModalVisible]);


  // Прокрутка поля ввода при фокусе (на мобильных устройствах)
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isFocused]);

  return (
    <div className={`container ${isFocused ? 'focused' : ''}`}>
      <div className="scroll-content">
        <h1 className="header-title">Настройте свою стратегию</h1>
        <p className="sub-header-text">
          Настройте стратегию и проанализируйте бюджет
        </p>

        {/* Выбор матчей */}
        <div className="section">
          <h2 className="section-title">Вы выбрали {matchesCount} матчей</h2>
          <button 
            className="edit-matches-button"
            onClick={openModal}
          >
            <div className="edit-gradient">
              <span className="edit-matches-button-text">Изменить матчи</span>
            </div>
          </button>
          <p className="hint-text">
            Чем больше матчей, тем шире возможности прогноза.
          </p>
        </div>


        {/* Выбор уровня риска */}
        <div className="section">
          <h2 className="section-title">Выберите уровень подхода</h2>
          <div className="risk-container">
            {RISK_OPTIONS.map(r => (
              <div 
                key={r.key}
                className={`risk-card ${selectedRisk === r.key ? 'selected-risk-card' : ''}`}
                onClick={() => handleRiskSelect(r.key)}
              >
                <div className="risk-icon">
                  <img 
                    src={r.icon} 
                    alt={r.key}
                    className="risk-icon-img" 
                  />
                </div>
                <h3 className="risk-title">{r.title}</h3>
                <p className="risk-description">{r.description}</p>
              </div>
            ))}
          </div>
          <p className="chosen-risk-text">
            Выбран: {currentRisk ? currentRisk.title : ''}
          </p>
        </div>

        {/* Бюджет */}
        <div className="section">
          <h2 className="section-title">Укажите ваш бюджет</h2>
          <div className="budget-container">
            <input
              type="number"
              className="budget-input"
              value={budget === 0 ? '' : budget}
              onChange={handleBudgetChange}
              placeholder="0"
              inputMode="numeric"
              pattern="[0-9]*"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              ref={inputRef}
              aria-label="Введите ваш бюджет"
            />
            <span className="currency-text">₽</span>
          </div>
          
          {/* Контейнер для слайдера */}
          <div className="slider-container">
            {/* Градиентная линия слайдера */}
            <div className="gradient-slider-track"></div>
            {/* Ползунок слайдера */}
            <input
              type="range"
              className="slider"
              min="0"
              max="100000"
              step="500"
              value={budget}
              onChange={handleBudgetChange}
            />
          </div>

          {/* Метки слайдера */}
          <div className="slider-labels">
            <span className="slider-label">0 ₽</span>
            <span className="slider-label">100 000 ₽</span>
          </div>
          <p className="hint-text">Сумма будет распределена по выбранным матчам.</p>
        </div>


        {/* Кнопка "Рассчитать прогноз" */}
        <button 
          className={`calculate-button ${budget === 0 || isLoading ? 'calculate-button-disabled' : ''}`} 
          onClick={handleCalculate}
          disabled={budget === 0 || isLoading}
        >
          <div className="calculate-gradient">
            <span className="calculate-button-text">
              {isLoading ? 'Отправка...' : 'Рассчитать прогноз'}
            </span>
          </div>
        </button>

        {/* Информация о текущем выборе */}
        <p className="selection-info">
          Выбран {currentRisk ? currentRisk.description.toLowerCase() : '...'}.
          Бюджет: {budget.toLocaleString('ru-RU')} ₽.
        </p>

      </div>

      {/* Модальное окно редактирования матчей */}
      <EditMatchesModal
        isVisible={isModalVisible}
        onClose={closeModal}
      />
    </div>
  );
};

export default StrategyScreen;
