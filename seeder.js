const fs = require('fs');
const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Enable colors
colors.enable();

// Load models
const User = require('./models/User');

// Connect to DB
mongoose.connect(process.env.MONGO_URI);

// Read JSON files
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, 'utf-8')
);

// Import into DB
const importData = async () => {
  try {
    await User.create(users);
    // eslint-disable-next-line no-console
    console.log('Data Imported...'.green.inverse);
    process.exit();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

// Delete data
const deleteData = async () => {
  try {
    await User.deleteMany();
    // eslint-disable-next-line no-console
    console.log('Data Destroyed...'.red.inverse);
    process.exit();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
