"use client";

import Image from "next/image";
import { DatePicker, InputNumber, Modal, Select } from "antd";

type EditGroupNameModalProps = {
	open: boolean;
	editingGroup: unknown;
	newGroupName: string;
	newGroupError: string | null;
	creatingGroup: boolean;
	onClose: () => void;
	onNameChange: (value: string) => void;
	onSubmit: (value: string) => void;
};

export function EditGroupNameModal({
	open,
	editingGroup,
	newGroupName,
	newGroupError,
	creatingGroup,
	onClose,
	onNameChange,
	onSubmit,
}: EditGroupNameModalProps) {
	return (
		<Modal
			open={open}
			onCancel={onClose}
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
					onChange={(e) => onNameChange(e.target.value)}
					aria-invalid={Boolean(newGroupError)}
				/>
				{newGroupError ? <div className="text-rose-600 text-sm mt-2">{newGroupError}</div> : null}
				<div className="flex justify-center mt-6">
					<button
						onClick={() => onSubmit(String(newGroupName ?? "").trim())}
						disabled={creatingGroup || Boolean(newGroupError) || !newGroupName.trim()}
						className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
						style={{ color: "#ffffff" }}
					>
						{creatingGroup ? "กำลังบันทึก..." : "ตกลง"}
					</button>
				</div>
			</div>
		</Modal>
	);
}

type EditBulkPriceModalProps = {
	open: boolean;
	priceSelected: number | null;
	priceSubmitting: boolean;
	selectedEpisodeCount: number;
	onClose: () => void;
	onPriceChange: (value: number | null) => void;
	onSubmit: () => void;
};

export function EditBulkPriceModal({
	open,
	priceSelected,
	priceSubmitting,
	selectedEpisodeCount,
	onClose,
	onPriceChange,
	onSubmit,
}: EditBulkPriceModalProps) {
	return (
		<Modal open={open} onCancel={onClose} footer={null} centered>
			<div className="py-4 text-center">
				<h3 className="text-lg text-amber-500 font-semibold mb-4">แก้ไขราคาทั้งหมดที่เลือก</h3>
				<div className="mx-auto w-48">
					<Select
						value={priceSelected ?? undefined}
						onChange={(val) => onPriceChange(val === undefined ? null : Number(val))}
						options={[{ value: 0, label: "อ่านฟรี" }, ...Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: `${i + 1} เหรียญ` }))]}
						style={{ width: "100%" }}
						placeholder="เลือก..."
					/>
					<div className="my-2 text-center text-gray-400 text-sm">หรือกำหนดเอง</div>
					<InputNumber
						min={0}
						value={priceSelected}
						onChange={(val) => onPriceChange(val)}
						placeholder="ระบุราคาเอง"
						style={{ width: "100%" }}
					/>
				</div>
				<div className="flex justify-center mt-6">
					<button
						onClick={onSubmit}
						disabled={priceSubmitting || priceSelected === null || selectedEpisodeCount === 0}
						className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
						style={{ color: "#ffffff" }}
					>
						{priceSubmitting ? "กำลังอัปเดต..." : "แก้ไขราคา"}
					</button>
				</div>
			</div>
		</Modal>
	);
}

type EditSuccessModalProps = {
	open: boolean;
	onClose: () => void;
};

export function EditSuccessModal({ open, onClose }: EditSuccessModalProps) {
	return (
		<Modal open={open} footer={null} onCancel={onClose} centered closable={false}>
			<div className="flex flex-col items-center justify-center py-6 px-8">
				<h3 className="text-lg text-rose-600 font-semibold mb-4">ทำรายการสำเร็จ</h3>
				<div className="mb-6">
					<Image src="/images/confirmBttn.png" alt="confirm" width={180} height={140} />
				</div>
				<button
					onClick={onClose}
					className="bg-rose-600 text-white hover:bg-rose-700 px-4 py-2 rounded transition-colors"
					style={{ color: "#ffffff" }}
				>
					ตกลง
				</button>
			</div>
		</Modal>
	);
}

type EditEpisodePromotionModalProps = {
	open: boolean;
	promoDiscountPrice: number;
	promoStartDate: any;
	promoEndDate: any;
	submitting: boolean;
	onClose: () => void;
	onDiscountPriceChange: (value: number) => void;
	onStartDateChange: (value: any) => void;
	onEndDateChange: (value: any) => void;
	onSubmit: () => void;
};

