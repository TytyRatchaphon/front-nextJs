"use client";
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BookDetail } from '@/types/api';
import { fetchBookDetail, fetchBookGroups, fetchGroupEpisodes, fetchBookPurchaseDetails } from '@/services/apiServices';

export function useEditBookData(initialBook?: Partial<BookDetail> | null, bookId?: string | null) {
	const [book, setBook] = useState<Partial<BookDetail> | null>(initialBook || null);
	const [, setDataSource] = useState<'prop' | 'session' | 'api' | 'none'>(initialBook ? 'prop' : 'none');

	// runtime debug helpers
	const log = (...args: any[]) => {
		try { void args } catch { /* ignore */ }
	};

	useEffect(() => {
		let mounted = true;

		const tryLoadFromSession = (): boolean => {
			if (!bookId || typeof window === 'undefined') return false;
			try {
				const raw = sessionStorage.getItem(`editBook_${bookId}`);
				log('session raw for', bookId, raw);
				if (raw) {
					const parsed = JSON.parse(raw);
					log('parsed session book:', parsed);
					if (mounted) {
						setBook(parsed);
						setDataSource('session');
					}
					sessionStorage.removeItem(`editBook_${bookId}`);
					return true;
				}
			} catch (e) {
				log('EditMyBook: session load failed', e);
			}
			return false;
		};

		if (!initialBook) {
			const loaded = tryLoadFromSession();
			if (!loaded) {
				log('no session; will load via react-query for', bookId);
			}
		} else {
			setBook(initialBook);
			setDataSource('prop');
		}

		return () => { mounted = false };
	}, [initialBook, bookId]);

	const query = useQuery<BookDetail, any>({
		queryKey: ['edit-book-detail', bookId],
		queryFn: async () => {
			if (!bookId) throw new Error('no bookId');
			log('react-query fetching book detail for', bookId);
			const data = await fetchBookDetail(String(bookId));
			return data;
		},
		enabled: !!bookId,
	});

	useEffect(() => {
		if (query.data) {
			log('react-query fetched book detail (effect):', query.data);
			setBook(query.data);
			setDataSource('api');
		}
		if (query.error) {
			log('react-query fetch error (effect):', query.error);
		}
	}, [query.data, query.error]);

	const groupsQuery = useQuery<any[], any>({
		queryKey: ['edit-book-groups', bookId],
		queryFn: async () => {
			if (!bookId) return [];
			return await fetchBookGroups(String(bookId));
		},
		enabled: !!bookId,
	});

	const purchaseQuery = useQuery({
		queryKey: ['edit-book-purchase-details', bookId],
		queryFn: async () => {
			if (!bookId) return null;
			return await fetchBookPurchaseDetails(String(bookId));
		},
		enabled: !!bookId,
	});

	const display = useMemo(() => {
		if (!book) return book;
		const details = purchaseQuery.data;
		if (!details) return book;
		return {
			...book,
			discount_full_book: details.discount_full_book || book.discount_full_book,
			remaining_paid_count: details.remaining_paid_count ?? book.remaining_paid_count,
			remaining_paid_total: details.remaining_paid_total ?? book.remaining_paid_total,
			remaining_paid_total_discount: details.remaining_paid_total_discount ?? book.remaining_paid_total_discount,
			remaining_promo_count: details.remaining_promo_count ?? book.remaining_promo_count,
			remaining_promo_total: details.remaining_promo_total ?? book.remaining_promo_total,
			remaining_promo_total_discount: details.remaining_promo_total_discount ?? book.remaining_promo_total_discount,
		};
	}, [book, purchaseQuery.data]);

	const [computedVisibleEps, setComputedVisibleEps] = useState<number>(Number((display as any)?.total_eps ?? 0));

	useEffect(() => {
		let mounted = true;
		const run = async () => {
			try {
				const rawGroups = (groupsQuery?.data ?? []);
				if (!Array.isArray(rawGroups) || rawGroups.length === 0) {
					if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0));
					return;
				}
				const groups = rawGroups.filter((g: any) => (g.publish ?? g.publish ?? 'private').toLowerCase() === 'publish');
				const hasEpisodesArray = groups.some((g: any) => Array.isArray(g.episodes) || Array.isArray(g.eps) || Array.isArray(g.list));
				if (hasEpisodesArray) {
					const total = groups.reduce((acc: number, g: any) => {
						const arr = g.episodes ?? g.eps ?? g.list ?? [];
						const visible = arr.filter((e: any) => {
							const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase();
							return s === 'publish' || s === 'published';
						});
						return acc + visible.length;
					}, 0);
					if (mounted) setComputedVisibleEps(total);
					return;
				}
				const hasPerGroupTotals = groups.some((g: any) => typeof g.total_eps === 'number' || typeof g.totalEps === 'number' || typeof g.count === 'number');
				if (hasPerGroupTotals) {
					const total = groups.reduce((acc: number, g: any) => acc + (g.total_eps ?? g.totalEps ?? g.count ?? 0), 0);
					if (mounted) setComputedVisibleEps(total);
					return;
				}
				if (groups.length > 0 && groups.length <= 12) {
					const results = await Promise.all(groups.map(async (g: any) => {
						try {
							const gid = g.group_id ?? g.groupId ?? g.id;
							if (!gid) return [];
							const resp: any = await fetchGroupEpisodes(String(gid));
							return resp?.episodes ?? resp?.list ?? [];
						} catch { return []; }
					}));
					const flat = results.flat();
					const total = flat.filter((e: any) => {
						const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase();
						return s === 'publish' || s === 'published';
					}).length;
					if (mounted) setComputedVisibleEps(total);
					return;
				}
				if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0));
			} catch {
				if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0));
			}
		};
		run();
		return () => { mounted = false };
	}, [groupsQuery.data, display]);

	const getBookName = (d: any) => {
		if (!d) return '';
		const candidates = [d?.name, d?.title, d?.book?.name, d?.book_name, d?.bookName, d?.name_th];
		for (const c of candidates) {
			if (c === 0) return '0';
			if (typeof c === 'string' && c.trim()) return c.trim();
			if (typeof c === 'number') return String(c);
		}
		return '';
	};

	return { book, display, computedVisibleEps, getBookName, query, purchaseQuery, groupsQuery };
}
