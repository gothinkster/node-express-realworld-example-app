-- CreateTable
CREATE TABLE `Article` (
                           `id` INTEGER NOT NULL AUTO_INCREMENT,
                           `slug` VARCHAR(1000) NOT NULL,
                           `title` VARCHAR(1000) NOT NULL,
                           `description` VARCHAR(2000) NOT NULL,
                           `body` VARCHAR(3072) NOT NULL,
                           `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                           `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                           `authorId` INTEGER NOT NULL,

                           UNIQUE INDEX `Article_slug_key`(`slug`),
                           PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
                           `id` INTEGER NOT NULL AUTO_INCREMENT,
                           `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                           `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                           `body` VARCHAR(2000) NOT NULL,
                           `articleId` INTEGER NOT NULL,
                           `authorId` INTEGER NOT NULL,

                           PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
                       `id` INTEGER NOT NULL AUTO_INCREMENT,
                       `name` VARCHAR(191) NOT NULL,

                       UNIQUE INDEX `Tag_name_key`(`name`),
                       PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
                        `id` INTEGER NOT NULL AUTO_INCREMENT,
                        `email` VARCHAR(191) NOT NULL,
                        `username` VARCHAR(191) NOT NULL,
                        `password` VARCHAR(191) NOT NULL,
                        `image` VARCHAR(191) NULL DEFAULT 'https://api.realworld.io/images/smiley-cyrus.jpeg',
                        `bio` VARCHAR(2000) NULL,
                        `demo` BOOLEAN NOT NULL DEFAULT false,

                        UNIQUE INDEX `User_email_key`(`email`),
                        UNIQUE INDEX `User_username_key`(`username`),
                        PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ArticleToTag` (
                                 `A` INTEGER NOT NULL,
                                 `B` INTEGER NOT NULL,

                                 UNIQUE INDEX `_ArticleToTag_AB_unique`(`A`, `B`),
                                 INDEX `_ArticleToTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserFavorites` (
                                  `A` INTEGER NOT NULL,
                                  `B` INTEGER NOT NULL,

                                  UNIQUE INDEX `_UserFavorites_AB_unique`(`A`, `B`),
                                  INDEX `_UserFavorites_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserFollows` (
                                `A` INTEGER NOT NULL,
                                `B` INTEGER NOT NULL,

                                UNIQUE INDEX `_UserFollows_AB_unique`(`A`, `B`),
                                INDEX `_UserFollows_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
