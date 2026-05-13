import api from './api';
import type { Promo, ValidatePromoRequest, ValidatePromoResponse } from '../types';

const PROMO_ENDPOINTS = {
  PROMOS: '/promos',
  VALIDATE: '/promos/validate',
};

export const promoService = {
  /**
   * Get list of active promos
   */
  async getPromos(): Promise<Promo[]> {
    const response = await api.get<{ data: Promo[] } | Promo[]>(
      PROMO_ENDPOINTS.PROMOS
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Promo[];
  },

  /**
   * Validate a promo code
   */
  async validatePromo(data: ValidatePromoRequest): Promise<ValidatePromoResponse> {
    const response = await api.post<{ data: ValidatePromoResponse } | ValidatePromoResponse>(
      PROMO_ENDPOINTS.VALIDATE,
      data
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as ValidatePromoResponse;
  },
};
