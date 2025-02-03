import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { activateSubscription } from '../services/subscriptionService';
import { createPayment, checkPaymentStatus } from '../services/paymentService';
import "./SubscriptionScreen.css";

function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, есть ли в URL параметры от ЮKassa
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    
    if (paymentId) {
      // Проверяем статус платежа
      const checkPayment = async () => {
        try {
          const status = await checkPaymentStatus(paymentId);
          if (status.status === 'succeeded') {
            // Платеж успешен, перенаправляем на главную
            navigate('/');
          }
        } catch (error) {
          console.error('Ошибка при проверке платежа:', error);
        }
      };
      
      checkPayment();
    }
  }, [navigate]);

  // Получаем сумму в зависимости от плана
  const getPlanAmount = (plan) => {
    switch (plan) {
      case 'oneWeek':
        return 189;
      case 'oneMonth':
        return 389;
      case 'sixMonths':
        return 2099;
      default:
        return 0;
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert('Пожалуйста, выберите тариф');
      return;
    }

    setIsProcessing(true);
    try {
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || "6045806877";
      const amount = getPlanAmount(selectedPlan);

      // Создаем платеж в ЮKassa
      const payment = await createPayment(amount, userId, selectedPlan);
      
      // Открываем форму оплаты
      const telegram = window.Telegram?.WebApp;
      if (telegram) {
        telegram.openLink(payment.confirmation.confirmation_url);
      }
    } catch (error) {
      console.error('Ошибка при оплате:', error);
      alert('Произошла ошибка при обработке оплаты');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="gradient-background">
      <div className="container">
        {/* Логотип */}
        <div className="logo">Match AI</div>

        {/* Заголовок и подзаголовок */}
        <div className="title">
          Подписка завершена – продлите, чтобы продолжить
        </div>
        <div className="subtitle">
          В любой тариф входит безлимитный доступ к аналитике на период пользования.
        </div>

        {/* Обёртка для карточек */}
        <div className="cards-container">
          {/* Карточка: 1 неделя */}
          <div
            className={`card ${selectedPlan === "oneWeek" ? "card-center" : ""}`}
            onClick={() => setSelectedPlan("oneWeek")}
          >
            <div className="card-tag">Новинка</div>
            <div className="card-title">1 неделя</div>
            <div className="card-weekly-price">189₽/нед.</div>
            <div className="card-price">189₽</div>
          </div>

          {/* Карточка: 1 месяц */}
          <div
            className={`card ${selectedPlan === "oneMonth" ? "card-center" : ""}`}
            onClick={() => setSelectedPlan("oneMonth")}
          >
            <div className="card-subtitle">1 месяц</div>
            <div className="card-weekly-price">389₽/мес.</div>
            <div className="card-weekly-note">~97.25₽/нед.</div>
            <div className="card-discount">-49%</div>
            <div className="card-price">389₽</div>
          </div>

          {/* Карточка: 6 месяцев */}
          <div
            className={`card ${selectedPlan === "sixMonths" ? "card-center" : ""}`}
            onClick={() => setSelectedPlan("sixMonths")}
          >
            <div className="card-tag">Самый популярный</div>
            <div className="card-title">6 месяцев</div>
            <div className="card-weekly-price">2099₽/6 мес.</div>
            <div className="card-weekly-note">~87.46₽/нед.</div>
            <div className="card-discount">-54%</div>
            <div className="card-price">2099₽</div>
          </div>
        </div>

        {/* Кнопка "Перейти к оплате" */}
        <button 
          className={`continue-button ${isProcessing ? 'processing' : ''}`}
          onClick={handlePayment}
          disabled={!selectedPlan || isProcessing}
        >
          <span className="continue-text">
            {isProcessing ? 'Обработка...' : 'Перейти к оплате'}
          </span>
        </button>

        {/* Нижний текст */}
        <div className="terms">Match AI</div>
      </div>
    </div>
  );
}

export default SubscriptionScreen;
