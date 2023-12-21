import prisma from '../../../prisma/prisma-client';
import profileMapper from './profile.utils';
import HttpException from '../../shared/http-exception.model';
import { findUserIdByUsername } from '../auth/auth.service';

export const getProfile = async (usernamePayload: string, usernameAuth?: string) => {
  const profile = await prisma.user.findUnique({
    where: {
      username: usernamePayload,
    },
    include: {
      followedBy: true,
    },
  });

  if (!profile) {
    throw new HttpException(404, {});
  }

  return profileMapper(profile, usernameAuth);
};

export const followUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id } = await findUserIdByUsername(usernameAuth);

  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followedBy: {
        connect: {
          id,
        },
      },
    },
    include: {
      followedBy: true,
    },
  });

  return profileMapper(profile, usernameAuth);
};

export const unfollowUser = async (usernamePayload: string, usernameAuth: string) => {
  const { id } = await findUserIdByUsername(usernameAuth);

  const profile = await prisma.user.update({
    where: {
      username: usernamePayload,
    },
    data: {
      followedBy: {
        disconnect: {
          id,
        },
      },
    },
    include: {
      followedBy: true,
    },
  });

  return profileMapper(profile, usernameAuth);
};
