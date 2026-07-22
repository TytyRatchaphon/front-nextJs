import apiClient from "../apiClient";
import { warnApiFallback } from "./apiFallback";

// --- Types ---

export interface CollectionBook {
  book_id: number;
  parent_book_id: number | null;
  content_type: string;
  name: string;
  title: string;
  img: string;
  rate: number;
  user_id: number;
  view: number;
  end: string;
  status: string;
  tag: string[];
  date_at: string;
  img_full: string;
  bgimg: string | null;
  writer_name: string;
  chapter: number;
  shelve_count: number;
  isBestSeller: boolean;
  isNew: boolean;
  isNewEp: boolean;
  discount: number | null;
  time_end: string | null;
  discount_ep_count: number | null;
  collection_book_id: number;
  collection_id: number;
  order_index: number;
  is_hidden: boolean;
}

export interface CollectionItem {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  cover_image: string | null;
  is_pinned: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  book_count: number;
  like_count?: number;
  is_liked?: boolean;
  owner?: {
    user_id: number;
    writer_name: string;
    fullname: string;
    img: string | null;
    banner: string | null;
  };
  books?: CollectionBook[];
}

export interface CollectionReplyData {
  id: number;
  comment_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  is_mine: boolean;
  user: {
    user_id: number;
    fullname: string;
    img: string | null;
    frame_img: string | null;
  };
}

export interface CollectionCommentData {
  id: number;
  collection_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  is_mine: boolean;
  replies: CollectionReplyData[];
  user: {
    user_id: number;
    fullname: string;
    img: string | null;
    frame_img: string | null;
  };
}

export interface CollectionCommentResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
  comments: CollectionCommentData[];
}

export interface CollectionsResponse {
  code: number;
  status: string;
  message: string;
  data: CollectionItem[];
}

export interface CollectionDetailResponse {
  code: number;
  status: string;
  message: string;
  data: {
    collection: CollectionItem;
    books: CollectionBook[];
  };
}

export interface CollectionLikeResponse {
  liked: boolean;
  like_count: number;
}

export interface CollectionPickerItem extends CollectionItem {
  contains_book: boolean;
  collection_book_id: number | null;
  book_order_index: number | null;
  is_hidden: boolean | null;
}

export interface CollectionPickerResponse {
  book_id: number;
  existing_collection_ids: number[];
  collections: CollectionPickerItem[];
}

export interface BulkAddResult {
  collection_id: number;
  status: "added" | "already_exists" | "not_found" | "invalid_owner";
  collection_book_id?: number;
  book_order_index?: number;
  is_hidden?: boolean;
}

export interface BulkAddResponse {
  book_id: number;
  results: BulkAddResult[];
  summary: {
    requested: number;
    added: number;
    already_exists: number;
    not_found: number;
    invalid_owner: number;
  };
}

export interface CreateAndAddResponse {
  collection: CollectionItem;
  collection_book: {
    id: number;
    collection_id: number;
    book_id: number;
    order_index: number;
    is_hidden: boolean;
  };
}

// --- API Functions ---

/** GET /user/collections — fetch all user collections */
export const fetchUserCollections = async (): Promise<CollectionItem[] | null> => {
  try {
    const response = await apiClient.get<CollectionsResponse>('/user/collections');
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    warnApiFallback('/user/collections', 'null', response.data);
    return null;
  } catch (error) {
    warnApiFallback('/user/collections', 'null', error);
    return null;
  }
};

/** GET /user/collections/:id — fetch books in a collection */
export const fetchCollectionBooks = async (
  collectionId: number
): Promise<{ collection: CollectionItem; books: CollectionBook[] } | null> => {
  try {
    const response = await apiClient.get<CollectionDetailResponse>(`/user/collections/${collectionId}`);
    const payload = response.data?.data;
    if (payload && payload.collection && Array.isArray(payload.books)) return payload;
    
    // Legacy fallback check just in case API hasn't been updated yet
    if (Array.isArray(payload)) {
      console.warn("API returned old format for collection detail, adapting locally...");
      return {
        collection: { id: collectionId, name: 'Collection', description: '', is_public: false, cover_image: null, is_pinned: false, order_index: 0, created_at: '', updated_at: '', book_count: payload.length },
        books: payload
      };
    }
    
    warnApiFallback(`/user/collections/${collectionId}`, 'null', response.data);
    return null;
  } catch (error) {
    warnApiFallback(`/user/collections/${collectionId}`, 'null', error);
    return null;
  }
};

/** POST /user/collections — create a new collection (form-data) */
export const createCollection = async (data: {
  name: string;
  description: string;
  is_public: boolean;
  cover_image?: File | null;
}): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('is_public', String(data.is_public));
    if (data.cover_image) {
      formData.append('cover_image', data.cover_image);
    }
    const response = await apiClient.post('/user/collections', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error('createCollection error:', error);
    throw error;
  }
};

