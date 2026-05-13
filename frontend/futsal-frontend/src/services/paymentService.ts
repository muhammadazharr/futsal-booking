import api from './api';
import type { InitiatePaymentResponse, Payment } from '../types';

const PAYMENT_ENDPOINTS = {
  INITIATE: (bookingId: string) => `/payments/${bookingId}/initiate`,
  PAYMENTS: '/payments',
  PAYMENT_DETAIL: (paymentId: string) => `/payments/${paymentId}`,
};

export const paymentService = {
  /**
   * Initiate payment for a booking
   */
  async initiatePayment(bookingId: string): Promise<InitiatePaymentResponse> {
    const response = await api.post<{ data: InitiatePaymentResponse } | InitiatePaymentResponse>(
      PAYMENT_ENDPOINTS.INITIATE(bookingId)
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as InitiatePaymentResponse;
  },

  /**
   * Get payment history
   */
  async getPayments(): Promise<Payment[]> {
    const response = await api.get<{ data: Payment[] } | Payment[]>(
      PAYMENT_ENDPOINTS.PAYMENTS
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Payment[];
  },

  /**
   * Get payment detail
   */
  async getPaymentDetail(paymentId: string): Promise<Payment> {
    const response = await api.get<{ data: Payment } | Payment>(
      PAYMENT_ENDPOINTS.PAYMENT_DETAIL(paymentId)
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Payment;
  },
};
