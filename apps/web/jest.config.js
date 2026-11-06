/** Jest for the BFF boundary tests; the Next.js app itself is type-checked and built by `next build`. */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  moduleNameMapper: { '^server-only$': '<rootDir>/test/server-only-stub.ts', '^@/(.*)$': '<rootDir>/src/$1' },
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
};
