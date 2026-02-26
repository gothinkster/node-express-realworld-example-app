import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import HttpException from '../app/models/http-exception.model'; 

export const validateUserRegistration = [
  body('user.username')
    .isLength({ min: 3, max: 20 })
    .withMessage('username must be 3-20 characters'),
  body('user.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('email must be valid'),
  body('user.password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpException(422, { errors: errors.mapped() });
    }
    next();
  }
];

export const validateUserLogin = [
  body('user.email').isEmail().normalizeEmail(),
  body('user.password').notEmpty(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpException(422, { errors: errors.mapped() });
    }
    next();
  }
];
