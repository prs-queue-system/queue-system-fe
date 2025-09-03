export class ApiConfig {
  static getBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL;
    return (envUrl && envUrl.trim()) || 'http://localhost:3000';
  }
}