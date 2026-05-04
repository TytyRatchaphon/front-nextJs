"use client";

import Image from "next/image";
import dayjs from "dayjs";
import { Dropdown, Empty, Modal, Popconfirm, Segmented, Spin } from "antd";
import type { MenuProps } from "antd";

type EditBookEpisodesModalProps = {
	open: boolean;
	selectedGroupId: string | number | null | undefined;
	groupEpisodesQuery: any;
	episodeFilter: string;
	selectedIds: Set<string>;
	selectAllChecked: boolean;
	deletingId: string | number | null | undefined;
	onClose: () => void;
	onFilterChange: (value: any) => void;
	onClearSelection: () => void;
	onSelectAll: (checked: boolean, allIds: any[]) => void;
	onMenuClick: NonNullable<MenuProps["onClick"]>;
	onToggleSelect: (episodeId: string) => void;
	onDeleteEpisode: (episodeId: any) => void;
	onMissingEpisodeId: () => void;
};

export function EditBookEpisodesModal({
	open,
	selectedGroupId,
	groupEpisodesQuery,
	episodeFilter,
	selectedIds,
	selectAllChecked,
	deletingId,
	onClose,
	onFilterChange,
	onClearSelection,
	onSelectAll,
	onMenuClick,
	onToggleSelect,
	onDeleteEpisode,
	onMissingEpisodeId,
}: EditBookEpisodesModalProps) {
	const allIds = (groupEpisodesQuery.data?.episodes ?? [])
		.filter((episode: any) => {
			const status = (episode.publish ?? episode.status ?? episode.visibility ?? "").toString().toLowerCase();
			return status === "publish" || status === "published";
		})
		.map((episode: any, index: number) => {
			const rawId = episode.ep_id ?? episode.epID ?? episode.episode_id ?? episode.id ?? episode.eid;
			return rawId ?? `ep_${String(selectedGroupId ?? "g")}_${index}`;
		});

	const menuItems = [
		{ key: "editPrice", label: "แก้ไขราคาเลือกทั้งหมด" },
		{ key: "set_promotion", label: "ตั้งค่าส่วนลด" },
		{ key: "cancel_promotion", label: "ยกเลิกส่วนลดที่เลือกทั้งหมด", danger: true },
		{ key: "deleteAll", label: "ลบเลือกทั้งหมด", danger: true },
	];

	const renderEpisodes = () => {
		const rawPayload = groupEpisodesQuery.data ?? [];
		let episodesRaw: any[] = [];
		if (Array.isArray(rawPayload)) episodesRaw = rawPayload;
		else if (rawPayload && Array.isArray((rawPayload as any).episodes)) episodesRaw = (rawPayload as any).episodes;
		else if (rawPayload && Array.isArray((rawPayload as any).list)) episodesRaw = (rawPayload as any).list;
		else if (rawPayload && Array.isArray((rawPayload as any).data)) episodesRaw = (rawPayload as any).data;
		else episodesRaw = [];

		const visibleEpisodes = episodesRaw.filter((episode: any) => {
			const status = (episode.publish ?? episode.status ?? episode.visibility ?? "").toString().toLowerCase();
			if (status === "private") return false;

			if (episodeFilter === "published") {
				return status === "publish" || status === "published";
			}
			if (episodeFilter === "wait") {
				return status === "wait";
			}
			return true;
		});

		if (!visibleEpisodes || visibleEpisodes.length === 0) {
			return (
				<div className="py-8">
					<Empty description="No Data" />
				</div>
			);
		}

		return visibleEpisodes.map((episode: any, index: number) => {
			const rawId = episode.ep_id ?? episode.epID ?? episode.episode_id ?? episode.id ?? episode.eid;
			const id = rawId ?? `ep_${String(selectedGroupId ?? "g")}_${index}`;
			const canonicalKey = String(rawId ?? id);
			const title = episode.title ?? episode.name ?? "ไม่มีชื่อ";
			const desc = episode.short ?? episode.short_desc ?? "";
			const coin = episode.coin ?? episode.price ?? null;
			const isChecked = selectedIds.has(canonicalKey);
			const rawStatus = (episode.publish ?? episode.status ?? episode.visibility ?? "")?.toString().toLowerCase();
			let statusLabel = "สถานะไม่ทราบ";
			let statusClass = "text-xs text-gray-600";
			const publishDate = episode.publish_datetime ? dayjs(episode.publish_datetime) : null;
			const now = dayjs();

			if (publishDate && publishDate.isValid() && publishDate.isAfter(now)) {
				statusLabel = `เผยแพร่: ${publishDate.format("DD/MM/YYYY HH:mm")}`;
				statusClass = "text-xs text-orange-500 font-medium";
			} else if (rawStatus === "publish" || rawStatus === "published") {
				statusLabel = "เผยแพร่แล้ว";
				statusClass = "text-xs text-gray-600";
			} else if (rawStatus === "wait") {
				statusLabel = "รออนุมัติ";
				statusClass = "text-xs text-amber-600";
			}

			return (
				<div key={id} className="ejb-episode-row flex items-center justify-between py-4 px-4 bg-white rounded-md border border-gray-100 hover:bg-gray-50 transition-colors">
					<div className="flex items-center gap-4 min-w-0">
						<input
							type="checkbox"
							className="w-5 h-5 accent-rose-600 rounded border-gray-300"
							aria-label={`เลือกตอน ${title}`}
							checked={isChecked}
							onChange={() => onToggleSelect(canonicalKey)}
						/>
						<div className="min-w-0">
							<div className="text-sm font-medium text-gray-800 truncate">{title}</div>
							{desc ? <div className="text-xs text-gray-500 truncate">{desc}</div> : null}
						</div>
					</div>
					<div className="flex items-center gap-4 text-sm text-gray-600">
						<button title="ดู" className="text-gray-500 hover:text-rose-600 transition-colors">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
								<path d="M8 3.5C4 3.5 1 8 1 8s3 4.5 7 4.5 7-4.5 7-4.5-3-4.5-7-4.5zm0 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
							</svg>
						</button>
						<Popconfirm
							title="ยืนยันการลบตอนนี้หรือไม่? เมื่อลบตอนแล้ว จะไม่สามารถกู้คืนได้"
							onConfirm={() => onDeleteEpisode(rawId ?? id)}
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
						<div className={statusClass}>{statusLabel}</div>
						<button
							className="text-gray-600 hover:text-rose-600 text-sm flex items-center gap-1 transition-colors"
							onClick={() => {
								const targetId = rawId ?? id;
								if (targetId) {
									window.open(`/w/echapter/${targetId}`, "_blank");
								} else {
									onMissingEpisodeId();
								}
							}}
						>
							<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
								<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" />
							</svg>
							<span className="text-sm">แก้ไข</span>
						</button>
						{renderEpisodePrice(episode, coin)}
					</div>
				</div>
			);
		});
	};

	return (
		<Modal
			open={open}
			title={`ตอนในกลุ่ม ${selectedGroupId ?? ""}`}
			onCancel={onClose}
			footer={
				<div className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border-t border-gray-100 rounded-b-lg">
					<label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
						<input
							type="checkbox"
							className="w-4 h-4 accent-rose-600 rounded border-gray-300 cursor-pointer"
							checked={selectAllChecked}
							onChange={(e) => onSelectAll(e.target.checked, allIds)}
						/>
						<span>เลือกทั้งหมด ({selectedIds.size})</span>
					</label>
					<div className="flex gap-2">
						<Dropdown menu={{ items: menuItems, onClick: onMenuClick }} placement="topRight">
							<button className="inline-flex items-center gap-2 px-4 py-1.5 rounded text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
								<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
									<path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" />
								</svg>
								<span>จัดการ ({selectedIds.size})</span>
							</button>
						</Dropdown>
						<button
							onClick={onClose}
							className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200 transition-colors"
						>
							ปิด
						</button>
					</div>
				</div>
			}
			width={1000}
			styles={{ body: { maxHeight: "64vh", overflowY: "auto", padding: "0.5rem 1rem" } }}
		>
			{groupEpisodesQuery.isLoading ? (
				<div className="text-sm text-gray-600">กำลังโหลดตอน...</div>
			) : groupEpisodesQuery.isError ? (
				<div className="text-sm text-red-500">ไม่สามารถโหลดตอนของกลุ่มนี้ได้</div>
			) : (
				<div className="w-full">
					<div className="flex justify-start mb-4">
						<Segmented
							options={[
								{ label: "ทั้งหมด", value: "all" },
								{ label: "เผยแพร่แล้ว", value: "published" },
								{ label: "รออนุมัติ", value: "wait" },
							]}
							value={episodeFilter}
							onChange={(value) => {
								onFilterChange(value);
								onClearSelection();
							}}
						/>
					</div>
					<div className="space-y-2">{renderEpisodes()}</div>
				</div>
			)}
		</Modal>
	);
}

