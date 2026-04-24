import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../prisma/prisma-client', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

import prisma from '../../prisma/prisma-client';
import {
  deleteComment,
  favoriteArticle,
  getArticles,
  unfavoriteArticle,
} from '../../app/routes/article/article.service';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('ArticleService', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  describe('getArticles sorting', () => {
    test('should use default sorting when query is empty', async () => {
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(0);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue([]);
      await getArticles({}, 1);

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    test('should fallback to default sorting for invalid sort inputs', async () => {
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(0);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue([]);

      await getArticles({ sort: 'notAField', order: 'wrongOrder' }, 1);

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    test('should apply valid sorting inputs', async () => {
      // @ts-ignore
      prismaMock.article.count.mockResolvedValue(0);
      // @ts-ignore
      prismaMock.article.findMany.mockResolvedValue([]);

      await getArticles({ sort: 'updatedAt', order: 'asc' }, 1);

      expect(prismaMock.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'asc' },
        }),
      );
    });
  });

  describe('deleteComment', () => {
    test('should throw an error ', () => {
      // Given
      const id = 123;
      const idUser = 456;

      // When
      // @ts-ignore
      prismaMock.comment.findFirst.mockResolvedValue(null);

      // Then
      expect(deleteComment(id, idUser)).rejects.toThrowError();
    });
  });

  describe('favoriteArticle', () => {
    test('should return the favorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: '',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      // @ts-ignore
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      await expect(favoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(favoriteArticle(slug, id)).rejects.toThrowError();
    });
  });
  describe('unfavoriteArticle', () => {
    test('should return the unfavorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: '',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      await expect(unfavoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(unfavoriteArticle(slug, id)).rejects.toThrowError();
    });
  });
});
