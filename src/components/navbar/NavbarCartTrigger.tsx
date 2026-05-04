"use client";

import { Popover } from "antd";

import CartSvg from "@/components/utility/CartSvg";
import CartPopover from "./CartPopover";

type NavbarCartTriggerProps = {
  isLoggedIn: boolean;
  cartItemCount: number;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NavbarCartTrigger({
  isLoggedIn,
  cartItemCount,
  isOpen,
  onOpenChange,
}: NavbarCartTriggerProps) {
  if (!isLoggedIn) return null;

  return (
    <Popover
      content={<CartPopover onClose={() => onOpenChange(false)} />}
      trigger="click"
      placement="bottom"
      open={isOpen}
      onOpenChange={onOpenChange}
      arrow={false}
      classNames={{ root: "reader-cart-popover" }}
      zIndex={1220}
      styles={{ body: { padding: 0 } }}
    >
      <div className="mr-2 lg:mr-0 cursor-pointer text-black hover:text-red-600 transition-colors duration-300 flex items-center relative">
        <CartSvg />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-[#E31C3D] rounded-full px-1 border-2 border-white">
            {cartItemCount > 99 ? "99+" : cartItemCount}
          </span>
        )}
      </div>
    </Popover>
  );
}
