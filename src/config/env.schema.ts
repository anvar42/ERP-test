import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.string(),
  APP_PORT: z.coerce.number().default(3000),

  MONGODB_URI: z.string().url(),
  MONGO_DB_NAME: z.string().min(1),

});

export type EnvSchema = z.infer<typeof envSchema>;
