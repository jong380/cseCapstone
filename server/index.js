// Require the necessary modules
require('dotenv').config();
const express = require('express');
const messagesRouter = require('./routes/messages');

// Create express app and parse incoming JSON requests
const app = express();
app.use(express.json());

// Route all messages to messages router
app.use('/messages', messagesRouter);

// Start the Nodi Database server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nodi backend running on port ${PORT}`);
});