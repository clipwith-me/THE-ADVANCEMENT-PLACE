// Runs before every test file (and before the modules under test are imported).
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgresql://tap:tap@localhost:5432/tap_test?schema=public";
process.env.SESSION_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.APP_URL = "http://localhost:3000";
process.env.LOG_LEVEL = "error";
