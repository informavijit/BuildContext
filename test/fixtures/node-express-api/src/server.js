const express = require('express');
const app = express();

app.get('/api/v1/orders', (req, res) => {
  res.json([{ id: 101, item: 'Laptop' }]);
});

app.listen(3000, () => {
  console.log('Orders Express API listening on port 3000');
});
