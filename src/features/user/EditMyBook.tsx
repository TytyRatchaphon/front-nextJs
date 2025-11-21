"use client"
import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Image as AntdImage, Spin, Modal, Popconfirm, message, Empty, Dropdown, Select } from 'antd'
import type { BookDetail } from '@/types/api'
import { TagSwiper } from '@/components/ImageSlider'
import { fetchBookDetail, fetchBookGroups, fetchGroupEpisodes, deleteGroupEpisode, createGroup, updateEpisodesPrice } from '@/services/apiServices'
import Image from 'next/image'

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
	const [book, setBook] = useState<Partial<BookDetail> | null>(initialBook || null)
	const [, setDataSource] = useState<'prop' | 'session' | 'api' | 'none'>(initialBook ? 'prop' : 'none')
	const [debugOpen, setDebugOpen] = useState(false)

	// Antd message api (avoid static message warning in App Router)
	const [messageApi, messageContextHolder] = message.useMessage()
	// Use Modal.useModal to avoid static Modal.confirm warnings in App Router
	const [modalApi, modalContextHolder] = Modal.useModal()

	// runtime debug helpers
	const log = (...args: any[]) => {
		try {
			console.debug('[EditMyBook]', ...args)
		} catch (e) {
			// ignore
		}
	}

	useEffect(() => {
		let mounted = true

		const tryLoadFromSession = (): boolean => {
			if (!bookId || typeof window === 'undefined') return false
			try {
				const raw = sessionStorage.getItem(`editBook_${bookId}`)
				log('session raw for', bookId, raw)
				if (raw) {
					const parsed = JSON.parse(raw)
					log('parsed session book:', parsed)
					if (mounted) {
						setBook(parsed)
						setDataSource('session')
					}
					// remove cached version to avoid stale reads next time
					sessionStorage.removeItem(`editBook_${bookId}`)
					return true
				}
			} catch (e) {
				log('EditMyBook: session load failed', e)
			}
			return false
		}

		if (!initialBook) {
			const loaded = tryLoadFromSession()
			if (!loaded) {
				// let react-query handle fetching (see useQuery below)
				log('no session; will load via react-query for', bookId)
			}
		} else {
			// if initialBook was provided via props, set state accordingly
			setBook(initialBook)
			setDataSource('prop')
		}

		return () => {
			mounted = false
		}
	}, [initialBook, bookId])

	// Use react-query so the request appears in TanStack DevTools
	const query = useQuery<BookDetail, any>({
		queryKey: ['bookDetail', String(bookId ?? '')],
		queryFn: async () => {
			if (!bookId) throw new Error('no bookId')
			log('react-query fetching book detail for', bookId)
			const data = await fetchBookDetail(String(bookId))
			return data
		},
		enabled: !!bookId,
	})

	useEffect(() => {
		if (query.data) {
			log('react-query fetched book detail (effect):', query.data)
			setBook(query.data)
			setDataSource('api')
		}
		if (query.error) {
			log('react-query fetch error (effect):', query.error)
		}
	}, [query.data, query.error])

  // Fetch groups for TOC using management API
  const groupsQuery = useQuery<any[], any>({
    queryKey: ['bookGroups', String(bookId ?? '')],
    queryFn: async () => {
      if (!bookId) return [];
      return await fetchBookGroups(String(bookId));
    },
    enabled: !!bookId,
  });

	// Group episodes modal state
	const [selectedGroupId, setSelectedGroupId] = useState<string | number | null>(null);
	const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

	// Add-group modal state
	const [addGroupModalOpen, setAddGroupModalOpen] = useState(false)
	const [newGroupName, setNewGroupName] = useState('')
	const [creatingGroup, setCreatingGroup] = useState(false)
	const [newGroupError, setNewGroupError] = useState<string | null>(null)

	const validateGroupName = (name: string) => {
		const v = String(name ?? '').trim()
		if (!v) return 'กรุณาใส่ชื่อเล่ม'
		if (v.length < 3) return 'ชื่อต้องมีอย่างน้อย 3 ตัวอักษร'
		// check duplicate against fetched groups (case-insensitive)
		try {
			const existing = (groupsQuery.data ?? []) as any[]
			const lower = v.toLowerCase()
			if (existing.some((g: any) => String(g.name ?? g.title ?? '').toLowerCase().trim() === lower)) {
				return 'ชื่อนี้มีอยู่แล้ว'
			}
		} catch (e) {
			// ignore
		}
		return null
	}

	const openGroupModal = (groupId: string | number) => {
		setSelectedGroupId(groupId);
		setIsGroupModalOpen(true);
	}

	const closeGroupModal = () => {
		setIsGroupModalOpen(false);
		setSelectedGroupId(null);
	}

	// Fetch episodes for selected group
	const groupEpisodesQuery = useQuery({
		queryKey: ['groupEps', String(selectedGroupId ?? '')],
		queryFn: async () => {
			if (!selectedGroupId) return { episodes: [] };
			return await fetchGroupEpisodes(String(selectedGroupId));
		},
		enabled: !!selectedGroupId && isGroupModalOpen,
	});

	// Deleting state for episode delete action
	const [deletingId, setDeletingId] = useState<string | number | null>(null);
	// confirmation modal shown after successful delete
	const [confirmModalOpen, setConfirmModalOpen] = useState(false)

	// Selection state for bulk operations (normalize to string keys)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [selectAllChecked, setSelectAllChecked] = useState(false)
	const [, setDeletingBulk] = useState(false)

	// Bulk price edit modal state
	const [priceModalOpen, setPriceModalOpen] = useState(false)
	const [priceSelected, setPriceSelected] = useState<number | null>(null)
	const [priceSubmitting, setPriceSubmitting] = useState(false)
	const [modalSelectedEpIds, setModalSelectedEpIds] = useState<string[]>([])

	const handleDeleteEpisode = async (episodeId: string | number) => {
		try {
			setDeletingId(episodeId)
			// pass selectedGroupId when available to increase chance of calling correct endpoint
			await deleteGroupEpisode(episodeId, selectedGroupId ?? undefined)
			messageApi.success('ลบตอนเรียบร้อย')
			// show confirmation modal
			setConfirmModalOpen(true)
			// refetch episodes for the group
			groupEpisodesQuery.refetch()
		} catch (err: any) {
			console.error('delete episode failed', err)
			// Show more helpful error (status + message if available)
			const status = err?.response?.status
			const serverMsg = err?.response?.data?.message ?? err?.response?.data ?? err?.message
			messageApi.error(status ? `ไม่สามารถลบตอนได้ (${status})` : 'ไม่สามารถลบตอนได้')
			// also log to console the server message to help debugging
			console.debug('Server delete error detail:', serverMsg)
		} finally {
			setDeletingId(null)
		}
	}

	const toggleSelect = (epId: string | number) => {
		const key = String(epId)
		setSelectedIds((prev) => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			setSelectAllChecked(false)
			return next
		})
	}

	const handleSelectAll = (checked: boolean, allIds: (string | number)[]) => {
		if (checked) {
			setSelectedIds(new Set(allIds.map((x) => String(x))))
			setSelectAllChecked(true)
		} else {
			setSelectedIds(new Set())
			setSelectAllChecked(false)
		}
	}

	const handleBulkDelete = async (idsArg?: (string | number)[]) => {
		const ids = (idsArg && idsArg.length > 0) ? idsArg.map((x) => String(x)) : Array.from(selectedIds)
		if (!ids || ids.length === 0) return
		const toDelete = ids.filter(Boolean)
		setDeletingBulk(true)
		let success = 0
		let failed = 0
		await Promise.allSettled(
			toDelete.map(async (eid) => {
				try {
					// deleteGroupEpisode accepts string id; service will normalize as needed
					await deleteGroupEpisode(eid, selectedGroupId ?? undefined)
					success += 1
				} catch (e) {
					failed += 1
					console.error('bulk delete error for', eid, e)
				}
			})
		)
		setDeletingBulk(false)
		// refresh
		groupEpisodesQuery.refetch()
		setSelectedIds(new Set())
		setSelectAllChecked(false)
		if (success > 0) {
			messageApi.success(`ลบสำเร็จ ${success} รายการ`)
			// show confirmation modal when at least one deleted
			setConfirmModalOpen(true)
		}
		if (failed > 0) messageApi.error(`ลบไม่สำเร็จ ${failed} รายการ`)
	}

	// No mock fallback: require real data (from prop, sessionStorage or API)
	const display = book

	// Compute episode count that excludes private/draft/unlisted when possible.
	// Use state + effect so we can optionally fetch per-group episodes when groups don't include lists.
	const [computedVisibleEps, setComputedVisibleEps] = useState<number>(Number((display as any)?.total_eps ?? 0))

	useEffect(() => {
		let mounted = true
		const run = async () => {
			try {
				const groups = (groupsQuery?.data ?? [])
				if (!Array.isArray(groups) || groups.length === 0) {
					if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0))
					return
				}

				// If groups already include episode arrays, compute directly
				const hasEpisodesArray = groups.some((g: any) => Array.isArray(g.episodes) || Array.isArray(g.eps) || Array.isArray(g.list))
				if (hasEpisodesArray) {
					const total = groups.reduce((acc: number, g: any) => {
						const arr = g.episodes ?? g.eps ?? g.list ?? []
						const visible = arr.filter((e: any) => {
							const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
							return s === 'publish' || s === 'published'
						})
						return acc + visible.length
					}, 0)
					if (mounted) setComputedVisibleEps(total)
					return
				}

				// If groups expose per-group totals, sum those
				const hasPerGroupTotals = groups.some((g: any) => typeof g.total_eps === 'number' || typeof g.totalEps === 'number' || typeof g.count === 'number')
				if (hasPerGroupTotals) {
					const total = groups.reduce((acc: number, g: any) => acc + (g.total_eps ?? g.totalEps ?? g.count ?? 0), 0)
					if (mounted) setComputedVisibleEps(total)
					return
				}

				// As a last effort: if the number of groups is small, fetch each group's episodes to compute published count.
				if (groups.length > 0 && groups.length <= 12) {
					const results = await Promise.all(groups.map(async (g: any) => {
						try {
							const gid = g.group_id ?? g.groupId ?? g.id
							if (!gid) return []
							const resp: any = await fetchGroupEpisodes(String(gid))
							return resp?.episodes ?? resp?.list ?? []
						} catch (e) {
							return []
						}
					}))
					const flat = results.flat()
					const total = flat.filter((e: any) => {
						const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
						return s === 'publish' || s === 'published'
					}).length
					if (mounted) setComputedVisibleEps(total)
					return
				}

				// fallback to display total_eps
				if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0))
			} catch (e) {
				if (mounted) setComputedVisibleEps(Number((display as any)?.total_eps ?? 0))
			}
		}
		run()
		return () => {
			mounted = false
		}
	}, [groupsQuery.data, display])

	// Ensure Image src is valid for next/image: must start with '/' or 'http'
	const safeImageSrc = (maybe: any) => {
		try {
			if (!maybe) return '/images/ejb.png'
			if (typeof maybe !== 'string') return '/images/ejb.png'
			if (maybe.startsWith('/') || maybe.startsWith('http')) return maybe
			// if it's a bare filename or invalid, fallback to project image
			return '/images/ejb.png'
		} catch (e) {
			return '/images/ejb.png'
		}
	}

	// Canonical book name getter - handle different backend shapes
	const getBookName = (d: any) => {
		if (!d) return ''
		// possible fields the backend may use for title/name
		const candidates = [
			d?.name,
			d?.title,
			d?.book?.name,
			d?.book_name,
			d?.bookName,
			d?.name_th,
		]
		for (const c of candidates) {
			if (c === 0) return '0'
			if (typeof c === 'string' && c.trim()) return c.trim()
			if (typeof c === 'number') return String(c)
		}
		return ''
	}

	// While no book data, show a loading indicator (avoid using mock values)
	if (!display) {
		return (
			<div className="max-w-5xl mx-auto py-10 px-6">
				<div className="flex items-center justify-center py-24">
					<div className="flex flex-col items-center">
						<Spin />
						<div className="text-sm text-gray-600 mt-2">กำลังโหลดข้อมูล...</div>
					</div>
				</div>
			</div>
		)
	}


		// Debug panel UI
		const debugData = {
			initialBook,
			bookId,
			sessionSnapshot: (() => {
				try {
					if (typeof window !== 'undefined' && bookId) {
						return sessionStorage.getItem(`editBook_${bookId}`)
					}
				} catch (e) {
					return String(e)
				}
				return null
			})(),
			fetchedBook: book,
			display,
			computedVisibleEps,
		}

	return (
		<div className="max-w-5xl mx-auto py-10 px-6">
			{messageContextHolder}
			{modalContextHolder}

			{/* Add Group Modal */}
			<Modal
				open={addGroupModalOpen}
				onCancel={() => setAddGroupModalOpen(false)}
				footer={null}
				title="เพิ่มเล่มนิยาย"
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
							onClick={async () => {
								const trimmed = String(newGroupName ?? '').trim()
								const err = validateGroupName(trimmed)
								setNewGroupError(err)
								if (err) return messageApi.error(err)
								if (!bookId) return messageApi.error('ไม่พบ bookId')
								try {
									setCreatingGroup(true)
									await createGroup(String(bookId), trimmed)
									messageApi.success('สร้างเล่มเรียบร้อย')
									setAddGroupModalOpen(false)
									setNewGroupName('')
									setNewGroupError(null)
									groupsQuery.refetch()
								} catch (e: any) {
									console.error('createGroup failed', e)
									messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถสร้างเล่มได้')
								} finally {
									setCreatingGroup(false)
								}
							}}
							disabled={creatingGroup || Boolean(newGroupError) || !newGroupName.trim()}
							className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
							style={{ color: '#ffffff' }}
						>
							{creatingGroup ? 'กำลังสร้าง...' : 'ตกลง'}
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
					</div>
					<div className="flex justify-center mt-6">
						<button
							onClick={async () => {
								if (!modalSelectedEpIds || modalSelectedEpIds.length === 0) return messageApi.info('ไม่มีตอนที่เลือก')
								if (priceSelected === null) return messageApi.error('โปรดเลือกราคา')
								try {
									setPriceSubmitting(true)
									await updateEpisodesPrice(modalSelectedEpIds, priceSelected)
									messageApi.success('แก้ไขราคาสำเร็จ')
									setPriceModalOpen(false)
									// refresh lists
									groupEpisodesQuery.refetch()
									groupsQuery.refetch()
								} catch (e: any) {
									console.error('updateEpisodesPrice error', e)
									messageApi.error(e?.response?.data?.message ?? 'ไม่สามารถแก้ไขราคาได้')
								} finally {
									setPriceSubmitting(false)
								}
							}}
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
			<div className="flex items-start gap-6">
				<AntdImage
					src="/images/ejb.png"
					alt="cover"
					width={144}
					preview={{
						mask: <div className="text-white">preview</div>,
					}}
					className="rounded-lg shadow-lg object-cover border"
				/>
				<div className="flex-1">
					<h1 className="text-2xl font-bold text-black leading-tight truncate">{getBookName(display) || 'ไม่ระบุชื่อหนังสือ'}</h1>
					<div className="text-lg text-black mt-6">โดย : {(display as any).author ?? (display as any).writer_fullname ?? 'ไม่ระบุ'}</div>
					{(display as any).title || (display as any).title ? (
						<div className="text-lg text-black mt-6 max-w-2xl">{(display as any).title ?? (display as any).title}</div>
					) : null}
					<div className="flex items-center gap-4 text-sm text-gray-600 mt-13">
						<div className='flex items-center gap-2'>
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
								<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"></path>
								<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"></path>
							</svg>	
							{(display as any).view ?? (display as any).views}</div>
						<div className='flex items-center gap-2'> 
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
									<path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m-3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2m0 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2"></path>
							</svg> 
							{(display as any).total_eps ?? (display as any).total_eps}</div>
						<div className='flex items-center gap-2'>
							<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
								<path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783"></path>
							</svg> 
							{(display as any).total_groups ?? (display as any).total_groups}</div>
					</div>
				</div>
			</div>

			<hr className="my-8" />

			<section className="mb-8">
				<div className="flex items-center justify-between">
					<h2 className="font-semibold">รายละเอียด</h2>
					<ActionButton>แก้ไข</ActionButton>
				</div>
				<p className="text-gray-700 mt-4">{(display as any).title ?? (display as any).title}</p>
			</section>

			{/* Group episodes modal */}
			<Modal
				open={isGroupModalOpen}
				title={`ตอนในกลุ่ม ${selectedGroupId ?? ''}`}
				onCancel={closeGroupModal}
				footer={null}
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
						{/* Episodes list */}
						<div className="space-y-2">
							{(() => {
								const rawPayload = groupEpisodesQuery.data ?? []
								let episodesRaw: any[] = []
								if (Array.isArray(rawPayload)) episodesRaw = rawPayload
								else if (rawPayload && Array.isArray((rawPayload as any).episodes)) episodesRaw = (rawPayload as any).episodes
								else if (rawPayload && Array.isArray((rawPayload as any).list)) episodesRaw = (rawPayload as any).list
								else if (rawPayload && Array.isArray((rawPayload as any).data)) episodesRaw = (rawPayload as any).data
								else episodesRaw = []

								// Only show published episodes on this page; filter out private/draft/unlisted
								const visibleEpisodes = episodesRaw.filter((e: any) => {
									const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
									return s === 'publish' || s === 'published'
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
								if (rawStatus === 'publish' || rawStatus === 'published') {
									statusLabel = 'เผยแพร่แล้ว'
									statusClass = 'text-xs text-gray-600'
								} else if (rawStatus === 'private' || rawStatus === 'draft' || rawStatus === 'unlisted') {
									statusLabel = 'ส่วนตัว'
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
												<path d="M8 3.5C4 3.5 1 8 1 8s3 4.5 7 4.5 7-4.5 7-4.5-3-4.5-7-4.5zm0 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
												</svg>
											</button>
											{/* delete icon with confirmation */}
											<Popconfirm
												title="ยืนยันการลบตอนนี้หรือไม่? เมื่อลบตอนแล้ว จะไม่สามารถกู้คืนได้"
												onConfirm={() => {
													const toSend = rawId ?? id
													console.debug('[EditMyBook] Deleting episode - canonical id:', toSend, 'raw ep object:', ep)
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
											<button className="text-gray-600 hover:text-rose-600 text-sm flex items-center gap-1 transition-colors">
												<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
												<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z"/>
												</svg>
												<span className="text-sm">แก้ไข</span>
											</button>
											{/* coin pill */}
											<div className='flex gap-2'>
												<span>
													<Image src="/images/e-coin.png" alt="Coin" width={24} height={24} />
												</span>
												{coin === 0 ? 'อ่านฟรี' : `${coin} `}
											</div>
									</div>
								</div>
							)
								})
							})()}
						</div>
						{/* footer controls: select all + manage */}
						<div className="mt-3 flex items-center gap-4">
							{(() => {
								const allIds = (groupEpisodesQuery.data?.episodes ?? []).filter((e: any) => {
									const s = (e.publish ?? e.status ?? e.visibility ?? '').toString().toLowerCase()
									return s === 'publish' || s === 'published'
								}).map((ep: any, idx: number) => {
									const rid = ep.ep_id ?? ep.epID ?? ep.episode_id ?? ep.id ?? ep.eid
									return rid ?? `ep_${String(selectedGroupId ?? 'g')}_${idx}`
								})

								const getVisibleIds = () => allIds

								const handleMenuClick = ({ key }: any) => {
									if (key === 'deleteAll') {
										const ids = getVisibleIds()
										if (!ids || ids.length === 0) {
											messageApi.info('ไม่มีตอนที่เผยแพร่ให้ลบ')
											return
										}
										// confirm then run bulk delete with provided ids (use modal instance)
										modalApi.confirm({
											title: `ยืนยันการลบ ${ids.length} ตอนทั้งหมด?`,
											onOk: async () => {
												await handleBulkDelete(ids)
											},
											okText: 'ลบเลย',
											cancelText: 'ยกเลิก',
											okButtonProps: { danger: true },
											cancelButtonProps: {
												// force red text + subtle red hover background; use inline style for reliability
												style: { color: '#dc2626' },
												className: '!text-rose-600 hover:!bg-rose-50'
											}
										})
									} else if (key === 'editPrice') {
										const ids = getVisibleIds()
										if (!ids || ids.length === 0) {
											messageApi.info('ไม่มีตอนที่เผยแพร่')
											return
										}
										// open bulk price modal and pass ids
										setModalSelectedEpIds(ids.map((x: any) => String(x)))
										setPriceSelected(null)
										setPriceModalOpen(true)
									}
								}

								const items = [
									{ key: 'editPrice', label: 'แก้ไขราคาเลือกทั้งหมด' },
									{ key: 'deleteAll', label: 'ลบเลือกทั้งหมด' },
								]

								return (
									<>
										<label className="flex items-center gap-2 text-sm text-gray-700">
											<input type="checkbox" className="w-4 h-4 accent-rose-600 rounded border-gray-300" checked={selectAllChecked} onChange={(e) => handleSelectAll(e.target.checked, allIds)} />
											<span>เลือกทั้งหมด</span>
										</label>
										<Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight">
											<button className="ml-auto inline-flex items-center gap-2 px-3 py-1 rounded text-sm bg-white border text-gray-700 hover:bg-gray-50">
												<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
													<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z"/>
												</svg>
												<span>จัดการ</span>
											</button>
										</Dropdown>
									</>
								)
							})()}
						</div>
					</div>
				)}
			</Modal>

			<section className="mb-8">
				<h3 className="font-semibold mb-3 rounded-">Tag</h3>
				<div className="flex flex-wrap gap-2">
					{(() => {
						const raw = (display as any).tag ?? (display as any).tags
						if (!raw) return null
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

			<section className="mb-8 bg-gray-50 rounded">
				<div className="flex items-start justify-between px-4 py-3 border-b">
					<div>
						<h3 className="font-semibold">สารบัญ</h3>
						<div className="text-sm text-gray-500 mt-1">{(display as any)?.total_groups ?? groupsQuery.data?.length ?? 0} เล่ม / {computedVisibleEps} ตอน</div>
					</div>
					<ActionButton variant="danger" onClick={() => setAddGroupModalOpen(true)}>เพิ่มเล่ม</ActionButton>
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
							{groupsQuery.data.map((g: any) => (
								<li key={g.group_id} className="flex items-center justify-between px-4 py-4 bg-white">
									<div className="flex-1 min-w-0">
										<div className="text-gray-900 font-medium truncate">{g.name}</div>
										<div className="text-xs text-gray-500 mt-1">กลุ่ม #{g.group_id} • ราคา: {g.coin ?? 0}</div>
									</div>
									<div className="flex items-center gap-4">
										<button title="ลบ" className="text-gray-500 hover:text-gray-800 p-2">
											<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 5.5v6h1v-6h-1zm3 0v6h1v-6h-1z"/><path d="M14 3.5h-3.5l-1-1h-5l-1 1H2v1h12v-1z"/></svg>
										</button>
										<ActionButton variant="danger">
											<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z"/></svg>
											<span className="text-sm">แก้ไข</span>
										</ActionButton>
										<button style={{ color: '#ffffff' }} className="ml-2 bg-rose-600 text-white px-4 py-1 rounded-md text-sm">เพิ่มตอน</button>
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

			{/* Debug inspector (toggleable) */}
			<div className="mt-6">
				<button
					className="text-xs text-gray-600 underline"
					onClick={() => setDebugOpen((s) => !s)}
				>
					{debugOpen ? 'ซ่อน debug' : 'แสดง debug'}
				</button>
				{debugOpen && (
					<div className="mt-2 p-3 bg-gray-50 border rounded text-xs text-gray-700">
						<pre className="whitespace-pre-wrap max-h-72 overflow-auto">{JSON.stringify(debugData, null, 2)}</pre>
					</div>
				)}
			</div>

			<section className="mb-8 bg-white border rounded">
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<h3 className="font-semibold">จัดการโปรโมชั่น</h3>
					<ActionButton variant="danger">เพิ่มโปรโมชั่น</ActionButton>
				</div>
				<ul>
					{((display as any).promos ?? []).map((p: any) => (
						<li key={p.id} className="flex items-center justify-between px-4 py-3">
							<div className="text-gray-800">{p.name}</div>
							<div className="flex items-center gap-4 text-sm text-gray-500">
								<div className="text-right">
									<div>{p.start}</div>
									<div>{p.end}</div>
								</div>
								<div className="flex items-center gap-2">
									<button title="ลบ" className="text-gray-400 hover:text-gray-700">🗑️</button>
									<button title="แก้ไข" className="text-gray-400 hover:text-gray-700">✏️</button>
								</div>
							</div>
						</li>
					))}
				</ul>
			</section>
		</div>
	)
}