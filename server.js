const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();


const app = express();
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));


app.get('/', (req, res) => {
  res.send('FantasyNG API is running...');
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
