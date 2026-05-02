import slugify from 'slugify';
import prisma from '../../../prisma/prisma-client';
import HttpException from '../../models/http-exception.model';
import profileMapper from '../profile/profile.utils';
import articleMapper from './article.mapper';
import { Tag } from '../tag/tag.model';

const findArticleIdBySlug = async (slug: string): Promise<number | null> => {
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (article) {
    return article.id;
  }

  const slugHistory = await prisma.articleSlugHistory.findUnique({
    where: { slug },
    select: { articleId: true },
  });

  return slugHistory?.articleId || null;
};

const findArticleBySlug = async (slug: string, include: any = undefined) => {
  const articleId = await findArticleIdBySlug(slug);

  if (!articleId) {
    return null;
  }

  return prisma.article.findUnique({
    where: { id: articleId },
    include,
  });
};

const buildFindAllQuery = (query: any, id: number | undefined) => {
  const queries: any = [];
  const orAuthorQuery = [];
  const andAuthorQuery = [];

  orAuthorQuery.push({
    demo: {
      equals: true,
    },
  });

  if (id) {
    orAuthorQuery.push({
      id: {
        equals: id,
      },
    });
  }

  if ('author' in query) {
    andAuthorQuery.push({
      username: {
        equals: query.author,
      },
    });
  }

  const authorQuery = {
    author: {
      OR: orAuthorQuery,
      AND: andAuthorQuery,
    },
  };

  queries.push(authorQuery);

  if ('tag' in query) {
    queries.push({
      tagList: {
        some: {
          name: query.tag,
        },
      },
    });
  }

  if ('favorited' in query) {
    queries.push({
      favoritedBy: {
        some: {
          username: {
            equals: query.favorited,
          },
        },
      },
    });
  }

  return queries;
};

