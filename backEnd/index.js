require('dotenv').config();
const express = require('express');
const messagesRouter = require('./routes/messages');

const app = express();
app.use(express.json());

app.use('/messages', messagesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nodi backend running on port ${PORT}`);
});