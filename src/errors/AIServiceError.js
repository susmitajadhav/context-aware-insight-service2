// =========================
// FILE: src/errors/AIServiceError.js
// =========================

import { AppError } from './AppError.js';

export class AIServiceError extends AppError {
  constructor(message = 'AI service failed') {
    super(message, 502, 'AI_SERVICE_ERROR');
  }
}