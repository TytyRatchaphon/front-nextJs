import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/services/**/*.ts', 'src/stores/**/*.ts', 'src/utils/**/*.ts', 'src/hooks/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__mocks__/**',
        'src/**/index.ts',
        'src/services/apiServices.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
