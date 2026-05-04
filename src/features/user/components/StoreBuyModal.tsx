import Image from 'next/image';
import { Modal, Spin, Input, Checkbox } from 'antd';
import { resolveStoreImageSrc } from '@/utils/imageUtils';
import { useAuthStore } from '@/stores/authStore';
import type { StorePack, StorePackSelectableOption } from '@/types/api';

interface StoreBuyModalProps {
  selectedPack: StorePack | null;
  selectedQty: number;
  confirmLoading: boolean;
  addressInput: string;
  onAddressInputChange: (value: string) => void;
  phoneInput: string;
  onPhoneInputChange: (value: string) => void;
  selectedStorePackListIds: Array<number | string>;
  onSelectableOptionChange: (option: StorePackSelectableOption, checked: boolean) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onConfirmBuy: () => void;
  onClose: () => void;
  getSelectionLimit: (pack: StorePack | null) => number;
  settings: any;
}

export function StoreBuyModal({
  selectedPack,
  selectedQty,
  confirmLoading,
  addressInput,
  onAddressInputChange,
  phoneInput,
  onPhoneInputChange,
  selectedStorePackListIds,
  onSelectableOptionChange,
  onIncrement,
  onDecrement,
  onConfirmBuy,
  onClose,
  getSelectionLimit,
  settings,
}: StoreBuyModalProps) {
  const { user } = useAuthStore();
  const selectedPackImageSrc = resolveStoreImageSrc(selectedPack?.img || null, '/images/ejb.png');

  return (
    <>
      <Modal
        title={<div className="px-8 text-center text-base font-bold leading-snug font-primary sm:text-xl">{selectedPack?.name}</div>}
        open={!!selectedPack}
        onCancel={onClose}
        footer={null}
        centered
        zIndex={5000}
        width={selectedPack?.is_selection ? 560 : 380}
        style={{ maxWidth: 'calc(100vw - 20px)', top: 12 }}
        className="custom-modal-store font-primary"
      >
            <div className="flex max-h-[calc(100dvh-96px)] flex-col items-center overflow-y-auto px-0 pb-4 pt-2 sm:px-2 sm:pb-5">
            
            {/* Item Card */}
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-3 sm:p-4 flex items-start gap-3 mb-3 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
               <div className="relative h-20 w-20 flex-shrink-0 self-start z-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm sm:h-24 sm:w-24">
                <Image
                  src={selectedPackImageSrc}
                  alt={selectedPack?.name || 'Pack'}
                  fill
                  className="object-contain p-1"
                />
              </div>
              <div className="min-w-0 flex-1 z-10 pt-0.5">
                <h3 className="line-clamp-2 font-bold text-base text-gray-800 mb-1 leading-tight sm:text-lg">{selectedPack?.name}</h3>
                <div className="w-full h-[1px] bg-gray-100 my-1.5"></div>
                {selectedPack?.items_description ? (
                  <ul className="text-xs text-gray-500 space-y-1 sm:text-sm">
                    {selectedPack.items_description.split(',').map((item, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500 flex items-center gap-1 sm:text-sm">
                     <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                     จำนวน x {selectedQty}
                  </p>
                )}
              </div>
            </div>

            {selectedPack?.is_selection && Array.isArray(selectedPack?.selectable_options) && (
              <div className="w-full mb-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  <span>เลือกได้สูงสุด {getSelectionLimit(selectedPack)} รายการ</span>
                  <span>เลือกแล้ว {selectedStorePackListIds.length}/{getSelectionLimit(selectedPack)}</span>
                </div>
                <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {selectedPack.selectable_options.map((option) => {
                    const checked = selectedStorePackListIds.includes(option.store_pack_list_id);
                    const disabled = option.can_select === false || confirmLoading;
                    return (
                      <label
                        key={option.store_pack_list_id}
                        className={`flex min-w-0 items-start gap-2 rounded-xl border bg-white p-2 text-sm transition ${checked ? 'border-red-200 bg-red-50/50 shadow-sm' : 'border-stone-200 hover:border-red-100'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
                      >
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onChange={(event) => onSelectableOptionChange(option, event.target.checked)}
                          className="[&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-red-500 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-red-500 hover:[&_.ant-checkbox-inner]:!border-red-500"
                        />
                        <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-sm">
                          <Image
                            src={resolveStoreImageSrc(option.item_img || null, '/images/ejb.png')}
                            alt={option.item_name}
                            fill
                            sizes="44px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className="line-clamp-2 text-xs font-medium leading-snug text-stone-800 sm:text-sm">{option.item_name}</p>
                          {option.can_select === false && (
                            <p className="text-[11px] text-rose-500">คุณมีรายการนี้ครบแล้ว</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Address Input Section */}
            {selectedPack?.type === 'gift' && !user?.address_main && (
               <div className="w-full mb-4 animate-fadeIn">
                 <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                        <span className="bg-red-100 p-1.5 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        </span>
                        <h3 className="font-bold text-sm">ที่อยู่สำหรับจัดส่ง</h3>
                        <span className="text-xs ml-auto text-red-400 font-normal">* จำเป็น</span>
                    </div>
                    <Input.TextArea 
                        rows={3} 
                        placeholder="กรุณากรอกชื่อ-นามสกุล และที่อยู่จัดส่งให้ครบถ้วน..."
                        value={addressInput}
                        onChange={(e) => onAddressInputChange(e.target.value)}
                        className="w-full font-primary !bg-white !border-red-200 focus:!border-red-500 hover:!border-red-400 !rounded-lg !text-sm !shadow-none !resize-none"
                        style={{ minHeight: '80px' }}
                    />
                 </div>
               </div>
            )}

            {selectedPack?.type === 'gift' && !user?.phone && (
               <div className="w-full mb-6 animate-fadeIn">
                 <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3 text-red-600">
                        <span className="bg-red-100 p-1.5 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </span>
                        <h3 className="font-bold text-sm">เบอร์โทรศัพท์</h3>
                        <span className="text-xs ml-auto text-red-400 font-normal">* จำเป็น</span>
                    </div>
                    <Input
                        placeholder="กรอกเบอร์โทรศัพท์ (เช่น 0812345678)"
                        value={phoneInput}
                        onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           onPhoneInputChange(val);
                        }}
                        maxLength={10}
                        className="w-full font-primary !bg-white !border-red-200 focus:!border-red-500 hover:!border-red-400 !rounded-lg !text-sm !shadow-none h-10"
                    />
                 </div>
               </div>
            )}

            {/* Privacy Note */}
            {selectedPack?.type === 'gift' && ((!user?.address_main) || !user?.phone) && (
              <div className="w-full mb-6 px-1">
                 <p className="text-[10px] text-red-400 text-center">
                   ** ข้อมูลของท่านจะเป็นข้อมูลที่ให้สำหรับจัดส่งเท่านั้น และจะไม่มีการเปิดเผยต่อสาธารณะหรือบุคคลภายนอกโดยไม่ได้รับอนุญาต **
                 </p>
              </div>
            )}

            {/* Price Calculation & Quantity */}
            <div className="text-center mb-4 relative">
                 {/* Quantity Controls */}
                  <div className="flex items-center justify-center gap-3 mb-2">
                        <button 
                            onClick={onDecrement}
                            className={`w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors ${selectedQty <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={selectedQty <= 1}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                        <span className="text-xl font-bold w-10 text-center text-gray-800">{selectedQty}</span>
                        <button 
                            onClick={onIncrement}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        </button>
                    </div>

                <div className="inline-block relative">
                    <span className="text-gray-400 text-xs font-medium block mb-0.5">ยอดรวมทั้งหมด</span>
                    <div className="flex items-center justify-center gap-2">
                        {['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin', 'rp'].includes(selectedPack?.type_use || '') && (
                        <div className="relative">
                            <Image
                                src={
                                selectedPack?.type_use === 'coin' ? (settings?.coin || "/images/e-coin.png") :
                                    selectedPack?.type_use === 'heart' ? (settings?.heart || "/images/heart.png") :
                                    selectedPack?.type_use === 'flower' ? (settings?.flower || "/images/flower.png") :
                                        selectedPack?.type_use === 'stamp' ? (settings?.stamp || "/images/stamp.png") :
                                        selectedPack?.type_use === 'exp' ? (settings?.exp || "/images/exp.png") :
                                            selectedPack?.type_use === 'rp' ? (settings?.rp || "/images/rp.png") :
                                                (settings?.freecoin || "/images/freecoin.png")
                                }
                                width={30}
                                height={30}
                                alt={selectedPack?.type_use || 'currency'}
                                unoptimized
                                className="object-contain drop-shadow-sm"
                            />
                        </div>
                        )}
                        <span className="text-2xl font-bold font-primary text-gray-800 tracking-tight">
                            {((selectedPack?.price || 0) * selectedQty).toLocaleString()}
                        </span>
                        {!['coin', 'heart', 'flower', 'stamp', 'exp', 'freecoin', 'rp'].includes(selectedPack?.type_use || '') &&
                           <span className="text-lg text-gray-500 font-medium self-end mb-1">{selectedPack?.type_use}</span>
                        }
                    </div>
                </div>
            </div>

            {/* Buttons */}
            <div className="sticky bottom-0 z-20 flex w-full items-center gap-3 border-t border-transparent bg-white/95 pt-2 backdrop-blur">
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-200 text-gray-500 py-2.5 rounded-xl font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300 transition-all duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={onConfirmBuy}
                disabled={confirmLoading}
                className="flex-1 bg-[#FF0037] !text-white py-2.5 rounded-xl font-bold shadow-lg shadow-red-200 hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:grayscale disabled:pointer-events-none"
              >
                {confirmLoading ? <Spin size="small" className="!mr-2 custom-spin-white" /> : null}
                { (selectedPack?.type === 'gift' && (!user?.address_main || !user?.phone)) ? 'บันทึกและยืนยัน' : 'ยืนยันสั่งซื้อ' }
              </button>
            </div>
          </div>
        <style jsx global>{`
           .custom-spin-white .ant-spin-dot-item {
              background-color: white !important;
           }
         `}</style>
      </Modal>
    </>
  );
}
