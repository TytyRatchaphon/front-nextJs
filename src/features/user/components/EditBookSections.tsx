"use client";

import React from "react";
import dayjs from "dayjs";
import { Popconfirm, Popover } from "antd";

import { TagSwiper } from "@/components/swiper/ImageSlider";

const ActionButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "danger" | "ghost";
}> = ({ children, variant = "danger", className, ...rest }) => {
	const base = "inline-flex items-center justify-center px-4 py-1 rounded text-sm font-medium";
	const cls =
		variant === "danger"
			? base + " bg-rose-600 text-white hover:bg-rose-700"
			: base + " bg-gray-100 text-gray-700";
	const style = variant === "danger" ? { color: "#ffffff" } : undefined;
	return <button {...rest} style={style} className={`${cls} ${className ?? ""}`.trim()}>{children}</button>;
};

type EditBookTagsSectionProps = {
	display: any;
};

export function EditBookTagsSection({ display }: EditBookTagsSectionProps) {
	const raw = display?.tag ?? display?.tags;
	let tags: string[] = [];

	if (Array.isArray(raw)) {
		tags = raw;
	} else if (typeof raw === "string") {
		tags = raw.split(",").map((item: string) => item.trim()).filter(Boolean);
	}

	return (
		<section className="mb-8 bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
			<h3 className="font-semibold mb-4 text-gray-800 text-lg">Tag</h3>
			<div className="flex flex-wrap gap-2">
				{tags.length === 0 ? <span className="text-gray-400 italic">ไม่มีแท็ก</span> : <TagSwiper tags={tags} />}
			</div>
		</section>
	);
}

type EditBookGroupsSectionProps = {
	groupsQuery: any;
	computedVisibleEps: number;
	onAddGroup: () => void;
	onDeleteGroup: (groupId: any) => void;
	onEditGroup: (group: any) => void;
	onAddEpisode: (groupId: any) => void;
	onOpenGroup: (groupId: any) => void;
};

