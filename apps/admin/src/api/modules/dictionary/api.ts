export const API_ADMIN_DICTIONARIES = '/dictionaries';

export const getAdminDictionaryApi = (id: number): string => `/dictionaries/${id}`;

export const getAdminDictionaryItemsApi = (dictionaryId: number): string => `/dictionaries/${dictionaryId}/items`;

export const getAdminDictionaryItemApi = (dictionaryId: number, itemId: number): string =>
  `/dictionaries/${dictionaryId}/items/${itemId}`;
