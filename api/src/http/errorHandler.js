const { DomainError } = require('../modules/orders/errors');

const HTTP_STATUS_BY_CODE = Object.freeze({
  INVALID_TRANSITION: 409,
  ORDER_NOT_FOUND: 404,
  UNKNOWN_ACTION: 404,
  INVALID_ORDER_ID: 400,
  INVALID_STATUS_FILTER: 400,
  INVALID_JSON: 400,
  ROUTE_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
});

const errorBody = (code, message, details) => ({
  error: details === undefined ? { code, message } : { code, message, details },
});

function notFoundHandler(req, res) {
  res
    .status(HTTP_STATUS_BY_CODE.ROUTE_NOT_FOUND)
    .json(errorBody('ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// Express recognises error middleware by its 4-argument signature.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof DomainError && HTTP_STATUS_BY_CODE[err.code]) {
    return res
      .status(HTTP_STATUS_BY_CODE[err.code])
      .json(errorBody(err.code, err.message, err.details));
  }
  if (err.type === 'entity.parse.failed') {
    return res
      .status(HTTP_STATUS_BY_CODE.INVALID_JSON)
      .json(errorBody('INVALID_JSON', 'Request body is not valid JSON'));
  }
  console.error(err);
  return res
    .status(HTTP_STATUS_BY_CODE.INTERNAL_ERROR)
    .json(errorBody('INTERNAL_ERROR', 'Unexpected server error'));
}

module.exports = { errorHandler, notFoundHandler, HTTP_STATUS_BY_CODE };
