// Test environment defaults. config.ts requires these at import time.
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:8000';
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??= 'pk_test_jest';
