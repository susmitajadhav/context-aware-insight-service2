// FILE: src/utils/mock-ai-server.js

import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());


// Mock AI Endpoint

app.post('/mock-ai', async (req, res) => {
  const { queryText, context } = req.body;

  if (!context) {
    return res.status(400).json({
      error: 'Missing context',
    });
  }

  // Simulate delay
  const delay = parseInt(process.env.AI_DELAY_MS) || 200;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Simulate failure
  const failureRate = parseFloat(process.env.AI_FAILURE_RATE) || 0;
  const shouldFail = Math.random() < failureRate;

  if (shouldFail) {
    return res.status(500).json({
      error: 'Simulated AI failure',
    });
  }

  return res.json({
    insight: `Insight for "${queryText}" in ${context.industry} (${context.region})`,
  });
});


// Start server

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`🤖 Mock AI running on port ${PORT}`);
});