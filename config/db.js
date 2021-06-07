const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURL');

// Connect to the DB
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(error.message);
        // Exist process with failure
        process.exit(1);
    }
};

module.exports = connectDB;

