const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      required: [true, 'is required.'],
    },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  },
  { timestamps: true },
);

CategorySchema.plugin(uniqueValidator, { message: 'already exists.' });

CategorySchema.methods.toJSONForArticles = function () {
  const result = [];
  for (let i = 0; i < this.articles.length; i += 1) {
    result.push(this.articles[i].toBasicJSONFor());
  }
  return result;
};

CategorySchema.methods.toJSONFor = function (user) {
  return {
    name: this.name,
    description: this.description,
    createdBy: this.createdBy.toProfileJSONFor(user),
    articles: this.toJSONForArticles(),
  };
};

CategorySchema.methods.toBasicJSONFor = function () {
  return {
    name: this.name,
    description: this.description,
  };
};

mongoose.model('Category', CategorySchema);
