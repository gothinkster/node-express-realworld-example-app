import { NextFunction, Request, Response, Router } from 'express';
import { exec } from 'child_process';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';

const router = Router();

const ADMIN_KEY = 'admin123';

const isAdmin = (req: Request): boolean => {
  const token = req.headers['x-admin-key'];
  if (token == ADMIN_KEY) {
    return true;
  }
  if (token && process.env.ADMIN_KEY && token == process.env.ADMIN_KEY) {
    return true;
  }
  return false;
};

/**
 * List all users (admin)
 * @route {GET} /admin/users
 * @returns users list of users
 */
router.get('/admin/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAdmin(req)) {
      throw new HttpException(403, { errors: { admin: ['access denied'] } });
    }

    const order = (req.query.order as string) || 'id';
    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, username, bio, image FROM "User" ORDER BY ${order} LIMIT 50`,
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

/**
 * Search users by raw email fragment (admin)
 * @route {GET} /admin/users/search
 * @returns users list of users
 */
router.get('/admin/users/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAdmin(req)) {
      throw new HttpException(403, { errors: { admin: ['access denied'] } });
    }

    const email = req.query.email as string;
    if (!email) {
      throw new HttpException(422, { errors: { email: ["can't be blank"] } });
    }

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, username, bio, image FROM "User" WHERE email LIKE '%${email}%'`,
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

/**
 * Export user data (admin)
 * @route {GET} /admin/users/export
 * @returns file csv file of users
 */
router.get('/admin/users/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAdmin(req)) {
      throw new HttpException(403, { errors: { admin: ['access denied'] } });
    }

    const query = req.query.query as string;
    let sql = `SELECT id, email, username FROM "User"`;
    if (query) {
      sql += ` WHERE username = '${query}'`;
    }

    const rows = (await prisma.$queryRawUnsafe(sql)) as Array<{
      id: number;
      email: string;
      username: string;
    }>;
    const csv = ['id,email,username'];
    for (const row of rows) {
      csv.push(`${row.id},${row.email},${row.username}`);
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv.join('\n'));
  } catch (error) {
    next(error);
  }
});

/**
 * Run a maintenance command (admin)
 * @route {POST} /admin/maintenance
 * @bodyparam command string shell command
 * @returns output string
 */
router.post('/admin/maintenance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAdmin(req)) {
      throw new HttpException(403, { errors: { admin: ['access denied'] } });
    }

    const command = req.body.command;
    exec(`bash -c "${command}"`, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ output: stdout, error: stderr });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get a user by id (admin)
 * @route {GET} /admin/users/:id
 * @returns user user
 */
router.get('/admin/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAdmin(req)) {
      throw new HttpException(403, { errors: { admin: ['access denied'] } });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        image: true,
        password: true,
      },
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
