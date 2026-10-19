const ERROR_CODES = Object.freeze({
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  UNKNOWN_ACTION: 'UNKNOWN_ACTION',
  UNKNOWN_ORDER_TYPE: 'UNKNOWN_ORDER_TYPE',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  INVALID_ORDER_ID: 'INVALID_ORDER_ID',
  INVALID_STATUS_FILTER: 'INVALID_STATUS_FILTER',
});

class DomainError extends Error {
  constructor(code, message = code, details = undefined) {
    if (!Object.values(ERROR_CODES).includes(code)) {
      throw new TypeError(`Unregistered domain error code: ${code}`);
    }
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

module.exports = { DomainError, ERROR_CODES };
