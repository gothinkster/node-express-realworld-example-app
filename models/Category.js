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

CategorySchema.methods.toJSONFor = function (user) {
  return {
    name: this.name,
    description: this.description,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    createdBy: this.createdBy.toProfileJSONFor(user),
    articles: this.articles,
  };
};

mongoose.model('Category', CategorySchema);
