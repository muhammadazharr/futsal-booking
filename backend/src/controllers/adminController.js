const branchRepository = require('../repositories/branchRepository');
const fieldRepository = require('../repositories/fieldRepository');
const slotRepository = require('../repositories/slotRepository');
const pricingRepository = require('../repositories/pricingRepository');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const bookingService = require('../services/bookingService');
const { successResponse, createdResponse, paginatedResponse } = require('../utils/response');
const { parsePagination } = require('../utils/helpers');
const { sseManager } = require('../services/sse/sseManager');

const adminController = {
  // ============ BRANCHES ============
  
  async getBranches(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const result = await branchRepository.findAll(activeOnly);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getBranchById(req, res, next) {
    try {
      const result = await branchRepository.findById(req.params.branchId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async createBranch(req, res, next) {
    try {
      const result = await branchRepository.create(req.body);
      return createdResponse(res, result, 'Branch created');
    } catch (error) {
      next(error);
    }
  },

  async updateBranch(req, res, next) {
    try {
      const result = await branchRepository.update(req.params.branchId, req.body);
      return successResponse(res, result, 'Branch updated');
    } catch (error) {
      next(error);
    }
  },

  async deleteBranch(req, res, next) {
    try {
      await branchRepository.delete(req.params.branchId);
      return successResponse(res, null, 'Branch deactivated');
    } catch (error) {
      next(error);
    }
  },

  // ============ FIELDS ============
  
  async getFields(req, res, next) {
    try {
      const { branchId } = req.query;
      const activeOnly = req.query.activeOnly !== 'false';
      const result = await fieldRepository.findAll(branchId, activeOnly);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getFieldById(req, res, next) {
    try {
      const result = await fieldRepository.findById(req.params.fieldId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async createField(req, res, next) {
    try {
      const result = await fieldRepository.create(req.body);
      return createdResponse(res, result, 'Field created');
    } catch (error) {
      next(error);
    }
  },

  async updateField(req, res, next) {
    try {
      const result = await fieldRepository.update(req.params.fieldId, req.body);
      return successResponse(res, result, 'Field updated');
    } catch (error) {
      next(error);
    }
  },

  async deleteField(req, res, next) {
    try {
      await fieldRepository.delete(req.params.fieldId);
      return successResponse(res, null, 'Field deactivated');
    } catch (error) {
      next(error);
    }
  },

  // ============ TIME SLOTS ============
  
  async getSlots(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly !== 'false';
      const result = await slotRepository.findAll(activeOnly);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getSlotById(req, res, next) {
    try {
      const result = await slotRepository.findById(req.params.slotId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async createSlot(req, res, next) {
    try {
      const result = await slotRepository.create(req.body);
      return createdResponse(res, result, 'Time slot created');
    } catch (error) {
      next(error);
    }
  },

  async updateSlot(req, res, next) {
    try {
      const result = await slotRepository.update(req.params.slotId, req.body);
      return successResponse(res, result, 'Time slot updated');
    } catch (error) {
      next(error);
    }
  },

  async deleteSlot(req, res, next) {
    try {
      await slotRepository.delete(req.params.slotId);
      return successResponse(res, null, 'Time slot deactivated');
    } catch (error) {
      next(error);
    }
  },

  // ============ PRICING ============
  
  async getPricing(req, res, next) {
    try {
      const { fieldId } = req.query;
      const result = await pricingRepository.findAll(fieldId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getPricingById(req, res, next) {
    try {
      const result = await pricingRepository.findById(req.params.pricingId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async upsertPricing(req, res, next) {
    try {
      const result = await pricingRepository.upsert(req.body);
      return successResponse(res, result, 'Pricing saved');
    } catch (error) {
      next(error);
    }
  },

  async deletePricing(req, res, next) {
    try {
      await pricingRepository.delete(req.params.pricingId);
      return successResponse(res, null, 'Pricing deleted');
    } catch (error) {
      next(error);
    }
  },

  // ============ USERS ============
  
  async getUsers(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const [users, total] = await Promise.all([
        userRepository.findAll({ limit, offset }),
        userRepository.count()
      ]);
      return paginatedResponse(res, users, { page, limit, total });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const result = await userRepository.findWithRoles(req.params.userId);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async assignUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      await userRepository.assignRole(userId, roleId);
      return successResponse(res, null, 'Role assigned');
    } catch (error) {
      next(error);
    }
  },

  async removeUserRole(req, res, next) {
    try {
      const { userId, roleId } = req.params;
      await userRepository.removeRole(userId, parseInt(roleId));
      return successResponse(res, null, 'Role removed');
    } catch (error) {
      next(error);
    }
  },

  // ============ ROLES & PERMISSIONS ============
  
  async getRoles(req, res, next) {
    try {
      const result = await roleRepository.findAll();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  async getPermissions(req, res, next) {
    try {
      const result = await roleRepository.findAllPermissions();
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  },

  // ============ DASHBOARD ============
  
  async getDashboard(req, res, next) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's booking stats
      const [
        totalUsers,
        todayBookings,
        sseClients
      ] = await Promise.all([
        userRepository.count(),
        bookingService.getAllBookings({
          page: 1, limit: 100, offset: 0,
          startDate: today, endDate: today
        }),
        sseManager.getClientCount()
      ]);

      return successResponse(res, {
        totalUsers,
        todayBookingsCount: todayBookings.pagination.total,
        connectedClients: sseClients,
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  },

  // ============ SSE DEBUG ============
  
  async getSseClients(req, res, next) {
    try {
      const clients = sseManager.getClientInfo();
      return successResponse(res, {
        count: clients.length,
        clients
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;
