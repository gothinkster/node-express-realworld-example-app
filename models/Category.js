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
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  },
  { timestamps: true },
);

CategorySchema.plugin(uniqueValidator, { message: 'already exists.' });

mongoose.model('Category', CategorySchema);
