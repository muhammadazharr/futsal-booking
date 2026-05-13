import api from './api';
import type { Branch } from '../types';

const BRANCH_ENDPOINTS = {
  BRANCHES: '/admin/branches',
  BRANCH_DETAIL: (branchId: string) => `/admin/branches/${branchId}`,
};

export const branchService = {
  /**
   * Get list of branches
   * Note: Using admin endpoint for now, adjust if there's a public endpoint
   */
  async getBranches(): Promise<Branch[]> {
    const response = await api.get<{ data: Branch[] } | Branch[]>(
      BRANCH_ENDPOINTS.BRANCHES
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Branch[];
  },

  /**
   * Get branch detail
   */
  async getBranchDetail(branchId: string): Promise<Branch> {
    const response = await api.get<{ data: Branch } | Branch>(
      BRANCH_ENDPOINTS.BRANCH_DETAIL(branchId)
    );
    return 'data' in response.data && response.data.data 
      ? response.data.data 
      : response.data as Branch;
  },
};
