export interface EnvVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  APP_PORT: number;

  MONGO_URI: string;
  MONGO_DB_NAME: string;

  JWT_SECRET: string;
}