export function EditEpisodePromotionModal({
	open,
	promoDiscountPrice,
	promoStartDate,
	promoEndDate,
	submitting,
	onClose,
	onDiscountPriceChange,
	onStartDateChange,
	onEndDateChange,
	onSubmit,
}: EditEpisodePromotionModalProps) {
	return (
		<Modal
			open={open}
			onCancel={onClose}
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
							onChange={(v) => onDiscountPriceChange(v)}
							options={Array.from({ length: 100 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }))}
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-700 mb-1">วันที่เริ่มต้น</label>
						<DatePicker
							className="w-full"
							placeholder="เลือกวันที่"
							value={promoStartDate}
							onChange={onStartDateChange}
							format="YYYY-MM-DD"
						/>
					</div>
					<div>
						<label className="block text-sm text-gray-700 mb-1">วันที่สิ้นสุด</label>
						<DatePicker
							className="w-full"
							placeholder="เลือกวันที่"
							value={promoEndDate}
							onChange={onEndDateChange}
							format="YYYY-MM-DD"
						/>
					</div>
				</div>
				<div className="flex justify-center">
					<button
						onClick={onSubmit}
						disabled={submitting}
						className="bg-rose-600 text-white px-8 py-2 rounded-full hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
					>
						{submitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
					</button>
				</div>
			</div>
		</Modal>
	);
}

type EditCancelEpisodePromotionModalProps = {
	open: boolean;
	submitting: boolean;
	onClose: () => void;
	onSubmit: () => void;
};

export function EditCancelEpisodePromotionModal({
	open,
	submitting,
	onClose,
	onSubmit,
}: EditCancelEpisodePromotionModalProps) {
	return (
		<Modal open={open} onCancel={onClose} footer={null} centered width={500}>
			<div className="py-6 flex flex-col items-center text-center">
				<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="3em" width="3em" xmlns="http://www.w3.org/2000/svg" className="text-amber-500 mb-4">
					<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
					<path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
				</svg>
				<h3 className="text-gray-800 font-medium text-lg mb-6">ยืนยันการยกเลิกส่วนลดตอนที่เลือกทั้งหมดหรือไม่</h3>
				<div className="flex items-center gap-3">
					<button
						onClick={onClose}
						className="px-6 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
					>
						ไม่ใช่
					</button>
					<button
						onClick={onSubmit}
						disabled={submitting}
						className="px-6 py-2 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
					>
						{submitting ? "กำลังยกเลิก..." : "ใช่ ยกเลิกเลย"}
					</button>
				</div>
			</div>
		</Modal>
	);
}

type EditPromotionFormModalProps = {
	open: boolean;
	editingPromoId: number | string | null;
	promoName: string;
	promoDiscount: number | null;
	promoStart: any;
	promoEnd: any;
	promoSelectedGroups: string[];
	creatingPromo: boolean;
	groupOptions: Array<{ label: string; value: string }>;
	onClose: () => void;
	onNameChange: (value: string) => void;
	onDiscountChange: (value: number | null) => void;
	onStartChange: (value: any) => void;
	onEndChange: (value: any) => void;
	onSelectedGroupsChange: (value: string[]) => void;
	onSubmit: () => void;
};

export function EditPromotionFormModal({
	open,
	editingPromoId,
	promoName,
	promoDiscount,
	promoStart,
	promoEnd,
	promoSelectedGroups,
	creatingPromo,
	groupOptions,
	onClose,
	onNameChange,
	onDiscountChange,
	onStartChange,
	onEndChange,
	onSelectedGroupsChange,
	onSubmit,
}: EditPromotionFormModalProps) {
	return (
		<Modal
			open={open}
			onCancel={onClose}
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
						onChange={(e) => onNameChange(e.target.value)}
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
						onChange={onDiscountChange}
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
							onChange={onStartChange}
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
							onChange={onEndChange}
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
						onChange={onSelectedGroupsChange}
						options={groupOptions}
					/>
				</div>
				<div className="flex justify-center mt-6">
					<button
						onClick={onSubmit}
						disabled={creatingPromo}
						className="bg-rose-600 text-white px-6 py-2 rounded disabled:opacity-50 hover:bg-rose-700 transition-colors"
						style={{ color: "#ffffff" }}
					>
						{creatingPromo ? "กำลังบันทึก..." : "บันทึกโปรโมชั่น"}
					</button>
				</div>
			</div>
		</Modal>
	);
}
