import prisma from '../../../prisma/prisma-client';

export const getTags = async (id?: number): Promise<string[]> => {
  const tags = await prisma.tag.findMany({
    select: {
      name: true,
    },
    orderBy: {
      articles: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return tags.map((tag) => tag.name);
};
