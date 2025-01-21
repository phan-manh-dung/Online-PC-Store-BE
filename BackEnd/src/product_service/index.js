const express = require('express');
const mongoose = require('mongoose');
const productRoutes = require('./routes/Product_Route');
const categoryRoutes = require('./routes/Category_Route');
require('dotenv').config();

const app = express();
const port = 3000;
const mongoURI = process.env.mongoURI;

// Sử dụng middleware có sẵn trong Express để parse JSON
app.use(express.json());

mongoose
    .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    });

app.use('/api', productRoutes);
app.use('/api', categoryRoutes);

app.listen(port, () => {
    console.log(`Product Service running at http://localhost:${port}`);
});
