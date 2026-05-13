const { DAY_TYPE, DISCOUNT_TYPE } = require('../config/constants');

/**
 * Determine if a date is weekend or weekday
 */
const getDayType = (date) => {
  const day = new Date(date).getDay();
  // 0 = Sunday, 6 = Saturday
  return (day === 0 || day === 6) ? DAY_TYPE.WEEKEND : DAY_TYPE.WEEKDAY;
};

/**
 * Calculate discount amount
 */
const calculateDiscount = (price, discountType, discountValue) => {
  if (discountType === DISCOUNT_TYPE.PERCENTAGE) {
    return (price * discountValue) / 100;
  }
  return discountValue;
};

/**
 * Calculate final price with membership and promo discounts
 * Order: base_price → membership discount → promo discount
 */
const calculateFinalPrice = (basePrice, membershipDiscount = null, promoDiscount = null) => {
  let price = basePrice;
  let membershipDiscountAmount = 0;
  let promoDiscountAmount = 0;

  // Apply membership discount first
  if (membershipDiscount) {
    membershipDiscountAmount = calculateDiscount(
      price,
      membershipDiscount.discount_type,
      membershipDiscount.discount_value
    );
    price -= membershipDiscountAmount;
  }

  // Apply promo discount after membership
  if (promoDiscount) {
    promoDiscountAmount = calculateDiscount(
      price,
      promoDiscount.discount_type,
      promoDiscount.discount_value
    );
    price -= promoDiscountAmount;
  }

  // Ensure price is not negative or zero
  if (price <= 0) {
    price = 1; // Minimum price
    promoDiscountAmount = basePrice - membershipDiscountAmount - 1;
  }

  return {
    basePrice,
    membershipDiscountAmount: Math.round(membershipDiscountAmount * 100) / 100,
    promoDiscountAmount: Math.round(promoDiscountAmount * 100) / 100,
    finalPrice: Math.round(price * 100) / 100
  };
};

/**
 * Calculate DP amount (50% of final price)
 */
const calculateDP = (finalPrice) => {
  return Math.round((finalPrice * 0.5) * 100) / 100;
};

/**
 * Check if reschedule is allowed (2 hours before play time)
 */
const isRescheduleAllowed = (bookingDate, slotStartTime, deadlineHours = 2) => {
  const playDateTime = new Date(`${bookingDate}T${slotStartTime}`);
  const now = new Date();
  const deadline = new Date(playDateTime.getTime() - (deadlineHours * 60 * 60 * 1000));
  return now < deadline;
};

/**
 * Generate random alphanumeric string
 */
const generateRandomString = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Parse pagination params
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  getDayType,
  calculateDiscount,
  calculateFinalPrice,
  calculateDP,
  isRescheduleAllowed,
  generateRandomString,
  parsePagination
};
