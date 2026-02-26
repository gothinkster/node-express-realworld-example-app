import rateLimit from 'express-rate-limit';

interface ApiRateLimitError {
  errors: Array<{ message: string }>;
}


export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: {
    errors: [{ message: 'Too many API requests from this IP. Please wait 15 minutes.' }]
  } as ApiRateLimitError,
  standardHeaders: true,
  legacyHeaders: false,
});
