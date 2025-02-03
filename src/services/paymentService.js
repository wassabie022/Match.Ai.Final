import axios from 'axios';

const API_URL = 'https://europe-west1-mini-ao-c2901.cloudfunctions.net/api';

export const createPayment = async (amount, userId, plan) => {
  try {
    const response = await axios.post(`${API_URL}/create-payment`, {
      amount,
      userId,
      plan
    });

    return response.data;
  } catch (error) {
    console.error('Ошибка при создании платежа:', error);
    throw error;
  }
};

export const checkPaymentStatus = async (paymentId) => {
  try {
    const response = await axios.get(`${API_URL}/check-payment/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Ошибка при проверке платежа:', error);
    throw error;
  }
}; 