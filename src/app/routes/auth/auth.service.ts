import * as bcrypt from 'bcryptjs';
import { RegisterInput } from './register-input.model';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import { RegisteredUser } from './registered-user.model';
import generateToken from './token.utils';
import profileMapper from '../profile/profile.utils';

const checkUserUniqueness = async (email: string, username: string) => {
  const existingUserByEmail = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (existingUserByEmail || existingUserByUsername) {
    throw new HttpException(422, {
      errors: {
        ...(existingUserByEmail ? { email: ['has already been taken'] } : {}),
        ...(existingUserByUsername ? { username: ['has already been taken'] } : {}),
      },
    });
  }
};

export const createUser = async (input: RegisterInput): Promise<RegisteredUser> => {
  const email = input.email?.trim();
  const username = input.username?.trim();
  const password = input.password?.trim();
  const { image, bio, demo } = input;

  if (!email || !username || !password) {
    throw new HttpException(422, { errors: { field: ["can't be blank"] } });
  }

  await checkUserUniqueness(email, username);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
      ...(demo ? { demo } : {}),
    },
    include: { followedBy: true },
  });

  return {
    id: user.id,
    email: user.email,
    ...profileMapper(user, user.id),
    token: generateToken(user.id),
  };
};

export const login = async (userPayload: any) => {
  const email = userPayload.email?.trim();
  const password = userPayload.password?.trim();

  if (!email || !password) {
    throw new HttpException(422, { errors: { field: ["can't be blank"] } });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { followedBy: true },
  });

  if (user) {
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return {
        id: user.id,
        email: user.email,
        ...profileMapper(user, user.id),
        token: generateToken(user.id),
      };
    }
  }

  throw new HttpException(403, {
    errors: { 'email or password': ['is invalid'] },
  });
};

export const getCurrentUser = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { followedBy: true },
  });

  if (!user) throw new HttpException(404, { errors: { user: ['not found'] } });

  return {
    id: user.id,
    email: user.email,
    ...profileMapper(user, id),
    token: generateToken(user.id),
  };
};

export const updateUser = async (userPayload: any, id: number) => {
  const { email, username, password, image, bio } = userPayload;
  let hashedPassword;

  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email ? { email } : {}),
      ...(username ? { username } : {}),
      ...(password ? { password: hashedPassword } : {}),
      ...(image ? { image } : {}),
      ...(bio ? { bio } : {}),
    },
    include: { followedBy: true },
  });

  return {
    id: user.id,
    email: user.email,
    ...profileMapper(user, id),
    token: generateToken(user.id),
  };
};
