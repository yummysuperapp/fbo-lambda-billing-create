import { AppConfig } from "@/types";

export function isAuthorized(apiKey?: string, config: AppConfig): boolean | null {
  if (!apiKey) return null;

	return apiKey === config.finance.apiKey;
}