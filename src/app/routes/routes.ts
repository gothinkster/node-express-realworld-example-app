import { Router } from 'express';
import tagsController from './tag/tag.controller';
import articlesController from './article/article.controller';
import authController from './auth/auth.controller';
import profileController from './profile/profile.controller';

const api = Router()
  .use(tagsController)
  .use(articlesController)
  .use(profileController)
  .use(authController);

export default Router().use('/api', api);
