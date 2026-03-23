
// FILE: src/utils/mock-ai-server.js


import express from 'express';
import { env } from '../config/env.js';

const app = express();
app.use(express.json());


// Mock AI Endpoint

app.post('/mock-ai', async (req, res) => {
  const { queryText, context } = req.body;

  //  Simulate configurable delay
  const delay = env.ai.delayMs;

  await new Promise((resolve) => setTimeout(resolve, delay));

  //  Simulate failure using env-controlled rate
  const shouldFail = Math.random() < env.ai.failureRate;

  if (shouldFail) {
    return res.status(500).json({
      error: 'Simulated AI failure',
    });
  }

  //  Success response
  return res.json({
    insight: `Insight for "${queryText}" in ${context.industry} (${context.region})`,
  });
});


// Start Mock AI Server

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`🤖 Mock AI running on port ${PORT}`);
});