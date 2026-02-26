import { Router } from 'express';
import tagsController from './tag/tag.controller';
import articlesController from './article/article.controller';
import authController from './auth/auth.controller';
import profileController from './profile/profile.controller';
import errorHandler from '../../middleware/error-handler';

const api = Router()
  .use(tagsController)
  .use(articlesController)
  .use(profileController)
  .use(authController)
  .use((req, res) => {
    res.status(404).json({
      errors: { body: ['Not Found'] }
    });
  });

export default Router().use('/api', api, errorHandler);
