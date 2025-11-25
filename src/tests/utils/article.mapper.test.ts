import articleMapper from '../../app/routes/article/article.mapper';

describe('ArticleMapper', () => {
  describe('viewCount field', () => {
    test('should include viewCount in mapped article', () => {
      // Given
      const article = {
        id: 1,
        slug: 'test-article-123',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: [{ name: 'test' }, { name: 'javascript' }],
        createdAt: new Date('2025-11-25T10:00:00.000Z'),
        updatedAt: new Date('2025-11-25T10:00:00.000Z'),
        favoritedBy: [],
        viewCount: 42,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'https://example.com/avatar.jpg',
          followedBy: [],
        },
      };

      // When
      const result = articleMapper(article, undefined);

      // Then
      expect(result).toEqual({
        slug: 'test-article-123',
        title: 'Test Article',
        description: 'Test description',
        body: 'Test body content',
        tagList: ['test', 'javascript'],
        createdAt: new Date('2025-11-25T10:00:00.000Z'),
        updatedAt: new Date('2025-11-25T10:00:00.000Z'),
        favorited: false,
        favoritesCount: 0,
        viewCount: 42,
        author: {
          username: 'testuser',
          bio: 'Test bio',
          image: 'https://example.com/avatar.jpg',
          following: false,
        },
      });
    });

    test('should include viewCount of 0 for new articles', () => {
      // Given
      const article = {
        id: 2,
        slug: 'new-article-456',
        title: 'New Article',
        description: 'New description',
        body: 'New body content',
        tagList: [],
        createdAt: new Date('2025-11-25T11:00:00.000Z'),
        updatedAt: new Date('2025-11-25T11:00:00.000Z'),
        favoritedBy: [],
        viewCount: 0,
        author: {
          username: 'newuser',
          bio: null,
          image: 'https://example.com/default.jpg',
          followedBy: [],
        },
      };

      // When
      const result = articleMapper(article, undefined);

      // Then
      expect(result.viewCount).toBe(0);
      expect(result).toHaveProperty('viewCount');
    });

    test('should include viewCount for favorited article', () => {
      // Given
      const userId = 5;
      const article = {
        id: 3,
        slug: 'popular-article-789',
        title: 'Popular Article',
        description: 'Popular description',
        body: 'Popular body content',
        tagList: [{ name: 'trending' }],
        createdAt: new Date('2025-11-20T10:00:00.000Z'),
        updatedAt: new Date('2025-11-20T10:00:00.000Z'),
        favoritedBy: [{ id: 5 }, { id: 7 }, { id: 9 }],
        viewCount: 1523,
        author: {
          username: 'popularuser',
          bio: 'Popular author',
          image: 'https://example.com/popular.jpg',
          followedBy: [{ id: 5 }],
        },
      };

      // When
      const result = articleMapper(article, userId);

      // Then
      expect(result.viewCount).toBe(1523);
      expect(result.favorited).toBe(true);
      expect(result.favoritesCount).toBe(3);
      expect(result.author.following).toBe(true);
    });

    test('should handle viewCount with large numbers', () => {
      // Given
      const article = {
        id: 4,
        slug: 'viral-article-999',
        title: 'Viral Article',
        description: 'Gone viral',
        body: 'Viral content',
        tagList: [],
        createdAt: new Date('2025-11-01T10:00:00.000Z'),
        updatedAt: new Date('2025-11-01T10:00:00.000Z'),
        favoritedBy: [],
        viewCount: 999999,
        author: {
          username: 'viraluser',
          bio: 'Content creator',
          image: 'https://example.com/viral.jpg',
          followedBy: [],
        },
      };

      // When
      const result = articleMapper(article, undefined);

      // Then
      expect(result.viewCount).toBe(999999);
      expect(typeof result.viewCount).toBe('number');
    });
  });

  describe('existing mapper functionality', () => {
    test('should maintain existing field mapping', () => {
      // Given
      const article = {
        id: 10,
        slug: 'existing-test',
        title: 'Existing Test',
        description: 'Testing existing fields',
        body: 'Body content',
        tagList: [{ name: 'test' }],
        createdAt: new Date('2025-11-25T12:00:00.000Z'),
        updatedAt: new Date('2025-11-25T12:00:00.000Z'),
        favoritedBy: [],
        viewCount: 10,
        author: {
          username: 'testauthor',
          bio: 'Author bio',
          image: null,
          followedBy: [],
        },
      };

      // When
      const result = articleMapper(article, undefined);

      // Then
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('body');
      expect(result).toHaveProperty('tagList');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
      expect(result).toHaveProperty('favorited');
      expect(result).toHaveProperty('favoritesCount');
      expect(result).toHaveProperty('viewCount');
      expect(result).toHaveProperty('author');
    });
  });
});
