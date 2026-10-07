const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acxiom_crm';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`Connected to MongoDB at ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
