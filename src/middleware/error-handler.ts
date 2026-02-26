import { Request, Response, NextFunction } from 'express';

export default (error: any, req: Request, res: Response, next: NextFunction) => {
  
  if (error.name === 'ValidationError' || error.code === 11000) {
    return res.status(422).json({
      errors: {
        body: ['Duplicate username or email']
      }
    });
  }

  
  console.error('Unhandled error:', error);
  res.status(500).json({
    errors: {
      body: ['Internal server error']
    }
  });
};
