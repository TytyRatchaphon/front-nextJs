"use client"
import React, { useEffect, useState } from 'react'
import { Image as AntdImage, Spin } from 'antd'
import type { BookDetail } from '@/types/api'
import { fetchBookDetail } from '@/services/apiServices'

const ActionButton: React.FC<{
	children: React.ReactNode
	variant?: 'danger' | 'ghost'
}> = ({ children, variant = 'danger' }) => {
	const base = 'inline-flex items-center justify-center px-4 py-1 rounded text-sm font-medium'
	const cls =
		variant === 'danger'
			? base + ' bg-rose-600 text-white hover:bg-rose-700'
			: base + ' bg-gray-100 text-gray-700'
	return <button className={cls}>{children}</button>
}

export default function EditMyBook({ book: initialBook, bookId }: { book?: Partial<BookDetail> | null; bookId?: string | null }) {
	const [book, setBook] = useState<Partial<BookDetail> | null>(initialBook || null)
	const [dataSource, setDataSource] = useState<'prop' | 'session' | 'api' | 'none'>(initialBook ? 'prop' : 'none')
	const [debugOpen, setDebugOpen] = useState(false)

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
			if (!loaded && bookId) {
				log('no session; fetching book detail for', bookId)
				fetchBookDetail(bookId)
					.then((data) => {
						log('fetchBookDetail result:', data)
						if (mounted) {
							setBook(data)
							setDataSource('api')
						}
					})
					.catch((err) => {
						log('fetchBookDetail error', err)
					})
			}
		}

		return () => {
			mounted = false
		}
	}, [initialBook, bookId])

	// No mock fallback: require real data (from prop, sessionStorage or API)
	const display = book

	// While no book data, show a loading indicator (avoid using mock values)
	if (!display) {
		return (
			<div className="max-w-5xl mx-auto py-10 px-6">
				<div className="flex items-center justify-center py-24">
					<Spin tip="กำลังโหลดข้อมูล..." />
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
	}

	return (
		<div className="max-w-5xl mx-auto py-10 px-6">
			<div className="flex items-start gap-6">
				<AntdImage
					src={(display as any).img ?? (display as any).cover}
					alt="cover"
					width={144}
					preview={{
						mask: <div className="text-white">preview</div>,
					}}
					className="rounded shadow object-cover border"
				/>
				<div className="flex-1">
					<h1 className="text-2xl font-semibold">{(display as any).name}</h1>
					<div className="text-sm text-gray-600 mt-1">โดย : {(display as any)['writer.writer_name'] ?? (display as any).author}</div>

					<div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
						<div>👁️ {(display as any).view ?? (display as any).views}</div>
						<div>💬 {(display as any).comment ?? (display as any).comments}</div>
						<div>👍 {(display as any).heart ?? (display as any).likes}</div>
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

			<section className="mb-8">
				<h3 className="font-semibold mb-3">Tag</h3>
				<div className="flex flex-wrap gap-2">
					{((display as any).tag ?? (display as any).tags ?? []).map((t: string) => (
						<span
							key={t}
							className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm"
						>
							{t}
						</span>
					))}
				</div>
			</section>

			<section className="mb-8 bg-white border rounded">
				<div className="flex items-center justify-between px-4 py-3 border-b">
					<h3 className="font-semibold">สารบัญ</h3>
					<ActionButton variant="danger">เพิ่มเล่ม</ActionButton>
				</div>
				<ul>
					{((display as any).toc ?? [{ id: 1, title: 'ไม่รู้ว่่า' }]).map((item: any) => (
						<li key={item.id} className="flex items-center justify-between px-4 py-3">
							<div className="text-gray-800">{item.title}</div>
							<div className="flex items-center gap-3">
								<button title="ลบ" className="text-gray-400 hover:text-gray-700">🗑️</button>
								<button title="แก้ไข" className="text-gray-400 hover:text-gray-700">✏️</button>
								<ActionButton variant="danger">เพิ่มตอน</ActionButton>
							</div>
						</li>
					))}
				</ul>
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