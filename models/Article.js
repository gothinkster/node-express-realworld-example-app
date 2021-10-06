const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const slug = require('slug');

const User = mongoose.model('User');

const ArticleSchema = new mongoose.Schema(
  {
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true },
);

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' });

ArticleSchema.pre('validate', (next) => {
  if (!this.slug) {
    this.slugify();
  }

  next();
});

ArticleSchema.methods.slugify = () => {
  this.slug = `${slug(this.title)}-${(
    (Math.random() * Math.pow(36, 6))
    | 0
  ).toString(36)}`;
};

ArticleSchema.methods.updateFavoriteCount = () => {
  const article = this;

  return User.count({ favorites: { $in: [article._id] } }).then((count) => {
    article.favoritesCount = count;

    return article.save();
  });
};

ArticleSchema.methods.toJSONFor = (user) => ({
  slug: this.slug,
  title: this.title,
  description: this.description,
  body: this.body,
  createdAt: this.createdAt,
  updatedAt: this.updatedAt,
  tagList: this.tagList,
  favorited: user ? user.isFavorite(this._id) : false,
  favoritesCount: this.favoritesCount,
  author: this.author.toProfileJSONFor(user),
});

mongoose.model('Article', ArticleSchema);
