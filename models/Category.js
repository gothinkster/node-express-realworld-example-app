const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const CategorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      trim: true,
      unique: true,
      uniqueCaseInsensitive: true,
      required: [true, 'is required.'],
    },
    description: String,
    articles: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

CategorySchema.plugin(uniqueValidator, { message: 'already exists.' });

CategorySchema.methods.toJSONFor = function (user) {
  return {
    categoryName: this.categoryName,
    description: this.description,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    createdBy: this.createdBy.toProfileJSONFor(user),
    articles: this.articles,
  };
};

mongoose.model('Category', CategorySchema);
