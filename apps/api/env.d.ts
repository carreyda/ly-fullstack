declare namespace NodeJS {
  interface ProcessEnv {
    APP_ENV?: 'development' | 'test' | 'production';
  }
}
