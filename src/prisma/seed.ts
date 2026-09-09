import {
  randEmail,
  randFullName,
  randLines,
  randParagraph,
  randPassword,
  randPhrase,
} from '@ngneat/falso';
import { PrismaClient } from '@prisma/client';
import { RegisteredUser } from '../app/routes/auth/registered-user.model';
import { createUser } from '../app/routes/auth/auth.service';
import {
  addComment,
  createArticle,
} from '../app/routes/article/article.service';

const prisma = new PrismaClient();

let seedArticleCounter = 0;

export const generateUser = async (): Promise<RegisteredUser> =>
  createUser({
    username: randFullName(),
    email: randEmail(),
    password: randPassword(),
    image: 'https://api.realworld.io/images/demo-avatar.png',
    demo: true,
  });

export const generateArticle = async (userId: number) => {
  const articleNumber = seedArticleCounter++;

  return createArticle(
    {
      title: `${randPhrase()} ${articleNumber}`,
      description: randParagraph(),
      body: randLines({ length: 10 }).join(' '),

      // Every tag is globally unique.
      // This prevents the Tag.name unique constraint error.
      tagList: Array.from(
        { length: 4 },
        (_, index) => `seed-tag-${articleNumber}-${index}`,
      ),
    },
    userId,
  );
};

export const generateComment = async (
  userId: number,
  articleSlug: string,
) => addComment(randParagraph(), articleSlug, userId);

const main = async () => {
  try {
    const users = await Promise.all(
      Array.from({ length: 12 }, () => generateUser()),
    );

    for (const user of users) {
      const articles = await Promise.all(
        Array.from({ length: 12 }, () => generateArticle(user.id)),
      );

      for (const article of articles) {
        await Promise.all(
          users.map((userItem) =>
            generateComment(userItem.id, article.slug),
          ),
        );
      }
    }

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

main();