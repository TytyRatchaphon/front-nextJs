"use client"
import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { App, Image as AntdImage, Spin, Modal, Popconfirm, Empty, Dropdown, Select, DatePicker, InputNumber, Popover, Segmented } from 'antd'
import type { MenuProps } from 'antd'
import dayjs from 'dayjs'
import type { BookDetail } from '@/types/api'
import { TagSwiper } from '@/components/swiper/ImageSlider'
import { useEditBookData } from './hooks/useEditBookData'
import { useEditBookGroups } from './hooks/useEditBookGroups'
import { useEditBookPromotions } from './hooks/useEditBookPromotions'
import Image from 'next/image'
import GifLoader from '@/components/utility/GifLoader'



const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: 'danger' | 'ghost'
}> = ({ children, variant = 'danger', className, ...rest }) => {
	const base = 'inline-flex items-center justify-center px-4 py-1 rounded text-sm font-medium'
	const cls =
		variant === 'danger'
			? base + ' bg-rose-600 text-white hover:bg-rose-700'
			: base + ' bg-gray-100 text-gray-700'
	const style = variant === 'danger' ? { color: '#ffffff' } : undefined
	return <button {...rest} style={style} className={`${cls} ${className ?? ''}`.trim()}>{children}</button>
}

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
			{/* Add Group Modal */}
			<Modal
				open={addGroupModalOpen}
				onCancel={() => setAddGroupModalOpen(false)}
				footer={null}
				title={editingGroup ? "แก้ไขชื่อเล่ม" : "เพิ่มเล่มนิยาย"}
				centered
			>
				<div className="py-4">
					<input
						type="text"
						className="w-full border rounded px-3 py-2"
						placeholder="กรอกชื่อเล่ม"
						value={newGroupName}
						onChange={(e) => {
							const v = e.target.value
							setNewGroupName(v)
							setNewGroupError(validateGroupName(v))
						}}
						aria-invalid={Boolean(newGroupError)}
					/>
					{newGroupError ? <div className="text-rose-600 text-sm mt-2">{newGroupError}</div> : null}
					<div className="flex justify-center mt-6">
						<button
							onClick={() => handleSubmitGroup(String(newGroupName ?? '').trim())}
							disabled={creatingGroup || Boolean(newGroupError) || !newGroupName.trim()}
							className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
							style={{ color: '#ffffff' }}
						>
							{creatingGroup ? 'กำลังบันทึก...' : 'ตกลง'}
						</button>
					</div>
				</div>
			</Modal>

			{/* Bulk Edit Price Modal */}
			<Modal
				open={priceModalOpen}
				onCancel={() => setPriceModalOpen(false)}
				footer={null}
				centered
			>
				<div className="py-4 text-center">
					<h3 className="text-lg text-amber-500 font-semibold mb-4">แก้ไขราคาทั้งหมดที่เลือก</h3>
					<div className="mx-auto w-48">
						<Select
							value={priceSelected ?? undefined}
							onChange={(val) => setPriceSelected(val === undefined ? null : Number(val))}
							options={[{ value: 0, label: 'อ่านฟรี' }, ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1} เหรียญ` }))]}
							style={{ width: '100%' }}
							placeholder="เลือก..."
						/>
						<div className="my-2 text-center text-gray-400 text-sm">หรือกำหนดเอง</div>
						<InputNumber
							min={0}
							value={priceSelected}
							onChange={(val) => setPriceSelected(val)}
							placeholder="ระบุราคาเอง"
							style={{ width: '100%' }}
						/>
					</div>
					<div className="flex justify-center mt-6">
						<button
							onClick={handleUpdatePrice}
							disabled={priceSubmitting || priceSelected === null || modalSelectedEpIds.length === 0}
							className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
							style={{ color: '#ffffff' }}
						>
							{priceSubmitting ? 'กำลังอัปเดต...' : 'แก้ไขราคา'}
						</button>
					</div>
				</div>
			</Modal>
			{/* Confirmation modal shown after successful delete */}
			<Modal open={confirmModalOpen} footer={null} onCancel={() => setConfirmModalOpen(false)} centered closable={false}>
				<div className="flex flex-col items-center justify-center py-6 px-8">
					<h3 className="text-lg text-rose-600 font-semibold mb-4">ทำรายการสำเร็จ</h3>
					{/* use image requested by user */}
					<div className="mb-6">
						<Image src="/images/confirmBttn.png" alt="confirm" width={180} height={140} />
					</div>
					<button
						onClick={() => setConfirmModalOpen(false)}
						className="bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded transition-colors"
						style={{ color: '#ffffff' }}
					>
						ตกลง
					</button>
				</div>
			</Modal>

			{/* Set Episode Promotion Modal */}
			<Modal
				open={promoEpModalOpen}
				onCancel={() => setPromoEpModalOpen(false)}
				footer={null}
				centered
				width={700}
				title={<div className="text-center text-amber-500 font-semibold text-lg">ตั้งราคาโปรโมชั่น</div>}
			>
				<div className="py-2">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
						<div>
							<label className="block text-sm text-gray-700 mb-1">ราคาโปรโมชั่น</label>
							<Select
								className="w-full"
								placeholder="เลือกราคา"
								value={promoDiscountPrice}
								onChange={(v) => setPromoDiscountPrice(v)}
								options={Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))}
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">วันที่เริ่มต้น</label>
							<DatePicker
								className="w-full"
								placeholder="เลือกวันที่"
								value={promoStartDate}
								onChange={(date) => setPromoStartDate(date)}
								format="YYYY-MM-DD"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">วันที่สิ้นสุด</label>
							<DatePicker
								className="w-full"
								placeholder="เลือกวันที่"
								value={promoEndDate}
								onChange={(date) => setPromoEndDate(date)}
								format="YYYY-MM-DD"
							/>
						</div>
					</div>
					<div className="flex justify-center">
						<button
							onClick={handleBulkSetPromotion}
							disabled={promoEpSubmitting}
							className="bg-rose-600 text-white px-8 py-2 rounded-full hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
						>
							{promoEpSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
						</button>
					</div>
				</div>
			</Modal>

			{/* Cancel Episode Promotion Confirmation Modal */}
			<Modal
				open={cancelPromoEpModalOpen}
				onCancel={() => setCancelPromoEpModalOpen(false)}
				footer={null}
				centered
				width={500}
			>
				<div className="py-6 flex flex-col items-center text-center">
					<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg" className="text-amber-500 mb-4">
						<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
						<path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
					</svg>
					<h3 className="text-gray-800 font-medium text-lg mb-6">ยืนยันการยกเลิกส่วนลดตอนที่เลือกทั้งหมดหรือไม่</h3>
					<div className="flex items-center gap-3">
						<button
							onClick={() => setCancelPromoEpModalOpen(false)}
							className="px-6 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
						>
							ไม่ใช่
						</button>
						<button
							onClick={handleBulkCancelPromotion}
							disabled={promoEpSubmitting}
							className="px-6 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
						>
							{promoEpSubmitting ? 'กำลังยกเลิก...' : 'ใช่ ยกเลิกเลย'}
						</button>
					</div>
				</div>
			</Modal>

			{/* Header Section */}
			<div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-start">
				<AntdImage
					src={(display as any).img}
					alt="cover"
					width={160}
					preview={{
						mask: <div className="text-white">preview</div>,
					}}
					className="rounded-lg shadow-md object-cover border border-gray-100"
				/>
				<div className="flex-1 min-w-0">
					<h1
						className="text-3xl font-bold text-gray-900 leading-tight mb-3 cursor-pointer hover:text-rose-600 transition-colors"
						onClick={() => window.open(`/book/${bookId}`, '_blank')}
						title="เปิดหน้านิยาย"
					>
						{getBookName(display) || 'ไม่ระบุชื่อหนังสือ'}
					</h1>
					<div className="text-lg text-gray-600 mb-6 flex items-center gap-2">
						<span className="font-medium text-gray-900">โดย:</span>
						{(display as any).writer?.writer_name ?? 'ไม่ระบุ'}
					</div>

					{((display as any).title || (display as any).title) && (
						<div className="text-gray-600 mb-8 max-w-3xl leading-relaxed">
							{(display as any).title ?? (display as any).title}
						</div>
					)}

					<div className="flex flex-wrap items-center gap-4">
						<div className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 text-sm font-medium'>
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
								<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path>
								<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path>
							</svg>
							{((display as any).view ?? (display as any).views)?.toLocaleString()} วิว
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 text-sm font-medium'>
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
								<path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
							</svg>
							{((display as any).total_eps ?? (display as any).total_eps)?.toLocaleString()} ตอน
						</div>
						<div className='flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-gray-600 text-sm font-medium'>
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.1em" width="1.1em" xmlns="http://www.w3.org/2000/svg" className="text-rose-500">
								<path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"></path>
							</svg>
							{((display as any).total_groups ?? (display as any).total_groups)?.toLocaleString()} เล่ม
						</div>
					</div>
				</div>
			</div>

			<hr className="my-8" />

			<section className="mb-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
				<div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
					<h2 className="font-semibold text-lg text-gray-800">รายละเอียด</h2>
					<ActionButton
						onClick={() => {
							if (bookId) {
								router.push(`/w/edit/${bookId}`);
							} else {
								messageApi.error('ไม่พบ ID หนังสือ');
							}
						}}
					>
						แก้ไข
					</ActionButton>
				</div>
				<p className="text-gray-700 leading-relaxed text-base">{(display as any).title ?? (display as any).title}</p>
			</section>

			{/* Group episodes modal */}
			<Modal
				open={isGroupModalOpen}
				title={`ตอนในกลุ่ม ${selectedGroupId ?? ''}`}
				onCancel={closeGroupModal}
				footer={(() => {
					// Logic for footer content
					const allIds = (groupEpisodesQuery.data?.episodes ?? []).filter((e: any) => {
						const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
						return s === 'publish' || s === 'published'
					}).map((ep: any, idx: number) => {
						const rid = ep.ep_id ?? ep.epID ?? ep.episode_id ?? ep.id ?? ep.eid
						return rid ?? `ep_${String(selectedGroupId ?? 'g')}_${idx}`
					})

					const handleMenuClick = ({ key }: any) => {
						const selectedIdArray = Array.from(selectedIds);

						if (key === 'deleteAll') {
							if (selectedIdArray.length === 0) {
								messageApi.info('กรุณาเลือกตอนที่ต้องการลบก่อน')
								return
							}
							modalApi.confirm({
								title: `ยืนยันการลบ ${selectedIdArray.length} ตอนที่เลือก?`,
								onOk: async () => {
									await handleBulkDelete(selectedIdArray)
								},
								okText: 'ลบเลย',
								cancelText: 'ยกเลิก',
								okButtonProps: { danger: true },
								cancelButtonProps: {
									style: { color: '#dc2626' },
									className: '!text-rose-600 hover:!bg-rose-50'
								}
							})
						} else if (key === 'editPrice') {
							if (selectedIdArray.length === 0) {
								messageApi.info('กรุณาเลือกตอนที่ต้องการแก้ไขราคาก่อน')
								return
							}
							setModalSelectedEpIds(selectedIdArray.map((x: any) => String(x)))
							setPriceSelected(null)
							setPriceModalOpen(true)
						} else if (key === 'set_promotion') {
							if (selectedIdArray.length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการตั้งค่าส่วนลด')
							setPromoEpModalOpen(true)
						} else if (key === 'cancel_promotion') {
							if (selectedIdArray.length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการยกเลิกส่วนลด')
							setCancelPromoEpModalOpen(true)
						}
					}

					const items = [
						{ key: 'editPrice', label: 'แก้ไขราคาเลือกทั้งหมด' },
						{ key: 'set_promotion', label: 'ตั้งค่าส่วนลด' },
						{ key: 'cancel_promotion', label: 'ยกเลิกส่วนลดที่เลือกทั้งหมด', danger: true },
						{ key: 'deleteAll', label: 'ลบเลือกทั้งหมด', danger: true },
					]

					return (
						<div className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-lg">
							<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
								<input 
									type="checkbox" 
									className="w-4 h-4 accent-rose-600 rounded border-gray-300 cursor-pointer" 
									checked={selectAllChecked} 
									onChange={(e) => handleSelectAll(e.target.checked, allIds)} 
								/>
								<span>เลือกทั้งหมด ({selectedIds.size})</span>
							</label>
							<div className="flex gap-2">
								<Dropdown menu={{ items, onClick: handleFullMenuClick }} placement="topRight">
									<button className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
										<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
											<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" />
										</svg>
										<span>จัดการ ({selectedIds.size})</span>
									</button>
								</Dropdown>
								<button 
									onClick={closeGroupModal}
									className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors"
								>
									ปิด
								</button>
							</div>
						</div>
					)
				})()}
				width={1000}
				styles={{ body: { maxHeight: '64vh', overflowY: 'auto', padding: '0.5rem 1rem' } }}
			>
				{/* Modal header: book cover, title, author, short desc, stats */}
				{groupEpisodesQuery.isLoading ? (
					<div className="text-sm text-gray-600">กำลังโหลดตอน...</div>
				) : groupEpisodesQuery.isError ? (
					<div className="text-sm text-red-500">ไม่สามารถโหลดตอนของกลุ่มนี้ได้</div>
				) : (
					<div className="w-full">
						{/* Filter Control */}
						<div className="flex justify-start mb-4">
							<Segmented
								options={[
									{ label: 'ทั้งหมด', value: 'all' },
									{ label: 'เผยแพร่แล้ว', value: 'published' },
									{ label: 'รออนุมัติ', value: 'wait' },
								]}
								value={episodeFilter}
								onChange={(val) => {
									setEpisodeFilter(val as any)
									// Clear selection when changing filter to avoid confusion
									setSelectedIds(new Set())
									setSelectAllChecked(false)
								}}
							/>
						</div>
						
						{/* footer controls: select all + manage (MOVED TO TOP) */}
						<div className="space-y-2">
							{(() => {
								const rawPayload = groupEpisodesQuery.data ?? []
								let episodesRaw: any[] = []
								if (Array.isArray(rawPayload)) episodesRaw = rawPayload
								else if (rawPayload && Array.isArray((rawPayload as any).episodes)) episodesRaw = (rawPayload as any).episodes
								else if (rawPayload && Array.isArray((rawPayload as any).list)) episodesRaw = (rawPayload as any).list
								else if (rawPayload && Array.isArray((rawPayload as any).data)) episodesRaw = (rawPayload as any).data
								else episodesRaw = []

								// Show all episodes for the author to manage (published, private, draft, etc.)
								// ✨ Update: User requested to hide private episodes AND filter by status
								const visibleEpisodes = episodesRaw.filter((e: any) => {
									const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
									if (s === 'private') return false
									
									if (episodeFilter === 'published') {
										return s === 'publish' || s === 'published'
									} else if (episodeFilter === 'wait') {
										return s === 'wait'
									}
									return true
								})

								if (!visibleEpisodes || visibleEpisodes.length === 0) {
									return (
										<div className="py-8">
											<Empty description="No Data" />
										</div>
									)
								}

								return visibleEpisodes.map((ep: any, _idx: number) => {
									// Prefer canonical id fields returned by backend (ep_id, epID),
									// fall back to older names (episode_id, id, eid), then fallback string.
									const rawId = ep.ep_id ?? ep.epID ?? ep.episode_id ?? ep.id ?? ep.eid
									const id = rawId ?? `ep_${String(selectedGroupId ?? 'g')}_${_idx}`
									const canonicalKey = String(rawId ?? id)
									const title = ep.title ?? ep.name ?? 'ไม่มีชื่อ'
									const desc = ep.short ?? ep.short_desc ?? ''
									const coin = ep.coin ?? ep.price ?? null
									const isChecked = selectedIds.has(canonicalKey)
									// derive status label from common fields
									// Checkbox state management
									const rawStatus = (ep.publish ?? ep.status ?? ep.visibility ?? '')?.toString().toLowerCase()
									let statusLabel = 'สถานะไม่ทราบ'
									let statusClass = 'text-xs text-gray-600'
									// Check for scheduled publish
									const pubDate = ep.publish_datetime ? dayjs(ep.publish_datetime) : null
									const now = dayjs()

									if (pubDate && pubDate.isValid() && pubDate.isAfter(now)) {
										statusLabel = `เผยแพร่: ${pubDate.format('DD/MM/YYYY HH:mm')}`
										statusClass = 'text-xs text-orange-500 font-medium'
									} else if (rawStatus === 'publish' || rawStatus === 'published') {
										statusLabel = 'เผยแพร่แล้ว'
										statusClass = 'text-xs text-gray-600'
									} else if (rawStatus === 'wait') {
										statusLabel = 'รออนุมัติ'
										statusClass = 'text-xs text-amber-600'
									}
									
									return (
										<div key={id} className="ejb-episode-row flex items-center justify-between py-4 px-4 bg-white rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
											<div className="flex items-center gap-4 min-w-0">
												<input
													type="checkbox"
													className="w-5 h-5 accent-rose-600 rounded border-gray-300"
													aria-label={`เลือกตอน ${title}`}
													checked={isChecked}
													onChange={() => toggleSelect(canonicalKey)}
												/>
												<div className="min-w-0">
													<div className="text-sm font-medium text-gray-800 truncate">{title}</div>
													{desc ? <div className="text-xs text-gray-500 truncate">{desc}</div> : null}
												</div>
											</div>
											<div className="flex items-center gap-4 text-sm text-gray-600">
												{/* view icon */}
												<button title="ดู" className="text-gray-500 hover:text-rose-600 transition-colors">
													<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
														<path d="M8 3.5C4 3.5 1 8 1 8s3 4.5 7 4.5 7-4.5 7-4.5-3-4.5-7-4.5zm0 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
													</svg>
												</button>
												{/* delete icon with confirmation */}
												<Popconfirm
													title="ยืนยันการลบตอนนี้หรือไม่? เมื่อลบตอนแล้ว จะไม่สามารถกู้คืนได้"
													onConfirm={() => {
														const toSend = rawId ?? id
														handleDeleteEpisode(toSend)
													}}
													okText="ลบเลย"
													cancelText="ยกเลิก"
													okButtonProps={{ danger: true }}
													placement="top"
												>
													<button title="ลบ" className="text-gray-400 hover:text-rose-600 p-0 transition-colors">
														{deletingId === (rawId ?? id) ? <Spin size="small" /> : (
															<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"></path></svg>
														)}
													</button>
												</Popconfirm>
												{/* status text */}
												<div className={statusClass}>{statusLabel}</div>
												{/* edit link */}
												<button
													className="text-gray-600 hover:text-rose-600 text-sm flex items-center gap-1 transition-colors"
													onClick={() => {
														// ใช้ rawId ที่ดึงมารอไว้แล้ว (ep_id)
														const targetId = rawId ?? id;
														if (targetId) {
															// router.push(`/w/echapter/${targetId}`);
															window.open(`/w/echapter/${targetId}`, '_blank');
														} else {
															messageApi.error('ไม่พบ ID ตอน');
														}
													}}
												>
													<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
														<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" />
													</svg>
													<span className="text-sm">แก้ไข</span>
												</button>
												{/* coin pill */}
												{(() => {
													const regularPrice = coin ?? 0
													let promoPrice = ep.discount_price ?? ep.promotion_price ?? ep.price_promotion
													let activePromo: any = null

													// Check nested promotions array from user debug data
													if (Array.isArray(ep.promotions) && ep.promotions.length > 0) {
														activePromo = ep.promotions[0]
														if (activePromo && typeof activePromo.discount_price === 'number') {
															promoPrice = activePromo.discount_price
														}
													}

													const hasPromo = typeof promoPrice === 'number' && promoPrice < regularPrice && promoPrice >= 0

													if (hasPromo) {
														return (
															<div className='flex flex-col items-end gap-1'>
																<div className="flex items-center gap-1.5">
																	<span className="bg-rose-50 text-rose-600 text-[10px] px-1.5 py-0.5 rounded border border-rose-100 font-bold tracking-wide">SALE</span>
																	<span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
																	<span className="text-lg font-bold text-rose-600 leading-none">{promoPrice}</span>
																	<Image src="/images/e-coin.png" alt="Coin" width={18} height={18} className="opacity-90" />
																</div>
																{activePromo && (
																	<div className="flex items-center gap-1 text-[10px] text-gray-400 font-light">
																		<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
																		<span>{dayjs(activePromo.start_date).format('DD/MM/YY HH:mm')} - {dayjs(activePromo.end_date).format('DD/MM/YY HH:mm')}</span>
																	</div>
																)}
															</div>
														)
													}
													return (
														<div className='flex items-center gap-2'>
															<span>
																<Image src="/images/e-coin.png" alt="Coin" width={24} height={24} />
															</span>
															{regularPrice === 0 ? <span className="text-emerald-600 font-medium">อ่านฟรี</span> : <span className="font-medium text-gray-700">{regularPrice}</span>}
														</div>
													)
												})()}
											</div>
										</div>
									)
								})
							})()}
						</div>

					</div>
				)}
			</Modal>

			<section className="mb-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
				<h3 className="font-semibold mb-4 text-gray-800 text-lg">Tag</h3>
				<div className="flex flex-wrap gap-2">
					{(() => {
						const raw = (display as any).tag ?? (display as any).tags
						if (!raw) return <span className="text-gray-400 italic">ไม่มีแท็ก</span>
						let arr: string[] = []
						if (Array.isArray(raw)) {
							arr = raw
						} else if (typeof raw === 'string') {
							arr = raw.split(',').map((s: string) => s.trim()).filter(Boolean)
						}
						// Use TagSwiper for nicer horizontal scrolling of tags
						return <TagSwiper tags={arr} />
					})()}
				</div>
			</section>

			<section className="mb-8 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
				<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
					<div>
						<h3 className="font-semibold text-lg text-gray-800">สารบัญ</h3>
						<div className="text-sm text-gray-500 mt-1">{(groupsQuery.data?.filter((g: any) => (g.publish ?? g.status ?? 'private').toLowerCase() === 'publish').length ?? 0)} เล่ม / {computedVisibleEps} ตอน</div>
					</div>
					<ActionButton variant="danger" onClick={handleOpenAddGroup}>เพิ่มเล่ม</ActionButton>
				</div>
				<div className="px-0">
					{groupsQuery.isLoading ? (
						<div className="text-sm text-gray-600 px-4 py-6">กำลังโหลดสารบัญ...</div>
					) : groupsQuery.isError ? (
						<div className="text-sm text-red-500 px-4 py-6">ไม่สามารถโหลดสารบัญได้</div>
					) : (!groupsQuery.data || groupsQuery.data.length === 0) ? (
						<div className="text-sm text-gray-600 px-4 py-6">ยังไม่มีสารบัญ</div>
					) : (
						<ul className="divide-y divide-gray-100">
							{groupsQuery.data.filter((g: any) => (g.publish ?? g.status ?? 'private').toLowerCase() === 'publish').map((g: any) => (
								<li key={g.group_id} className="flex items-center justify-between px-4 py-4 bg-white">
									<div className="flex-1 min-w-0">
										<div className="text-gray-900 font-medium truncate">{g.name}</div>
										<div className="text-xs text-gray-500 mt-1">กลุ่ม #{g.group_id}</div>
									</div>
									<div className="flex items-center gap-4">
										<Popconfirm
											title="ยืนยันการลบเล่มนี้หรือไม่?"
											description="เมื่อลบแล้วจะไม่สามารถกู้คืนได้"
											onConfirm={() => handleDeleteGroup(g.group_id)}
											okText="ลบเลย"
											cancelText="ยกเลิก"
											okButtonProps={{ danger: true }}
										>
											<button title="ลบ" className="text-gray-500 hover:text-gray-800 p-2">
												<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"></path></svg>
											</button>
										</Popconfirm>
										<ActionButton variant="danger" onClick={() => handleOpenEditGroup(g)}>
											<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" /></svg>
											<span className="text-sm">แก้ไข</span>
										</ActionButton>
										<button
											style={{ color: '#ffffff' }}
											className="ml-2 bg-rose-600 text-white px-4 py-1 rounded-md text-sm"
											// เพิ่ม onClick ตรงนี้ เพื่อสั่งให้เปลี่ยนหน้าไปตาม group_id
											onClick={() => router.push(`/w/nchapter/${g.group_id}`)}
										>
											เพิ่มตอน
										</button>
										<button aria-label={`เปิดตอนของกลุ่ม ${g.group_id}`} onClick={() => openGroupModal(g.group_id)} className="ml-3 p-2 text-gray-400 hover:bg-gray-50 rounded">
											<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5"></path><path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194z"></path></svg>
										</button>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>



			<section className="mb-8 bg-white border border-gray-100 rounded shadow-sm">
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
					<h3 className="font-semibold">จัดการโปรโมชั่น</h3>
					<ActionButton variant="danger" onClick={() => setPromoModalOpen(true)}>เพิ่มโปรโมชั่น</ActionButton>
				</div>
				<div className="p-4">
					{(() => {
						const promos = (display as any).promos ?? []
						const dfb = (display as any).discount_full_book

						const items = [...promos]
						if (dfb) {
							items.push({
								id: dfb.dfb_id,
								name: dfb.subject,
								start: dayjs(dfb.start_date).format('DD/MM/YYYY HH:mm'),
								end: dayjs(dfb.end_date).format('DD/MM/YYYY HH:mm'),
								discount_percent: dfb.discount_percent,
								groupIDs: dfb.groupIDs ?? dfb.group_ids,
								raw: dfb
							})
						}

						if (items.length === 0) {
							return (
								<div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
									<p>ยังไม่มีโปรโมชั่น</p>
									<p className="text-xs mt-1">คลิก &quot;เพิ่มโปรโมชั่น&quot; เพื่อเริ่มสร้างโปรโมชั่นใหม่</p>
								</div>
							)
						}

						return (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{items.map((p: any) => (
									<div key={p.id} className="group relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-rose-200">
										<div className="flex justify-between items-start mb-2">
											<div className="bg-rose-50 text-rose-600 rounded-lg p-2.5">
												<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
													<path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											</div>
											{p.discount_percent && (
												<span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
													-{p.discount_percent}%
												</span>
											)}
										</div>

										<h4 className="font-bold text-gray-800 text-lg mb-1 truncate pr-8">{p.name}</h4>

										<div className="text-sm text-gray-500 space-y-1 mt-3">
											<div className="flex items-center gap-2">
												<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">เริ่ม</span>
												{p.start}
											</div>
											<div className="flex items-center gap-2">
												<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">สิ้นสุด</span>
												{p.end}
											</div>
										</div>

										<div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
											<button
												onClick={() => handleOpenEditPromotion(p)}
												className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
												title="แก้ไข"
											>
												<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" /></svg>
											</button>
											<Popover
												open={openPromoId === p.id}
												onOpenChange={(visible) => setOpenPromoId(visible ? p.id : null)}
												content={
													<div className="flex flex-col gap-3 p-3 bg-white rounded-md min-w-[160px]">
														<div className="text-sm text-gray-800 font-medium text-center">ยืนยันการลบ?</div>
														<div className="flex items-center justify-center gap-2">
															<button
																onClick={() => setOpenPromoId(null)}
																className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 border"
															>
																ยกเลิก
															</button>
															<button
																onClick={() => handleDeletePromotion(p.id)}
																className="bg-rose-600 text-white px-3 py-1 rounded text-sm hover:bg-rose-700 border border-rose-600"
															>
																ลบ
															</button>
														</div>
													</div>
												}
												trigger="click"
												placement="topRight"
											>
												<button className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="ลบ">
													<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"></path></svg>
												</button>
											</Popover>
										</div>
									</div>
								))}
							</div>
						)
					})()}
				</div>
			</section>

			{/* Add Promotion Modal */}
			<Modal
				open={promoModalOpen}
				onCancel={() => {
					setPromoModalOpen(false)
					setEditingPromoId(null)
					setPromoName('')
					setPromoDiscount(null)
					setPromoStart(null)
					setPromoEnd(null)
					setPromoSelectedGroups([])
				}}
				footer={null}
				title={editingPromoId ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}
				centered
			>
				<div className="py-4 space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">ชื่อโปรโมชั่น</label>
						<input
							type="text"
							className="w-full border rounded px-3 py-2"
							placeholder="ชื่อโปรโมชั่น"
							value={promoName}
							onChange={(e) => setPromoName(e.target.value)}
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">ส่วนลด (%)</label>
						<InputNumber
							min={1}
							max={100}
							className="w-full"
							placeholder="ระบุส่วนลด %"
							value={promoDiscount}
							onChange={(val) => setPromoDiscount(val)}
						/>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">วันเริ่มต้น</label>
							<DatePicker
								showTime
								format="YYYY-MM-DD HH:mm"
								className="w-full"
								placeholder="เลือกวันเริ่มต้น"
								value={promoStart}
								onChange={(val) => setPromoStart(val)}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">วันสิ้นสุด</label>
							<DatePicker
								showTime
								format="YYYY-MM-DD HH:mm"
								className="w-full"
								placeholder="เลือกวันสิ้นสุด"
								value={promoEnd}
								onChange={(val) => setPromoEnd(val)}
							/>
						</div>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">เลือกกลุ่มหนังสือ</label>
						<Select
							mode="multiple"
							className="w-full"
							placeholder="เลือกกลุ่มหนังสือ"
							value={promoSelectedGroups}
							onChange={(val) => setPromoSelectedGroups(val)}
							options={(groupsQuery.data ?? []).map((g: any) => ({
								label: g.name,
								value: String(g.group_id)
							}))}
						/>
					</div>
					<div className="flex justify-center mt-6">
						<button
							onClick={handleCreatePromotion}
							disabled={creatingPromo}
							className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
							style={{ color: '#ffffff' }}
						>
							{creatingPromo ? 'กำลังบันทึก...' : 'บันทึกโปรโมชั่น'}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
