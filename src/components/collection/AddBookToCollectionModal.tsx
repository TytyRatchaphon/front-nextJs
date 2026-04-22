'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Modal, Input, Button, Tabs, Empty, Pagination, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserShelve, fetchUserShelveContinue, fetchUserShelveBuy, addBooksToCollection } from '@/services/apiServices';
import apiClient from '@/services/apiClient';
import { resolveBookCoverImageSrc } from '@/utils/imageUtils';

interface AddBookToCollectionModalProps {
  open: boolean;
  onClose: () => void;
  collectionId: number;
  existingBookIds: Set<number>;
}

interface Category {
  id: number;
  name: string;
}

interface SearchFilters {
  query: string;
  categories: number[];
  types: string[];
  content_type: string[];
  end: string;
}

// Search API helper (same pattern as SearchClient.tsx)
const searchBooksApi = async (filters: SearchFilters, page: number, limit: number) => {
  const params = new URLSearchParams();
  if (filters.query) params.append('q', filters.query);
  if (filters.categories.length > 0) params.append('categories', filters.categories.join(','));
  if (filters.types.length > 0) params.append('types', filters.types.join(','));
  if (filters.content_type.length > 0) params.append('content_type', filters.content_type.join(','));
  if (filters.end && filters.end !== 'all') params.append('end', filters.end);
  params.append('sortBy', 'date_at');
  params.append('order', 'DESC');
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  const response = await apiClient.get(`/book/search?${params.toString()}`);
  const data = response.data;
  if (data.code === 200 && data.data) {
    return data.data;
  }
  throw new Error('Invalid response format');
};

// Shared book row component
function BookRow({
  book,
  isSelected,
  onToggle,
}: {
  book: any;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const imgSrc = (() => {
    return resolveBookCoverImageSrc(book, '/images/ejb.png');
  })();

  const name = book.name || book.title || book.bookname || 'ไม่มีชื่อ';
  const author = book.writer_name || book['writer.writer_name'] || book.user_name || book.author || '';
  const chapter = book.chapter ?? book.chapters ?? 0;
  const view = book.view ?? 0;

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-4 p-3 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-red-500 bg-red-50'
          : 'border-gray-100 hover:border-gray-200 bg-white'
      }`}
    >
      <div className="w-14 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
        <Image src={imgSrc} alt={name} fill className="object-cover" unoptimized />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-gray-900 truncate">{name}</h4>
        <p className="text-xs text-gray-400">{author}</p>
        <p className="text-xs text-gray-400 mt-1">
          {chapter} ตอน · {Number(view).toLocaleString()} วิว
        </p>
      </div>
      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          isSelected ? 'border-red-500 bg-red-500' : 'border-gray-300'
        }`}
      >
        {isSelected && (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  );
}

function getBookId(book: any): string {
  return String(book.book_id || book.bookID || book.id || '');
}

// --- Filter Chip Component ---
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:bg-red-100 rounded-full p-0.5">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" />
        </svg>
      </button>
    </span>
  );
}

