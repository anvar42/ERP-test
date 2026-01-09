import { Injectable } from '@nestjs/common';
import { config } from 'dotenv';
import { envSchema, EnvSchema } from './env.schema';

@Injectable()
export class ConfigService {
  private readonly env: EnvSchema;

  constructor() {
    config();

    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error('ENV VALIDATION ERROR');
      console.error(parsed.error.format());
      process.exit(1);
    }

    this.env = parsed.data;
  }

  get<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
    return this.env[key];
  }
}
