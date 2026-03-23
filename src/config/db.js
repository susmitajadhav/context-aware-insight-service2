
// FILE: src/config/db.js


import pkg from 'pg';
const { Pool } = pkg;

import { env } from './env.js';

const pool = new Pool({
  user: env.db.user,
  host: env.db.host,
  database: env.db.name,
  password: String(env.db.password),
  port: Number(env.db.port),
});

export default pool;