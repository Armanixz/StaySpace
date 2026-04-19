const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/properties', require('./routes/property'));
app.use('/api/tenant', require('./routes/tenant'));
app.use('/api/reviews', require('./routes/review'));
// NOTIFICATION FEATURE — Add appointment routes
app.use('/api/appointments', require('./routes/appointment'));
// REPORTING FEATURE — Add report routes
app.use('/api/reports', require('./routes/report'));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
