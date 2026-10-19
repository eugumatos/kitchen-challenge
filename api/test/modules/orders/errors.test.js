const { DomainError, ERROR_CODES } = require('../../../src/modules/orders/errors');

describe('DomainError', () => {
  test('exposes stable codes', () => {
    expect(ERROR_CODES.INVALID_TRANSITION).toBe('INVALID_TRANSITION');
    expect(ERROR_CODES.UNKNOWN_ACTION).toBe('UNKNOWN_ACTION');
    expect(Object.isFrozen(ERROR_CODES)).toBe(true);
  });

  test('is an Error with code, message and details', () => {
    const err = new DomainError(ERROR_CODES.UNKNOWN_ACTION, 'nope', { action: 'x' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('DomainError');
    expect(err.code).toBe('UNKNOWN_ACTION');
    expect(err.message).toBe('nope');
    expect(err.details).toEqual({ action: 'x' });
  });

  test('rejects codes that are not registered', () => {
    expect(() => new DomainError('MADE_UP')).toThrow(TypeError);
  });
});
