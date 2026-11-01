import request from 'supertest';
import app from '../../app';
import prisma from '../../prisma/prisma-client';

export const api = () => request(app);

export const resetDatabase = () =>
  prisma.$executeRawUnsafe('TRUNCATE "User", "Article", "Comment", "Tag" RESTART IDENTITY CASCADE');

export const disconnect = () => prisma.$disconnect();

export const registerUser = async (username = 'joao') => {
  const res = await api()
    .post('/api/users')
    .send({
      user: { username, email: `${username}@teste.com`, password: 'senha-forte-123' },
    })
    .expect(201);
  return res.body.user.token as string;
};