// --- Search Tab with filters ---
function SearchAllTab({
  existingBookIds,
  selectedBookIds,
  toggleSelect,
}: {
  existingBookIds: Set<number>;
  selectedBookIds: Set<string>;
  toggleSelect: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    types: [],
    content_type: [],
    end: 'all',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/category')
      .then((r) => r.json())
      .then((data) => {
        if (data.code === 200 && data.data) setCategories(data.data);
        else if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Committed search (only when user clicks search or presses Enter)
  const [committed, setCommitted] = useState(false);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ['collectionSearchAll', filters, page],
    queryFn: () => searchBooksApi(filters, page, 20),
    enabled: committed,
  });

  const books = useMemo(() => {
    const items = searchData?.items ?? [];
    return items.filter((b: any) => {
      const id = Number(b.book_id || b.bookID || b.id);
      return !existingBookIds.has(id);
    });
  }, [searchData, existingBookIds]);
  const total = searchData?.total ?? 0;

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, query: searchQuery }));
    setPage(1);
    setCommitted(true);
  };

  const toggleCategory = (id: number) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((c) => c !== id)
        : [...prev.categories, id],
    }));
  };

  const toggleType = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(val)
        ? prev.types.filter((t) => t !== val)
        : [...prev.types, val],
    }));
  };

  const toggleContentType = (val: string) => {
    setFilters((prev) => ({
      ...prev,
      content_type: prev.content_type.includes(val)
        ? prev.content_type.filter((t) => t !== val)
        : [...prev.content_type, val],
    }));
  };

  const setEnd = (val: string) => {
    setFilters((prev) => ({ ...prev, end: val }));
  };

  // Trigger search when filters change (if already committed)
  useEffect(() => {
    if (committed) {
      setPage(1);
    }
  }, [filters.categories, filters.types, filters.content_type, filters.end]);

  // Active filter chips
  const activeFilters = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    filters.categories.forEach((cid) => {
      const cat = categories.find((c) => c.id === cid);
      chips.push({
        label: cat?.name || `#${cid}`,
        onRemove: () => toggleCategory(cid),
      });
    });
    filters.types.forEach((t) => {
      const labels: Record<string, string> = { tran: 'นิยายแปล', chat: 'นิยายแต่ง', fan: 'แฟนฟิค', redroom: 'เรดรูม' };
      chips.push({ label: labels[t] || t, onRemove: () => toggleType(t) });
    });
    filters.content_type.forEach((t) => {
      const labels: Record<string, string> = { novel: 'นิยายรายตอน', novel_pack: 'นิยายมัดแพ็ค' };
      chips.push({ label: labels[t] || t, onRemove: () => toggleContentType(t) });
    });
    if (filters.end !== 'all') {
      chips.push({
        label: filters.end === 'end' ? 'จบแล้ว' : 'ยังไม่จบ',
        onRemove: () => setEnd('all'),
      });
    }
    return chips;
  }, [filters, categories]);

  const clearAllFilters = () => {
    setFilters({ query: '', categories: [], types: [], content_type: [], end: 'all' });
    setSearchQuery('');
    setCommitted(false);
  };

  return (
    <div>
      {/* Search Box */}
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="พิมพ์ชื่อหนังสือเพื่อค้นหา..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onPressEnter={handleSearch}
          size="middle"
          allowClear
          prefix={<SearchOutlined className="text-gray-400" />}
        />
        <Button
          type="primary"
          onClick={handleSearch}
          style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
        >
          ค้นหา
        </Button>
      </div>

      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          ตัวกรอง
          {activeFilters.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilters.length}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {activeFilters.length > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600">
            ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {activeFilters.map((f, i) => (
            <FilterChip key={i} label={f.label} onRemove={f.onRemove} />
          ))}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100 max-h-[250px] overflow-y-auto">
          {/* หมวดหมู่ */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">หมวดหมู่</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.categories.includes(cat.id)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* ประเภทเนื้อหา */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">ประเภทเนื้อหา</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'novel', label: 'นิยายรายตอน' },
                { value: 'novel_pack', label: 'นิยายมัดแพ็ค' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => toggleContentType(item.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.content_type.includes(item.value)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* รูปแบบ */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">รูปแบบ</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'tran', label: 'นิยายแปล' },
                { value: 'chat', label: 'นิยายแต่ง' },
                { value: 'fan', label: 'แฟนฟิค' },
                { value: 'redroom', label: 'เรดรูม' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => toggleType(item.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.types.includes(item.value)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* สถานะเรื่อง */}
          <div>
            <p className="text-sm font-medium mb-2">สถานะเรื่อง</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'ทั้งหมด' },
                { value: 'end', label: 'จบแล้ว' },
                { value: 'notend', label: 'ยังไม่จบ' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setEnd(item.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    filters.end === item.value
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {!committed ? (
        <div className="py-8 text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">พิมพ์ชื่อหนังสือหรือเลือกตัวกรองเพื่อค้นหา</p>
        </div>
      ) : (
        <>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
            </div>
          ) : books.length === 0 ? (
            <Empty description="ไม่พบหนังสือ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">พบ {total} รายการ</p>
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {books.map((book: any) => {
                  const bookId = getBookId(book);
                  return (
                    <BookRow
                      key={bookId}
                      book={book}
                      isSelected={selectedBookIds.has(bookId)}
                      onToggle={() => toggleSelect(bookId)}
                    />
                  );
                })}
              </div>
              {total > 20 && (
                <div className="flex justify-center mt-3">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={20}
                    onChange={(p) => setPage(p)}
                    showSizeChanger={false}
                    size="small"
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function AddBookToCollectionModal({
  open,
  onClose,
  collectionId,
  existingBookIds,
}: AddBookToCollectionModalProps) {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();

  const [activeTab, setActiveTab] = useState('shelve');
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

  // Per-tab local search text
  const [shelveSearch, setShelveSearch] = useState('');
  const [continueSearch, setContinueSearch] = useState('');
  const [buySearch, setBuySearch] = useState('');

  // Shelve pagination
  const [shelvePage, setShelvePage] = useState(1);
  const [continuePage, setContinuePage] = useState(1);
  const [buyPage, setBuyPage] = useState(1);

  const PAGE_SIZE = 20;

  // --- Queries ---

  const { data: shelveData, isLoading: shelveLoading } = useQuery({
    queryKey: ['collectionShelve', shelvePage],
    queryFn: () => fetchUserShelve(PAGE_SIZE, shelvePage),
    enabled: open && activeTab === 'shelve',
  });

  const { data: continueData, isLoading: continueLoading } = useQuery({
    queryKey: ['collectionContinue', continuePage],
    queryFn: () => fetchUserShelveContinue(PAGE_SIZE, continuePage),
    enabled: open && activeTab === 'continue',
  });

  const { data: buyData, isLoading: buyLoading } = useQuery({
    queryKey: ['collectionBuy', buyPage],
    queryFn: () => fetchUserShelveBuy(PAGE_SIZE, buyPage),
    enabled: open && activeTab === 'buy',
  });

  // --- Derived ---

  const filterExisting = useCallback(
    (books: any[]) => books.filter((b) => !existingBookIds.has(Number(b.book_id || b.bookID || b.id))),
    [existingBookIds]
  );

  const filterByText = useCallback((books: any[], text: string) => {
    if (!text) return books;
    const lower = text.toLowerCase();
    return books.filter(
      (b) =>
        (b.name || b.title || '').toLowerCase().includes(lower) ||
        (b.writer_name || b.author || '').toLowerCase().includes(lower)
    );
  }, []);

  const shelveBooks = useMemo(() => filterByText(filterExisting(shelveData?.books ?? []), shelveSearch), [shelveData, filterExisting, filterByText, shelveSearch]);
  const shelveTotal = shelveData?.paginate?.total ?? shelveBooks.length;

  const continueBooks = useMemo(() => filterByText(filterExisting(continueData?.books ?? []), continueSearch), [continueData, filterExisting, filterByText, continueSearch]);
  const continueTotal = continueData?.paginate?.total ?? continueBooks.length;

  const buyBooks = useMemo(() => filterByText(filterExisting(buyData?.books ?? []), buySearch), [buyData, filterExisting, filterByText, buySearch]);
  const buyTotal = buyData?.paginate?.total ?? buyBooks.length;

  // --- Selection ---

  const toggleSelect = (id: string) => {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Add books mutation ---

  const addBooksMutation = useMutation({
    mutationFn: () => addBooksToCollection(collectionId, Array.from(selectedBookIds)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collectionBooks', collectionId] }),
        queryClient.invalidateQueries({ queryKey: ['collectionBooks', String(collectionId)] }),
        queryClient.invalidateQueries({ queryKey: ['userCollections'] }),
        queryClient.refetchQueries({ queryKey: ['collectionBooks', collectionId], exact: true }),
        queryClient.refetchQueries({ queryKey: ['collectionBooks', String(collectionId)], exact: true }),
      ]);
      handleClose();
      notification.success({ message: 'เพิ่มหนังสือสำเร็จ' });
    },
    onError: () => {
      notification.error({ message: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเพิ่มหนังสือได้' });
    },
  });

  const handleAddBooks = () => {
    if (selectedBookIds.size === 0) return;
    addBooksMutation.mutate();
  };

  const handleClose = () => {
    setSelectedBookIds(new Set());
    setShelveSearch('');
    setContinueSearch('');
    setBuySearch('');
    setShelvePage(1);
    setContinuePage(1);
    setBuyPage(1);
    setActiveTab('shelve');
    onClose();
  };

  // --- Helpers ---

  const renderBookList = (books: any[], loading: boolean) => {
    if (loading) {
      return (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
        </div>
      );
    }
    if (books.length === 0) {
      return <Empty description="ไม่พบหนังสือ" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }
    return (
      <div className="flex flex-col gap-3">
        {books.map((book: any) => {
          const bookId = getBookId(book);
          return (
            <BookRow key={bookId} book={book} isSelected={selectedBookIds.has(bookId)} onToggle={() => toggleSelect(bookId)} />
          );
        })}
      </div>
    );
  };

  const renderPagination = (current: number, total: number, onChange: (page: number) => void) => {
    if (total <= PAGE_SIZE) return null;
    return (
      <div className="flex justify-center mt-4">
        <Pagination current={current} total={total} pageSize={PAGE_SIZE} onChange={onChange} showSizeChanger={false} size="small" />
      </div>
    );
  };

  const tabItems = [
    {
      key: 'shelve',
      label: 'ชั้นหนังสือ',
      children: (
        <div>
          <Input
            placeholder="ค้นหาจากชั้นหนังสือ..."
            value={shelveSearch}
            onChange={(e) => setShelveSearch(e.target.value)}
            size="middle"
            className="mb-3"
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <div className="max-h-[350px] overflow-y-auto pr-1">
            {renderBookList(shelveBooks, shelveLoading)}
          </div>
          {renderPagination(shelvePage, shelveTotal, setShelvePage)}
        </div>
      ),
    },
    {
      key: 'continue',
      label: 'อ่านต่อ',
      children: (
        <div>
          <Input
            placeholder="ค้นหาจากอ่านต่อ..."
            value={continueSearch}
            onChange={(e) => setContinueSearch(e.target.value)}
            size="middle"
            className="mb-3"
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <div className="max-h-[350px] overflow-y-auto pr-1">
            {renderBookList(continueBooks, continueLoading)}
          </div>
          {renderPagination(continuePage, continueTotal, setContinuePage)}
        </div>
      ),
    },
    {
      key: 'buy',
      label: 'ซื้อแล้ว',
      children: (
        <div>
          <Input
            placeholder="ค้นหาจากซื้อแล้ว..."
            value={buySearch}
            onChange={(e) => setBuySearch(e.target.value)}
            size="middle"
            className="mb-3"
            allowClear
            prefix={<SearchOutlined className="text-gray-400" />}
          />
          <div className="max-h-[350px] overflow-y-auto pr-1">
            {renderBookList(buyBooks, buyLoading)}
          </div>
          {renderPagination(buyPage, buyTotal, setBuyPage)}
        </div>
      ),
    },
    {
      key: 'all',
      label: 'ทั้งหมด',
      children: (
        <SearchAllTab
          existingBookIds={existingBookIds}
          selectedBookIds={selectedBookIds}
          toggleSelect={toggleSelect}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div className="flex items-center gap-2">
          <span>เพิ่มหนังสือเข้าคอลเลคชั่น</span>
          {selectedBookIds.size > 0 && (
            <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6">
              {selectedBookIds.size}
            </span>
          )}
        </div>
      }
      centered
      width={640}
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button
            type="primary"
            onClick={handleAddBooks}
            disabled={selectedBookIds.size === 0}
            loading={addBooksMutation.isPending}
            style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
          >
            เพิ่ม {selectedBookIds.size > 0 ? `(${selectedBookIds.size})` : ''}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={tabItems}
          className="add-book-tabs"
        />
      </div>

      <style jsx global>{`
        .add-book-tabs .ant-tabs-tab:hover {
          color: #dc2626 !important;
        }
        .add-book-tabs .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: #dc2626 !important;
        }
        .add-book-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #dc2626 !important;
        }
        .add-book-tabs .ant-tabs-ink-bar {
          background: #dc2626 !important;
        }
      `}</style>
    </Modal>
  );
}