export function EditBookGroupsSection({
	groupsQuery,
	computedVisibleEps,
	onAddGroup,
	onDeleteGroup,
	onEditGroup,
	onAddEpisode,
	onOpenGroup,
}: EditBookGroupsSectionProps) {
	const publishedGroups = (groupsQuery.data ?? []).filter((group: any) =>
		(group.publish ?? group.status ?? "private").toLowerCase() === "publish",
	);

	return (
		<section className="mb-8 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
			<div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
				<div>
					<h3 className="font-semibold text-lg text-gray-800">สารบัญ</h3>
					<div className="text-sm text-gray-500 mt-1">{publishedGroups.length} เล่ม / {computedVisibleEps} ตอน</div>
				</div>
				<ActionButton variant="danger" onClick={onAddGroup}>เพิ่มเล่ม</ActionButton>
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
						{publishedGroups.map((group: any) => (
							<li key={group.group_id} className="flex items-center justify-between px-4 py-4 bg-white">
								<div className="flex-1 min-w-0">
									<div className="text-gray-900 font-medium truncate">{group.name}</div>
									<div className="text-xs text-gray-500 mt-1">กลุ่ม #{group.group_id}</div>
								</div>
								<div className="flex items-center gap-4">
									<Popconfirm
										title="ยืนยันการลบเล่มนี้หรือไม่?"
										description="เมื่อลบแล้วจะไม่สามารถกู้คืนได้"
										onConfirm={() => onDeleteGroup(group.group_id)}
										okText="ลบเลย"
										cancelText="ยกเลิก"
										okButtonProps={{ danger: true }}
									>
										<button title="ลบ" className="text-gray-500 hover:text-gray-800 p-2">
											<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"></path></svg>
										</button>
									</Popconfirm>
									<ActionButton variant="danger" onClick={() => onEditGroup(group)}>
										<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" /></svg>
										<span className="text-sm">แก้ไข</span>
									</ActionButton>
									<button
										style={{ color: "#ffffff" }}
										className="ml-2 bg-rose-600 text-white px-4 py-1 rounded-md text-sm"
										onClick={() => onAddEpisode(group.group_id)}
									>
										เพิ่มตอน
									</button>
									<button aria-label={`เปิดตอนของกลุ่ม ${group.group_id}`} onClick={() => onOpenGroup(group.group_id)} className="ml-3 p-2 text-gray-400 hover:bg-gray-50 rounded">
										<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="text-2xl" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5"></path><path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.28.28 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.27.27 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.28.28 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.27.27 0 0 0 .259-.194z"></path></svg>
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</section>
	);
}

type EditBookPromotionsSectionProps = {
	display: any;
	isRefreshing?: boolean;
	onRefreshPromotions: () => void;
	openPromoId: any;
	onAddPromotion: () => void;
	onOpenPromoChange: (id: any | null) => void;
	onEditPromotion: (promotion: any) => void;
	onDeletePromotion: (promotionId: any) => void;
};

export function EditBookPromotionsSection({
	display,
	isRefreshing = false,
	onRefreshPromotions,
	openPromoId,
	onAddPromotion,
	onOpenPromoChange,
	onEditPromotion,
	onDeletePromotion,
}: EditBookPromotionsSectionProps) {
	const promos = display?.promos ?? [];
	const dfb = display?.discount_full_book;
	const items = [...promos];

	if (dfb) {
		items.push({
			id: dfb.dfb_id,
			name: dfb.subject,
			start: dayjs(dfb.start_date).format("DD/MM/YYYY HH:mm"),
			end: dayjs(dfb.end_date).format("DD/MM/YYYY HH:mm"),
			discount_percent: dfb.discount_percent,
			groupIDs: dfb.groupIDs ?? dfb.group_ids,
			raw: dfb,
		});
	}

	return (
		<section className="mb-8 bg-white border border-gray-100 rounded shadow-sm">
			<div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
				<h3 className="font-semibold">จัดการโปรโมชั่น</h3>
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onRefreshPromotions}
						disabled={isRefreshing}
						className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
					>
						<svg
							className={isRefreshing ? "animate-spin" : ""}
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path d="M20 11A8.1 8.1 0 0 0 4.5 8M4 4v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
							<path d="M4 13a8.1 8.1 0 0 0 15.5 3M20 20v-4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						รีเฟรช
					</button>
					<ActionButton variant="danger" onClick={onAddPromotion}>เพิ่มโปรโมชั่น</ActionButton>
				</div>
			</div>
			<div className="p-4">
				{items.length === 0 ? (
					<div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
						<p>ยังไม่มีโปรโมชั่น</p>
						<p className="text-xs mt-1">คลิก &quot;เพิ่มโปรโมชั่น&quot; เพื่อเริ่มสร้างโปรโมชั่นใหม่</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{items.map((promotion: any) => (
							<div key={promotion.id} className="group relative bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:border-rose-200">
								<div className="flex justify-between items-start mb-2">
									<div className="bg-rose-50 text-rose-600 rounded-lg p-2.5">
										<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											<path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									</div>
									{promotion.discount_percent && (
										<span className="bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
											-{promotion.discount_percent}%
										</span>
									)}
								</div>

								<h4 className="font-bold text-gray-800 text-lg mb-1 truncate pr-8">{promotion.name}</h4>

								<div className="text-sm text-gray-500 space-y-1 mt-3">
									<div className="flex items-center gap-2">
										<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">เริ่ม</span>
										{promotion.start}
									</div>
									<div className="flex items-center gap-2">
										<span className="text-xs font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">สิ้นสุด</span>
										{promotion.end}
									</div>
								</div>

								<div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
									<button
										onClick={() => onEditPromotion(promotion)}
										className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
										title="แก้ไข"
									>
										<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M12.146 3.146a.5.5 0 0 1 .708 0l.999.999a.5.5 0 0 1 0 .708l-7.439 7.439a.5.5 0 0 1-.233.13l-3 1a.5.5 0 0 1-.63-.63l1-3a.5.5 0 0 1 .13-.233l7.439-7.439z" /></svg>
									</button>
									<Popover
										open={openPromoId === promotion.id}
										onOpenChange={(visible) => onOpenPromoChange(visible ? promotion.id : null)}
										content={
											<div className="flex flex-col gap-3 p-3 bg-white rounded-md min-w-[160px]">
												<div className="text-sm text-gray-800 font-medium text-center">ยืนยันการลบ?</div>
												<div className="flex items-center justify-center gap-2">
													<button
														onClick={() => onOpenPromoChange(null)}
														className="px-3 py-1 rounded text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 border"
													>
														ยกเลิก
													</button>
													<button
														onClick={() => onDeletePromotion(promotion.id)}
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
				)}
			</div>
		</section>
	);
}
