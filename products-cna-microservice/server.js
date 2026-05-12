require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(require('./routes/record'));

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server is running on port: ' + PORT);
});
