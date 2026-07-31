import { NextFunction, Request, Response, Router } from 'express';
import auth from '../auth/auth';
import tagService from './tag.service';

const router = Router();

/**
 * Get popular tags
 * @route {GET} /api/tags
 */
router.get('/tags', auth.optional, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await tagService.getTags();
    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

export default router;
