"use client";
import { useState } from 'react';
import dayjs from 'dayjs';
import { createPromotion, deletePromotion, updatePromotion, createGroupEpisodePromotion, deleteGroupEpisodePromotion } from '@/services/apiServices';

interface MessageApi {
	success: (content: unknown) => void;
	error: (content: unknown) => void;
	warning: (content: unknown) => void;
	info: (content: unknown) => void;
}

const normalizeGroupIds = (value: unknown): string[] => {
	if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
	if (typeof value === 'number') return [String(value)];
	if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
	return [];
};

const formatPromotionDate = (date: dayjs.Dayjs) => date.format('YYYY/MM/DD HH:mm:ss');

export function useEditBookPromotions(
	bookId: string | null | undefined,
	messageApi: MessageApi,
	refetchBook: () => void,
	refetchPurchase: () => void,
	refetchEpisodes: () => void,
	selectedIds: Set<string>,
	clearSelection: () => void,
	groupEpisodesData: any,
	selectedGroupId: string | number | null,
) {
	// Book-level promotion state
	const [promoModalOpen, setPromoModalOpen] = useState(false);
	const [promoName, setPromoName] = useState('');
	const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
	const [promoStart, setPromoStart] = useState<dayjs.Dayjs | null>(null);
	const [promoEnd, setPromoEnd] = useState<dayjs.Dayjs | null>(null);
	const [promoSelectedGroups, setPromoSelectedGroups] = useState<string[]>([]);
	const [creatingPromo, setCreatingPromo] = useState(false);
	const [openPromoId, setOpenPromoId] = useState<string | number | null>(null);
	const [editingPromoId, setEditingPromoId] = useState<number | null>(null);

	// Episode-level promotion state
	const [promoEpModalOpen, setPromoEpModalOpen] = useState(false);
	const [cancelPromoEpModalOpen, setCancelPromoEpModalOpen] = useState(false);
	const [promoDiscountPrice, setPromoDiscountPrice] = useState<number>(0);
	const [promoStartDate, setPromoStartDate] = useState<dayjs.Dayjs | null>(dayjs());
	const [promoEndDate, setPromoEndDate] = useState<dayjs.Dayjs | null>(dayjs().add(1, 'day'));
	const [promoEpSubmitting, setPromoEpSubmitting] = useState(false);

	const resetPromoForm = () => {
		setPromoName('');
		setPromoDiscount(null);
		setPromoStart(null);
		setPromoEnd(null);
		setPromoSelectedGroups([]);
		setEditingPromoId(null);
	};

	const handleDeletePromotion = async (id: string | number) => {
		try {
			await deletePromotion(id);
			messageApi.success('ลบโปรโมชั่นเรียบร้อย');
			setOpenPromoId(null);
			refetchBook();
			refetchPurchase();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถลบโปรโมชั่นได้');
		}
	};

	const handleOpenEditPromotion = (promo: any) => {
		setEditingPromoId(promo.id);
		setPromoName(promo.name);
		const parseDate = (dateStr: string) => dayjs(dateStr, 'DD/MM/YYYY HH:mm');
		setPromoStart(parseDate(promo.start));
		setPromoEnd(parseDate(promo.end));
		setPromoDiscount(promo.discount_percent);
		setPromoSelectedGroups(normalizeGroupIds(promo.groupIDs ?? promo.group_ids));
		setPromoModalOpen(true);
	};

	const handleCreatePromotion = async () => {
		if (!promoName.trim()) return messageApi.error('กรุณากรอกชื่อโปรโมชั่น');
		if (!promoDiscount) return messageApi.error('กรุณากรอกส่วนลด');
		if (!promoStart || !promoEnd) return messageApi.error('กรุณาเลือกวันเวลา');
		const selectedGroupIds = normalizeGroupIds(promoSelectedGroups);
		if (selectedGroupIds.length === 0) return messageApi.error('กรุณาเลือกกลุ่มหนังสือ');
		const numericBookId = Number(bookId);
		if (!Number.isFinite(numericBookId)) return messageApi.error('ไม่พบ bookId');
		try {
			setCreatingPromo(true);
			if (editingPromoId) {
				const payload = {
					dfb_id: editingPromoId,
					groupIDs: selectedGroupIds,
					subject: promoName.trim(),
					start_date: formatPromotionDate(promoStart),
					end_date: formatPromotionDate(promoEnd),
					discount_percent: String(promoDiscount),
					book_id: numericBookId
				};
				await updatePromotion(payload);
				messageApi.success('แก้ไขโปรโมชั่นเรียบร้อย');
			} else {
				const payload = {
					group_ids: selectedGroupIds,
					subject: promoName.trim(),
					start_date: formatPromotionDate(promoStart),
					end_date: formatPromotionDate(promoEnd),
					discount_percent: String(promoDiscount),
					book_id: numericBookId
				};
				await createPromotion(payload);
				messageApi.success('สร้างโปรโมชั่นเรียบร้อย');
			}
			setPromoModalOpen(false);
			resetPromoForm();
			refetchBook();
			refetchPurchase();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถบันทึกโปรโมชั่นได้');
		} finally {
			setCreatingPromo(false);
		}
	};

	const handleBulkSetPromotion = async () => {
		const ids = Array.from(selectedIds);
		if (ids.length === 0) return messageApi.error('กรุณาเลือกตอนที่ต้องการตั้งค่า');
		if (!promoDiscountPrice) return messageApi.error('กรุณาระบุราคาโปรโมชั่น');
		if (!promoStartDate || !promoEndDate) return messageApi.error('กรุณาระบุช่วงเวลา');
		try {
			setPromoEpSubmitting(true);
			const payload = {
				ep_ids: ids.join(','),
				start_date: promoStartDate.format('YYYY/MM/DD HH:mm'),
				end_date: promoEndDate.format('YYYY/MM/DD HH:mm'),
				discount_price: promoDiscountPrice
			};
			await createGroupEpisodePromotion(payload);
			messageApi.success('ตั้งค่าโปรโมชั่นเรียบร้อย');
			setPromoEpModalOpen(false);
			refetchEpisodes();
			clearSelection();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถตั้งค่าโปรโมชั่นได้');
		} finally {
			setPromoEpSubmitting(false);
		}
	};

	const handleBulkCancelPromotion = async () => {
		const selectedEpIds = Array.from(selectedIds);
		if (selectedEpIds.length === 0) return messageApi.error('กรุณาเลือกตอนที่ต้องการยกเลิก');
		const rawPayload = groupEpisodesData ?? [];
		let episodesRaw: any[] = [];
		if (Array.isArray(rawPayload)) episodesRaw = rawPayload;
		else if (rawPayload && Array.isArray((rawPayload as any).episodes)) episodesRaw = (rawPayload as any).episodes;
		else if (rawPayload && Array.isArray((rawPayload as any).list)) episodesRaw = (rawPayload as any).list;
		else if (rawPayload && Array.isArray((rawPayload as any).data)) episodesRaw = (rawPayload as any).data;

		const promoIds: string[] = [];
		selectedEpIds.forEach(epKey => {
			const ep = episodesRaw.find((e: any, idx: number) => {
				const rid = e.ep_id ?? e.epID ?? e.episode_id ?? e.id ?? e.eid;
				const canonicalKey = String(rid ?? `ep_${String(selectedGroupId ?? 'g')}_${idx}`);
				return canonicalKey === epKey;
			});
			if (ep && Array.isArray(ep.promotions) && ep.promotions.length > 0) {
				const active = ep.promotions[0];
				if (active && active.id) promoIds.push(String(active.id));
			}
		});

		if (promoIds.length === 0) return messageApi.error('ไม่พบโปรโมชั่นในตอนที่เลือก');
		try {
			setPromoEpSubmitting(true);
			await deleteGroupEpisodePromotion(promoIds.join(','));
			messageApi.success('ยกเลิกโปรโมชั่นเรียบร้อย');
			setCancelPromoEpModalOpen(false);
			refetchEpisodes();
			clearSelection();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถยกเลิกโปรโมชั่นได้');
		} finally {
			setPromoEpSubmitting(false);
		}
	};

	return {
		promoModalOpen, promoName, promoDiscount, promoStart, promoEnd,
		promoSelectedGroups, creatingPromo, openPromoId, editingPromoId,
		promoEpModalOpen, cancelPromoEpModalOpen, promoDiscountPrice,
		promoStartDate, promoEndDate, promoEpSubmitting,
		setPromoModalOpen, setPromoName, setPromoDiscount, setPromoStart, setPromoEnd,
		setPromoSelectedGroups, setOpenPromoId, setEditingPromoId,
		setPromoEpModalOpen, setCancelPromoEpModalOpen, setPromoDiscountPrice,
		setPromoStartDate, setPromoEndDate,
		resetPromoForm, handleDeletePromotion, handleOpenEditPromotion,
		handleCreatePromotion, handleBulkSetPromotion, handleBulkCancelPromotion,
	};
}
