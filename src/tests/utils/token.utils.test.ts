import * as express from 'express';
import generateToken, { getTokenFromHeaders } from '../../app/routes/auth/token.utils';

describe('TokenUtils', () => {
  describe('getTokenFromHeaders', () => {
    test('should return token when Authorization header uses Token scheme', () => {
      const req = {
        headers: {
          authorization: 'Token some.jwt.token',
        },
      } as unknown as express.Request;

      expect(getTokenFromHeaders(req)).toBe('some.jwt.token');
    });

    test('should return token when Authorization header uses Bearer scheme', () => {
      const req = {
        headers: {
          authorization: 'Bearer some.jwt.token',
        },
      } as unknown as express.Request;

      expect(getTokenFromHeaders(req)).toBe('some.jwt.token');
    });

    test('should return null when Authorization header is missing', () => {
      const req = {
        headers: {},
      } as unknown as express.Request;

      expect(getTokenFromHeaders(req)).toBeNull();
    });

    test('should return null when Authorization header uses an unsupported scheme', () => {
      const req = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      } as unknown as express.Request;

      expect(getTokenFromHeaders(req)).toBeNull();
    });
  });

  describe('generateToken', () => {
    test('should generate a non-empty string token', () => {
      const token = generateToken(123);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });
});
