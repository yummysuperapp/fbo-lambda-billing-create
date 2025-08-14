import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
		exclude: ['node_modules/**', 'dist/**', 'build/**', 'tests/__mocks__/**', 'tests/__fixtures__/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'lcov', 'html'],
			exclude: [
				'node_modules/**',
				'tests/**',
				'scripts/**',
				'dist/**',
				'build/**',
				'src/@types/**',
				'src/interfaces/**',
				'src/constants/**',
				'src/**/index.ts',
				'src/**/*.config.ts',
				'**/*.d.ts',
				'vitest.config.ts',
				'eslint.config.js',
				'index.js',
			],
			thresholds: {
				global: {
					branches: 100,
					functions: 100,
					lines: 100,
					statements: 100,
				},
			},
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'@/clients': path.resolve(__dirname, './src/clients'),
			'@/services': path.resolve(__dirname, './src/services'),
			'@/utils': path.resolve(__dirname, './src/utils'),
			'@/interfaces': path.resolve(__dirname, './src/interfaces'),
			'@/types': path.resolve(__dirname, './src/@types'),
			'@tests': path.resolve(__dirname, './tests'),
			'@mocks': path.resolve(__dirname, './tests/__mocks__'),
			'@fixtures': path.resolve(__dirname, './tests/__fixtures__'),
		},
	},
});
