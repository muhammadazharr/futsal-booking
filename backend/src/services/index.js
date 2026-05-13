module.exports = {
  authService: require('./authService'),
  bookingService: require('./bookingService'),
  paymentService: require('./paymentService'),
  membershipService: require('./membershipService'),
  promoService: require('./promoService'),
  sseManager: require('./sse/sseManager').sseManager
};
