export type SearchResultType = 'product' | 'service' | 'client' | 'vehicle' | 'serviceOrder';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface SearchFilters {
  types: SearchResultType[];
  query: string;
}
