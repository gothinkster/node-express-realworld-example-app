const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      uniqueCaseInsensitive: true,
      required: [true, "can't be blank"],
    },
    description: String,
    articles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  },
  { timestamps: true },
);

CategorySchema.plugin(uniqueValidator, { message: 'is already taken.' });

mongoose.model('Category', CategorySchema);
