import { jest } from '@jest/globals';

// Test environment defaults. config.ts requires these at import time.
process.env.EXPO_PUBLIC_API_URL ??= 'http://localhost:8000';
process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??= 'pk_test_jest';

// Native keyboard tracking isn't available in Jest; use the library's own mock.
jest.mock('react-native-keyboard-controller', () =>
  jest.requireActual('react-native-keyboard-controller/jest'),
);