/** POST /user/collections/:id/books — add books to a collection */
export const addBooksToCollection = async (
  collectionId: number,
  bookIds: string[]
): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/collections/${collectionId}/books`, {
      book_ids: bookIds,
    });
    return response.data;
  } catch (error: any) {
    console.error('addBooksToCollection error:', error);
    throw error;
  }
};

/** POST /user/collections/:id/like — like or unlike a collection */
export const likeCollection = async (
  collectionId: number
): Promise<CollectionLikeResponse> => {
  try {
    const response = await apiClient.post(`/user/collections/${collectionId}/like`);
    return response.data?.data;
  } catch (error: any) {
    console.error('likeCollection error:', error);
    throw error;
  }
};

/** GET /user/collections/book/:bookId/picker — fetch collection picker for a book */
export const fetchCollectionPicker = async (
  bookId: number
): Promise<CollectionPickerResponse> => {
  try {
    const response = await apiClient.get(`/user/collections/book/${bookId}/picker`);
    return response.data?.data;
  } catch (error: any) {
    console.error('fetchCollectionPicker error:', error);
    throw error;
  }
};

/** POST /user/collections/book/:bookId/bulk-add — add a book to multiple collections */
export const bulkAddBookToCollections = async (
  bookId: number,
  collectionIds: number[]
): Promise<BulkAddResponse> => {
  try {
    const response = await apiClient.post(`/user/collections/book/${bookId}/bulk-add`, {
      collection_ids: collectionIds,
    });
    return response.data?.data;
  } catch (error: any) {
    console.error('bulkAddBookToCollections error:', error);
    throw error;
  }
};

/** POST /user/collections/book/:bookId/create-and-add — create collection and add a book */
export const createAndAddCollection = async (
  bookId: number,
  data: {
    name: string;
    description: string;
    is_public: boolean;
    cover_image?: File | null;
  }
): Promise<CreateAndAddResponse> => {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('is_public', String(data.is_public));
    if (data.cover_image) {
      formData.append('cover_image', data.cover_image);
    }
    
    const response = await apiClient.post(`/user/collections/book/${bookId}/create-and-add`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.data;
  } catch (error: any) {
    console.error('createAndAddCollection error:', error);
    throw error;
  }
};

/** PATCH /user/collections/:id — update collection (pin, name, etc.) */
export const updateCollection = async (
  collectionId: number,
  data: {
    name?: string;
    description?: string;
    is_public?: boolean;
    is_pinned?: boolean;
  }
): Promise<any> => {
  try {
    const response = await apiClient.patch(`/user/collections/${collectionId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('updateCollection error:', error);
    throw error;
  }
};

/** PUT /user/collections-reorder — reorder collections */
export const reorderCollections = async (
  collectionIds: number[]
): Promise<any> => {
  try {
    const response = await apiClient.put('/user/collections-reorder', {
      items: collectionIds,
    });
    return response.data;
  } catch (error: any) {
    console.error('reorderCollections error:', error);
    throw error;
  }
};

/** PUT /user/collections-pin — pin/unpin collections */
export const pinCollections = async (
  collectionIds: number[],
  is_pinned: boolean
): Promise<any> => {
  try {
    const response = await apiClient.put('/user/collections-pin', {
      ids: collectionIds,
      is_pinned,
    });
    return response.data;
  } catch (error: any) {
    console.error('pinCollections error:', error);
    throw error;
  }
};

/** DELETE /user/collections — delete collections */
export const deleteCollection = async (
  collectionId: number
): Promise<any> => {
  try {
    const response = await apiClient.delete('/user/collections', {
      data: { ids: [collectionId] }
    });
    return response.data;
  } catch (error: any) {
    console.error('deleteCollection error:', error);
    throw error;
  }
};

/** DELETE /user/collections/:id/books — remove books from a collection */
export const removeBookFromCollection = async (
  collectionId: number,
  bookIds: number[]
): Promise<any> => {
  try {
    const response = await apiClient.delete(`/user/collections/${collectionId}/books`, {
      data: { book_ids: bookIds },
    });
    return response.data;
  } catch (error: any) {
    console.error('removeBookFromCollection error:', error);
    throw error;
  }
};

// --- Collection Comments APIs ---

/** GET /user/collections/:id/comments — fetch comments for a collection */
export const fetchCollectionComments = async (
  collectionId: number | string,
  page: number = 1,
  limit: number = 20
): Promise<CollectionCommentResponse> => {
  try {
    const response = await apiClient.get<{ code: number; data: CollectionCommentResponse }>(
      `/user/collections/${collectionId}/comments`,
      { params: { page, limit } }
    );
    return response.data.data;
  } catch (error: any) {
    console.error('fetchCollectionComments error:', error);
    throw error;
  }
};

