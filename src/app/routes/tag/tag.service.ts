import prisma from '../../../prisma/prisma-client';

const getTags = async (): Promise<string[]> => {
  const tags = await prisma.tag.findMany({
    select: {
      name: true,
    },
    take: 20, 
  });

  return tags.map((tag) => tag.name);
};

export default {
  getTags,
};
