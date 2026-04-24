"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGroupEpisodes, deleteGroupEpisode, createGroup, deleteGroup, updateEpisodesPrice, updateGroup } from '@/services/apiServices';
import { queryKeys } from '@/constants/query';

interface MessageApi {
	success: (content: unknown) => void;
	error: (content: unknown) => void;
	warning: (content: unknown) => void;
	info: (content: unknown) => void;
}

export function useEditBookGroups(
	bookId: string | null | undefined,
	groupsQuery: ReturnType<typeof useQuery<any[], any>>,
	messageApi: MessageApi,
	modalApi: any,
) {
	const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
	const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<{ id: string | number, name: string } | null>(null);
	const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
	const [newGroupName, setNewGroupName] = useState('');
	const [creatingGroup, setCreatingGroup] = useState(false);
	const [newGroupError, setNewGroupError] = useState<string | null>(null);
	const [deletingId, setDeletingId] = useState<string | number | null>(null);
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [selectAllChecked, setSelectAllChecked] = useState(false);
	const [episodeFilter, setEpisodeFilter] = useState<'all' | 'published' | 'wait'>('all');
	const [, setDeletingBulk] = useState(false);
	const [priceModalOpen, setPriceModalOpen] = useState(false);
	const [priceSelected, setPriceSelected] = useState<number | null>(null);
	const [priceSubmitting, setPriceSubmitting] = useState(false);
	const [modalSelectedEpIds, setModalSelectedEpIds] = useState<string[]>([]);

	const validateGroupName = (name: string) => {
		const v = String(name ?? '').trim();
		if (!v) return 'กรุณาใส่ชื่อเล่ม';
		if (v.length < 3) return 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร';
		try {
			const existing = (groupsQuery.data ?? []) as any[];
			const lower = v.toLowerCase();
			if (existing.some((g: any) => String(g.name ?? g.title ?? '').toLowerCase().trim() === lower)) {
				return 'ชื่อนี้มีอยู่แล้ว';
			}
		} catch { /* ignore */ }
		return null;
	};

	const openGroupModal = (groupId: string | number) => {
		setSelectedGroupId(groupId);
		setIsGroupModalOpen(true);
	};

	const closeGroupModal = () => {
		setIsGroupModalOpen(false);
		setSelectedGroupId(null);
		setEpisodeFilter('all');
	};

	const handleOpenEditGroup = (group: any) => {
		setEditingGroup({ id: group.group_id, name: group.name });
		setNewGroupName(group.name || '');
		setNewGroupError(null);
		setAddGroupModalOpen(true);
	};

	const handleOpenAddGroup = () => {
		setEditingGroup(null);
		setNewGroupName('');
		setNewGroupError(null);
		setAddGroupModalOpen(true);
	};

	const groupEpisodesQuery = useQuery({
		queryKey: queryKeys.group.episodes(selectedGroupId),
		queryFn: async () => {
			if (!selectedGroupId) return { episodes: [] };
			return await fetchGroupEpisodes(String(selectedGroupId));
		},
		enabled: !!selectedGroupId && isGroupModalOpen,
	});

	const handleDeleteEpisode = async (episodeId: string | number) => {
		try {
			setDeletingId(episodeId);
			await deleteGroupEpisode(episodeId, selectedGroupId ?? undefined);
			messageApi.success('ลบตอนเรียบร้อย');
			setConfirmModalOpen(true);
			groupEpisodesQuery.refetch();
		} catch (err: any) {
			const status = err?.response?.status;
			messageApi.error(status ? `ไม่สามารถลบตอนได้ (${status})` : 'ไม่สามารถลบตอนได้');
		} finally {
			setDeletingId(null);
		}
	};

	const toggleSelect = (epId: string | number) => {
		const key = String(epId);
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			setSelectAllChecked(false);
			return next;
		});
	};

	const handleSelectAll = (checked: boolean, allIds: (string | number)[]) => {
		if (checked) {
			setSelectedIds(new Set(allIds.map((x) => String(x))));
			setSelectAllChecked(true);
		} else {
			setSelectedIds(new Set());
			setSelectAllChecked(false);
		}
	};

	const handleBulkDelete = async (idsArg?: (string | number)[]) => {
		const ids = (idsArg && idsArg.length > 0) ? idsArg.map((x) => String(x)) : Array.from(selectedIds);
		if (!ids || ids.length === 0) return;
		const toDelete = ids.filter(Boolean);
		setDeletingBulk(true);
		let success = 0;
		let failed = 0;
		await Promise.allSettled(
			toDelete.map(async (eid) => {
				try {
					await deleteGroupEpisode(eid, selectedGroupId ?? undefined);
					success += 1;
				} catch { failed += 1; }
			})
		);
		setDeletingBulk(false);
		groupEpisodesQuery.refetch();
		setSelectedIds(new Set());
		setSelectAllChecked(false);
		if (success > 0) {
			messageApi.success(`ลบสำเร็จ ${success} รายการ`);
			setConfirmModalOpen(true);
		}
		if (failed > 0) messageApi.error(`ลบไม่สำเร็จ ${failed} รายการ`);
	};

	const handleDeleteGroup = async (groupId: string | number) => {
		try {
			await deleteGroup(groupId);
			messageApi.success('ลบเล่มเรียบร้อย');
			groupsQuery.refetch();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถลบเล่มได้');
		}
	};

	const handleSubmitGroup = async (trimmedName: string) => {
		const err = validateGroupName(trimmedName);
		setNewGroupError(err);
		if (err) { messageApi.error(err); return; }
		try {
			setCreatingGroup(true);
			if (editingGroup) {
				await updateGroup(editingGroup.id, trimmedName);
				messageApi.success('แก้ไขชื่อเล่มเรียบร้อย');
			} else {
				if (!bookId) { messageApi.error('ไม่พบ bookId'); return; }
				await createGroup(String(bookId), trimmedName);
				messageApi.success('สร้างเล่มเรียบร้อย');
			}
			setAddGroupModalOpen(false);
			setNewGroupName('');
			setNewGroupError(null);
			setEditingGroup(null);
			groupsQuery.refetch();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถสร้างเล่มได้');
		} finally {
			setCreatingGroup(false);
		}
	};

	const handleUpdatePrice = async () => {
		if (!modalSelectedEpIds || modalSelectedEpIds.length === 0) { messageApi.info('ไม่มีตอนที่เลือก'); return; }
		if (priceSelected === null) { messageApi.error('โปรดเลือกราคา'); return; }
		try {
			setPriceSubmitting(true);
			await updateEpisodesPrice(modalSelectedEpIds, priceSelected);
			messageApi.success('แก้ไขราคาสำเร็จ');
			setPriceModalOpen(false);
			groupEpisodesQuery.refetch();
			groupsQuery.refetch();
		} catch (e: any) {
			messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถแก้ไขราคาได้');
		} finally {
			setPriceSubmitting(false);
		}
	};

	const handleMenuClick = ({ key }: any) => {
		const selectedIdArray = Array.from(selectedIds);
		if (key === 'deleteAll') {
			if (selectedIdArray.length === 0) { messageApi.info('กรุณาเลือกตอนที่ต้องการลบก่อน'); return; }
			modalApi.confirm({
				title: `ยืนยันการลบ ${selectedIdArray.length} ตอนที่เลือก?`,
				onOk: async () => { await handleBulkDelete(selectedIdArray); },
				okText: 'ลบเลย',
				cancelText: 'ยกเลิก',
				okButtonProps: { danger: true },
				cancelButtonProps: { style: { color: '#dc2626' }, className: '!text-rose-600 hover:!bg-rose-50' }
			});
		} else if (key === 'editPrice') {
			if (selectedIdArray.length === 0) { messageApi.info('กรุณาเลือกตอนที่ต้องการแก้ไขราคาก่อน'); return; }
			setModalSelectedEpIds(selectedIdArray.map((x: any) => String(x)));
			setPriceSelected(null);
			setPriceModalOpen(true);
		}
		return key; // pass through for promo handling
	};

	return {
		selectedGroupId, isGroupModalOpen, editingGroup, addGroupModalOpen, newGroupName,
		creatingGroup, newGroupError, deletingId, confirmModalOpen, selectedIds, selectAllChecked,
		episodeFilter, priceModalOpen, priceSelected, priceSubmitting, modalSelectedEpIds,
		groupEpisodesQuery,
		setNewGroupName, setNewGroupError, setAddGroupModalOpen, setConfirmModalOpen,
		setEpisodeFilter, setSelectedIds, setSelectAllChecked,
		setPriceModalOpen, setPriceSelected, setModalSelectedEpIds,
		validateGroupName, openGroupModal, closeGroupModal,
		handleOpenEditGroup, handleOpenAddGroup,
		handleDeleteEpisode, toggleSelect, handleSelectAll,
		handleBulkDelete, handleDeleteGroup, handleSubmitGroup,
		handleUpdatePrice, handleMenuClick,
	};
}