/** POST /user/collections/:id/comments — post a new comment */
export const postCollectionComment = async (
  collectionId: number | string,
  comment: string
): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/collections/${collectionId}/comments`, { comment });
    return response.data;
  } catch (error: any) {
    console.error('postCollectionComment error:', error);
    throw error;
  }
};

/** POST /user/collections/:id/comments/:commentId/reply — reply to a comment */
export const postCollectionReply = async (
  collectionId: number | string,
  commentId: number | string,
  comment: string
): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/collections/${collectionId}/comments/${commentId}/reply`, { comment });
    return response.data;
  } catch (error: any) {
    console.error('postCollectionReply error:', error);
    throw error;
  }
};

/** DELETE /user/collections/:id/comments/:commentId — delete a comment */
export const deleteCollectionComment = async (
  collectionId: number | string,
  commentId: number | string
): Promise<any> => {
  try {
    const response = await apiClient.delete(`/user/collections/${collectionId}/comments/${commentId}`);
    return response.data;
  } catch (error: any) {
    console.error('deleteCollectionComment error:', error);
    throw error;
  }
};

/** DELETE /user/collections/:id/comments/:commentId/reply/:replyId — delete a reply */
export const deleteCollectionReply = async (
  collectionId: number | string,
  commentId: number | string,
  replyId: number | string
): Promise<any> => {
  try {
    const response = await apiClient.delete(`/user/collections/${collectionId}/comments/${commentId}/reply/${replyId}`);
    return response.data;
  } catch (error: any) {
    console.error('deleteCollectionReply error:', error);
    throw error;
  }
};

/** POST /user/comments/:commentId/report — report a comment */
export const reportCollectionComment = async (commentId: number | string): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/comments/${commentId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('reportCollectionComment error:', error);
    throw error;
  }
};

/** POST /user/replies/:replyId/report — report a reply */
export const reportCollectionReply = async (replyId: number | string): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/replies/${replyId}/report`);
    return response.data;
  } catch (error: any) {
    console.error('reportCollectionReply error:', error);
    throw error;
  }
};

/** PUT /user/collections/:id/books-reorder — reorder books in a collection */
export const reorderBooksInCollection = async (
  collectionId: number,
  bookIds: number[]
): Promise<any> => {
  try {
    const response = await apiClient.put(`/user/collections/${collectionId}/books-reorder`, {
      items: bookIds,
    });
    return response.data;
  } catch (error: any) {
    console.error('reorderBooksInCollection error:', error);
    throw error;
  }
};

/** PUT /user/collections/:id/books/visibility — hide or unhide books */
export const updateBookVisibility = async (
  collectionId: number,
  bookIds: number[],
  is_hidden: boolean
): Promise<any> => {
  try {
    const response = await apiClient.put(`/user/collections/${collectionId}/books/visibility`, {
      book_ids: bookIds,
      is_hidden: is_hidden
    });
    return response.data;
  } catch (error: any) {
    console.error('updateBookVisibility error:', error);
    throw error;
  }
};

/** GET /user/collections/:id/hidden — get hidden books */
export const fetchHiddenBooks = async (
  collectionId: number
): Promise<CollectionBook[] | null> => {
  try {
    const response = await apiClient.get<{ code: number; status: string; message: string; data: CollectionBook[] }>(`/user/collections/${collectionId}/hidden`);
    const payload = response.data?.data;
    if (Array.isArray(payload)) return payload;
    warnApiFallback(`/user/collections/${collectionId}/hidden`, 'null', response.data);
    return null;
  } catch (error: any) {
    warnApiFallback(`/user/collections/${collectionId}/hidden`, 'null', error);
    return null;
  }
};

/** PUT /user/collections/:id — update collection details (multipart) */
export const updateCollectionDetails = async (
  collectionId: number,
  data: {
    name: string;
    description: string;
    is_public: boolean;
    cover_image?: File | null;
  }
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('is_public', String(data.is_public));
    if (data.cover_image) {
      formData.append('cover_image', data.cover_image);
    }

    const response = await apiClient.put(`/user/collections/${collectionId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: any) {
    console.error('updateCollectionDetails error:', error);
    throw error;
  }
};

/** POST /user/collections/:id/copy — copy a public collection to my collections */
export const copyCollection = async (collectionId: number | string): Promise<any> => {
  try {
    const response = await apiClient.post(`/user/collections/${collectionId}/copy`);
    return response.data;
  } catch (error: any) {
    console.error('copyCollection error:', error);
    throw error;
  }
};