export const getArticles = async (query: any, id?: number) => {
  const andQueries = buildFindAllQuery(query, id);
  const articlesCount = await prisma.article.count({
    where: {
      AND: andQueries,
    },
  });

  const articles = await prisma.article.findMany({
    where: { AND: andQueries },
    orderBy: {
      createdAt: 'desc',
    },
    skip: Number(query.offset) || 0,
    take: Number(query.limit) || 10,
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return {
    articles: articles.map((article: any) => articleMapper(article, id)),
    articlesCount,
  };
};

export const getFeed = async (offset: number, limit: number, id: number) => {
  const articlesCount = await prisma.article.count({
    where: {
      author: {
        followedBy: { some: { id: id } },
      },
    },
  });

  const articles = await prisma.article.findMany({
    where: {
      author: {
        followedBy: { some: { id: id } },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: offset || 0,
    take: limit || 10,
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return {
    articles: articles.map((article: any) => articleMapper(article, id)),
    articlesCount,
  };
};

export const createArticle = async (article: any, id: number) => {
  const { title, description, body, tagList } = article;
  const tags = Array.isArray(tagList) ? tagList : [];

  if (!title) {
    throw new HttpException(422, { errors: { title: ["can't be blank"] } });
  }

  if (!description) {
    throw new HttpException(422, { errors: { description: ["can't be blank"] } });
  }

  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const slug = `${slugify(title)}-${id}`;

  const slugUsed = await isSlugUsed(slug);

  if (slugUsed) {
    throw new HttpException(422, { errors: { title: ['must be unique'] } });
  }

  const {
    authorId,
    id: articleId,
    ...createdArticle
  } = await prisma.article.create({
    data: {
      title,
      description,
      body,
      slug,
      tagList: {
        connectOrCreate: tags.map((tag: string) => ({
          create: { name: tag },
          where: { name: tag },
        })),
      },
      author: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  return articleMapper(createdArticle, id);
};

export const getArticle = async (slug: string, id?: number) => {
  const article = await findArticleBySlug(slug, {
    tagList: {
      select: {
        name: true,
      },
    },
    author: {
      select: {
        username: true,
        bio: true,
        image: true,
        followedBy: true,
      },
    },
    favoritedBy: true,
    _count: {
      select: {
        favoritedBy: true,
      },
    },
  });

  if (!article) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  return articleMapper(article, id);
};



const isSlugUsed = async (slug: string, excludeArticleId?: number): Promise<boolean> => {
  const existingArticle = await prisma.article.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingArticle && existingArticle.id !== excludeArticleId) {
    return true;
  }

  const existingSlugHistory = await prisma.articleSlugHistory.findUnique({
    where: { slug },
    select: { articleId: true },
  });

  if (existingSlugHistory && existingSlugHistory.articleId !== excludeArticleId) {
    return true;
  }

  return false;
};

export const updateArticle = async (article: any, slug: string, id: number) => {
  let newSlug: string | null = null;

  const articleId = await findArticleIdBySlug(slug);

  if (!articleId) {
    throw new HttpException(404, {});
  }

  const existingArticle = await prisma.article.findUnique({
    where: {
      id: articleId,
    },
    select: {
      slug: true,
      author: {
        select: {
          id: true,
          username: true,
        },
      },
      tagList: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== id) {
    throw new HttpException(403, {
      message: 'You are not authorized to update this article',
    });
  }

  const currentSlug = existingArticle.slug;

  if (article.title) {
    newSlug = `${slugify(article.title)}-${id}`;

    if (newSlug !== currentSlug) {
      const slugUsed = await isSlugUsed(newSlug, articleId);

      if (slugUsed) {
        throw new HttpException(422, { errors: { title: ['must be unique'] } });
      }
    }
  }

  const shouldUpdateTags = 'tagList' in article;
  const tagListData = shouldUpdateTags
    ? Array.isArray(article.tagList)
      ? article.tagList.map((tag: string) => ({
          create: { name: tag },
          where: { name: tag },
        }))
      : []
    : [];

  const updatedArticle = await prisma.$transaction(async (tx) => {
    if (newSlug && newSlug !== currentSlug) {
      await tx.articleSlugHistory.upsert({
        where: { slug: currentSlug },
        update: {},
        create: {
          slug: currentSlug,
          articleId: articleId,
        },
      });
    }

    const updateData: any = {
      ...(article.title ? { title: article.title } : {}),
      ...(article.body ? { body: article.body } : {}),
      ...(article.description ? { description: article.description } : {}),
      ...(newSlug ? { slug: newSlug } : {}),
      updatedAt: new Date(),
    };

    if (shouldUpdateTags) {
      const currentTags = existingArticle.tagList.map((tag: any) => tag.name);
      const newTags = Array.isArray(article.tagList) ? article.tagList : [];

      const tagsToRemove = currentTags.filter((tag: string) => !newTags.includes(tag));
      const tagsToAdd = newTags.filter((tag: string) => !currentTags.includes(tag));

      if (tagsToRemove.length > 0) {
        updateData.tagList = {
          disconnect: tagsToRemove.map((name: string) => ({ name })),
        };
      }

      if (tagsToAdd.length > 0) {
        updateData.tagList = {
          ...updateData.tagList,
          connectOrCreate: tagsToAdd.map((tag: string) => ({
            create: { name: tag },
            where: { name: tag },
          })),
        };
      }
    }

    return tx.article.update({
      where: {
        id: articleId,
      },
      data: updateData,
      include: {
        tagList: {
          select: {
            name: true,
          },
        },
        author: {
          select: {
            username: true,
            bio: true,
            image: true,
            followedBy: true,
          },
        },
        favoritedBy: true,
        _count: {
          select: {
            favoritedBy: true,
          },
        },
      },
    });
  });

  return articleMapper(updatedArticle, id);
};

export const deleteArticle = async (slug: string, id: number) => {
  const articleId = await findArticleIdBySlug(slug);

  if (!articleId) {
    throw new HttpException(404, {});
  }

  const existingArticle = await prisma.article.findUnique({
    where: {
      id: articleId,
    },
    select: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!existingArticle) {
    throw new HttpException(404, {});
  }

  if (existingArticle.author.id !== id) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this article',
    });
  }
  await prisma.article.delete({
    where: {
      id: articleId,
    },
  });
};

export const getCommentsByArticle = async (slug: string, id?: number) => {
  const queries = [];

  queries.push({
    author: {
      demo: true,
    },
  });

  if (id) {
    queries.push({
      author: {
        id,
      },
    });
  }

  const articleId = await findArticleIdBySlug(slug);

  if (!articleId) {
    return undefined;
  }

  const comments = await prisma.article.findUnique({
    where: {
      id: articleId,
    },
    include: {
      comments: {
        where: {
          OR: queries,
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          body: true,
          author: {
            select: {
              username: true,
              bio: true,
              image: true,
              followedBy: true,
            },
          },
        },
      },
    },
  });

  const result = comments?.comments.map((comment: any) => ({
    ...comment,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === id),
    },
  }));

  return result;
};

export const addComment = async (body: string, slug: string, id: number) => {
  if (!body) {
    throw new HttpException(422, { errors: { body: ["can't be blank"] } });
  }

  const articleId = await findArticleIdBySlug(slug);

  if (!articleId) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const comment = await prisma.comment.create({
    data: {
      body,
      article: {
        connect: {
          id: articleId,
        },
      },
      author: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
    },
  });

  return {
    id: comment.id,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    body: comment.body,
    author: {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,
      following: comment.author.followedBy.some((follow: any) => follow.id === id),
    },
  };
};

export const deleteComment = async (id: number, userId: number) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id,
      author: {
        id: userId,
      },
    },
    select: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!comment) {
    throw new HttpException(404, {});
  }

  if (comment.author.id !== userId) {
    throw new HttpException(403, {
      message: 'You are not authorized to delete this comment',
    });
  }

  await prisma.comment.delete({
    where: {
      id,
    },
  });
};

export const favoriteArticle = async (slugPayload: string, id: number) => {
  const articleId = await findArticleIdBySlug(slugPayload);

  if (!articleId) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const { _count, ...article } = await prisma.article.update({
    where: {
      id: articleId,
    },
    data: {
      favoritedBy: {
        connect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  const result = {
    ...article,
    author: profileMapper(article.author, id),
    tagList: article?.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
    favoritesCount: _count?.favoritedBy,
  };

  return result;
};

export const unfavoriteArticle = async (slugPayload: string, id: number) => {
  const articleId = await findArticleIdBySlug(slugPayload);

  if (!articleId) {
    throw new HttpException(404, { errors: { article: ['not found'] } });
  }

  const { _count, ...article } = await prisma.article.update({
    where: {
      id: articleId,
    },
    data: {
      favoritedBy: {
        disconnect: {
          id: id,
        },
      },
    },
    include: {
      tagList: {
        select: {
          name: true,
        },
      },
      author: {
        select: {
          username: true,
          bio: true,
          image: true,
          followedBy: true,
        },
      },
      favoritedBy: true,
      _count: {
        select: {
          favoritedBy: true,
        },
      },
    },
  });

  const result = {
    ...article,
    author: profileMapper(article.author, id),
    tagList: article?.tagList.map((tag: Tag) => tag.name),
    favorited: article.favoritedBy.some((favorited: any) => favorited.id === id),
    favoritesCount: _count?.favoritedBy,
  };

  return result;
};
