"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { App } from 'antd'
import type { MenuProps } from 'antd'
import type { BookDetail } from '@/types/api'
import { useEditBookData } from './hooks/useEditBookData'
import { useEditBookGroups } from './hooks/useEditBookGroups'
import { useEditBookPromotions } from './hooks/useEditBookPromotions'
import GifLoader from '@/components/utility/GifLoader'
import { EditBookOverview } from './components/EditBookOverview'
import { EditBookEpisodesModal } from './components/EditBookEpisodesModal'
import { EditBookGroupsSection, EditBookPromotionsSection, EditBookTagsSection } from './components/EditBookSections'
import {
	EditBulkPriceModal,
	EditCancelEpisodePromotionModal,
	EditEpisodePromotionModal,
	EditGroupNameModal,
	EditPromotionFormModal,
	EditSuccessModal,
} from './components/EditMyBookModals'
export default function EditMyBook({ book: initialBook, bookId }: { book?: Partial<BookDetail> | null; bookId?: string | null }) {
	const router = useRouter()
	const { notification, modal: modalApi } = App.useApp()
	const messageApi = {
		success: (content: unknown) => notification.success({ message: String(content ?? '') }),
		error: (content: unknown) => notification.error({ message: String(content ?? '') }),
		warning: (content: unknown) => notification.warning({ message: String(content ?? '') }),
		info: (content: unknown) => notification.info({ message: String(content ?? '') }),
	}

	const { display, computedVisibleEps, getBookName, query, purchaseQuery, groupsQuery } = useEditBookData(initialBook, bookId)

	const groups = useEditBookGroups(bookId, groupsQuery, messageApi, modalApi)
	const {
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
	} = groups

	const clearSelection = () => { setSelectedIds(new Set()); setSelectAllChecked(false) }
	const promos = useEditBookPromotions(
		bookId, messageApi,
		() => query.refetch(), () => purchaseQuery.refetch(),
		() => groupEpisodesQuery.refetch(),
		selectedIds, clearSelection,
		groupEpisodesQuery.data, selectedGroupId,
	)
	const {
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
	} = promos

	const handleFullMenuClick: NonNullable<MenuProps['onClick']> = (info) => {
		const { key } = info
		if (key === 'set_promotion') {
			if (Array.from(selectedIds).length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการตั้งค่าส่วนลด')
			setPromoEpModalOpen(true)
			return
		} else if (key === 'cancel_promotion') {
			if (Array.from(selectedIds).length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการยกเลิกส่วนลด')
			setCancelPromoEpModalOpen(true)
			return
		}
		handleMenuClick(info)
	}

	// While no book data, show a loading indicator (avoid using mock values)
	if (!display) {
		return (
			<GifLoader />
		)
	}
	return (
		<div className="max-w-5xl mx-auto py-10 px-6">
			<EditGroupNameModal
				open={addGroupModalOpen}
				editingGroup={editingGroup}
				newGroupName={newGroupName}
				newGroupError={newGroupError}
				creatingGroup={creatingGroup}
				onClose={() => setAddGroupModalOpen(false)}
				onNameChange={(value) => {
					setNewGroupName(value)
					setNewGroupError(validateGroupName(value))
				}}
				onSubmit={handleSubmitGroup}
			/>
			<EditBulkPriceModal
				open={priceModalOpen}
				priceSelected={priceSelected}
				priceSubmitting={priceSubmitting}
				selectedEpisodeCount={modalSelectedEpIds.length}
				onClose={() => setPriceModalOpen(false)}
				onPriceChange={setPriceSelected}
				onSubmit={handleUpdatePrice}
			/>
			<EditSuccessModal
				open={confirmModalOpen}
				onClose={() => setConfirmModalOpen(false)}
			/>
			<EditEpisodePromotionModal
				open={promoEpModalOpen}
				promoDiscountPrice={promoDiscountPrice}
				promoStartDate={promoStartDate}
				promoEndDate={promoEndDate}
				submitting={promoEpSubmitting}
				onClose={() => setPromoEpModalOpen(false)}
				onDiscountPriceChange={setPromoDiscountPrice}
				onStartDateChange={setPromoStartDate}
				onEndDateChange={setPromoEndDate}
				onSubmit={handleBulkSetPromotion}
			/>
			<EditCancelEpisodePromotionModal
				open={cancelPromoEpModalOpen}
				submitting={promoEpSubmitting}
				onClose={() => setCancelPromoEpModalOpen(false)}
				onSubmit={handleBulkCancelPromotion}
			/>

			<EditBookOverview
				display={display}
				bookId={bookId}
				getBookName={getBookName}
				onEditBook={() => {
					if (bookId) {
						router.push(`/w/edit/${bookId}`)
					} else {
						messageApi.error('ไม่พบ ID หนังสือ')
					}
				}}
			/>

			<EditBookEpisodesModal
				open={isGroupModalOpen}
				selectedGroupId={selectedGroupId}
				groupEpisodesQuery={groupEpisodesQuery}
				episodeFilter={episodeFilter}
				selectedIds={selectedIds}
				selectAllChecked={selectAllChecked}
				deletingId={deletingId}
				onClose={closeGroupModal}
				onFilterChange={setEpisodeFilter}
				onClearSelection={() => {
					setSelectedIds(new Set())
					setSelectAllChecked(false)
				}}
				onSelectAll={handleSelectAll}
				onMenuClick={handleFullMenuClick}
				onToggleSelect={toggleSelect}
				onDeleteEpisode={handleDeleteEpisode}
				onMissingEpisodeId={() => messageApi.error('ไม่พบ ID ตอน')}
			/>

			<EditBookTagsSection display={display} />
			<EditBookGroupsSection
				groupsQuery={groupsQuery}
				computedVisibleEps={computedVisibleEps}
				onAddGroup={handleOpenAddGroup}
				onDeleteGroup={handleDeleteGroup}
				onEditGroup={handleOpenEditGroup}
				onAddEpisode={(groupId) => router.push(`/w/nchapter/${groupId}`)}
				onOpenGroup={openGroupModal}
			/>
			<EditBookPromotionsSection
				display={display}
				openPromoId={openPromoId}
				onAddPromotion={() => setPromoModalOpen(true)}
				onOpenPromoChange={setOpenPromoId}
				onEditPromotion={handleOpenEditPromotion}
				onDeletePromotion={handleDeletePromotion}
			/>

			<EditPromotionFormModal
				open={promoModalOpen}
				editingPromoId={editingPromoId}
				promoName={promoName}
				promoDiscount={promoDiscount}
				promoStart={promoStart}
				promoEnd={promoEnd}
				promoSelectedGroups={promoSelectedGroups}
				creatingPromo={creatingPromo}
				groupOptions={(groupsQuery.data ?? []).map((g: any) => ({
					label: g.name,
					value: String(g.group_id)
				}))}
				onClose={() => {
					setPromoModalOpen(false)
					setEditingPromoId(null)
					setPromoName('')
					setPromoDiscount(null)
					setPromoStart(null)
					setPromoEnd(null)
					setPromoSelectedGroups([])
				}}
				onNameChange={setPromoName}
				onDiscountChange={setPromoDiscount}
				onStartChange={setPromoStart}
				onEndChange={setPromoEnd}
				onSelectedGroupsChange={setPromoSelectedGroups}
				onSubmit={handleCreatePromotion}
			/>
		</div>
	)
}
