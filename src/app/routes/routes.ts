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

export default Router()
  .get('/health', (req, res) => {
    res.status(200).json({
      status: 'UP',
      team: 'Group 36',
      uptime: process.uptime(),
      timestamp: new Date()
  });
})
.use('/api', api);
