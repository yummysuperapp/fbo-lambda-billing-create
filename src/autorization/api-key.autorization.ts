import { AppConfig } from '@/types';

export function isAuthorized(config: AppConfig, apiKey?: string): boolean | null {
	if (!apiKey) return null;

	return apiKey === config.finance.apiKey;
}
