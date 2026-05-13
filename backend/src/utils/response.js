/**
 * Standard API response format
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const createdResponse = (res, data = null, message = 'Created successfully') => {
  return successResponse(res, data, message, 201);
};

const noContentResponse = (res) => {
  return res.status(204).send();
};

const errorResponse = (res, message = 'Error', statusCode = 500, code = null, errors = null) => {
  const response = {
    success: false,
    message,
    code
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    }
  });
};

module.exports = {
  successResponse,
  createdResponse,
  noContentResponse,
  errorResponse,
  paginatedResponse
};