function renderEpisodePrice(episode: any, coin: number | null) {
	const regularPrice = coin ?? 0;
	let promoPrice = episode.discount_price ?? episode.promotion_price ?? episode.price_promotion;
	let activePromo: any = null;

	if (Array.isArray(episode.promotions) && episode.promotions.length > 0) {
		activePromo = episode.promotions[0];
		if (activePromo && typeof activePromo.discount_price === "number") {
			promoPrice = activePromo.discount_price;
		}
	}

	const hasPromo = typeof promoPrice === "number" && promoPrice < regularPrice && promoPrice >= 0;

	if (hasPromo) {
		return (
			<div className="flex flex-col items-end gap-1">
				<div className="flex items-center gap-1.5">
					<span className="bg-rose-50 text-rose-600 text-[10px] px-1.5 py-0.5 rounded border border-rose-100 font-bold tracking-wide">SALE</span>
					<span className="text-xs text-gray-400 line-through decoration-gray-300">{regularPrice}</span>
					<span className="text-lg font-bold text-rose-600 leading-none">{promoPrice}</span>
					<Image src="/images/e-coin.png" alt="Coin" width={18} height={18} className="opacity-90" />
				</div>
				{activePromo && (
					<div className="flex items-center gap-1 text-[10px] text-gray-400 font-light">
						<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
						<span>{dayjs(activePromo.start_date).format("DD/MM/YY HH:mm")} - {dayjs(activePromo.end_date).format("DD/MM/YY HH:mm")}</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span>
				<Image src="/images/e-coin.png" alt="Coin" width={24} height={24} />
			</span>
			{regularPrice === 0 ? <span className="text-emerald-600 font-medium">อ่านฟรี</span> : <span className="font-medium text-gray-700">{regularPrice}</span>}
		</div>
	);
}
