"use client";

import { Modal, Checkbox, Button, Radio, Space, Divider } from "antd";
import { useState, useMemo } from "react";
import type { Episode } from "@/types/api";

interface BuyMultipleEpisodesModalProps {
  open: boolean;
  onCancel: () => void;
  episodes: Episode[];
  userWallet: {
    coin: number;
    freecoin: number;
    heart: number;
    flower: number;
    coupon: number;
    exp_point: number;
    stamp: number;
    wheel: number;
    fast_ticket: number;
    coinIncome: number;
  } | null;
  onPurchase: (episodeIds: string[], paymentMethod: string) => void;
}

export default function BuyMultipleEpisodesModal({
  open,
  onCancel,
  episodes,
  userWallet,
  onPurchase,
}: BuyMultipleEpisodesModalProps) {
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("coin");

  // กรองเฉพาะตอนที่ยังไม่ได้ซื้อและต้องจ่ายเหรียญ
  const purchasableEpisodes = useMemo(() => {
    return episodes.filter((ep) => !ep.isBuy && ep.coin > 0);
  }, [episodes]);

  // คำนวณยอดรวม
  const totalCost = useMemo(() => {
    return selectedEpisodes.reduce((sum, epId) => {
      const episode = purchasableEpisodes.find((ep) => String(ep.ep_id ?? ep.epID) === String(epId));
      return sum + (episode?.coin || 0);
    }, 0);
  }, [selectedEpisodes, purchasableEpisodes]);

  // แปลงเป็น currency อื่นๆ
  const currencyOptions = useMemo(() => {
    const coinRate = 1; // 1 coin = 1 coin
    const freecoinRate = 1; // 1 coin = 1 freecoin
    const heartRate = 0.1; // 1 coin = 0.1 heart (ตัวอย่าง)
    const flowerRate = 0.2; // 1 coin = 0.2 flower (ตัวอย่าง)

    return [
      {
        key: "coin",
        label: "เหรียญ (Coin)",
        icon: "💰",
        amount: totalCost * coinRate,
        balance: userWallet?.coin || 0,
        suffix: "เหรียญ",
      },
      {
        key: "freecoin",
        label: "เหรียญฟรี (Free Coin)",
        icon: "🎁",
        amount: totalCost * freecoinRate,
        balance: userWallet?.freecoin || 0,
        suffix: "เหรียญฟรี",
      },
      {
        key: "heart",
        label: "หัวใจ (Heart)",
        icon: "❤️",
        amount: Math.ceil(totalCost * heartRate),
        balance: userWallet?.heart || 0,
        suffix: "หัวใจ",
      },
      {
        key: "flower",
        label: "ดอกไม้ (Flower)",
        icon: "🌸",
        amount: Math.ceil(totalCost * flowerRate),
        balance: userWallet?.flower || 0,
        suffix: "ดอกไม้",
      },
    ];
  }, [totalCost, userWallet]);

  const selectedCurrency = currencyOptions.find(
    (opt) => opt.key === paymentMethod
  );
  const hasEnoughBalance = selectedCurrency
    ? selectedCurrency.balance >= selectedCurrency.amount
    : false;

  const handleSelectAll = () => {
    if (selectedEpisodes.length === purchasableEpisodes.length) {
      setSelectedEpisodes([]);
    } else {
      setSelectedEpisodes(purchasableEpisodes.map((ep) => String(ep.ep_id ?? ep.epID)));
    }
  };

  const handleToggleEpisode = (epId: string) => {
    setSelectedEpisodes((prev) =>
      prev.includes(epId) ? prev.filter((id) => id !== epId) : [...prev, epId]
    );
  };

  const handlePurchase = () => {
    if (selectedEpisodes.length > 0 && hasEnoughBalance) {
      onPurchase(selectedEpisodes, paymentMethod);
      setSelectedEpisodes([]);
      onCancel();
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">💳 ซื้อหลายตอน</span>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={700}
      footer={null}
    >
      <div className="space-y-4">
        {/* ส่วนแสดงยอดคงเหลือ */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            💰 ยอดคงเหลือของคุณ
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {currencyOptions.map((currency) => (
              <div
                key={currency.key}
                className="bg-white rounded-lg p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currency.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600">{currency.label}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {currency.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider className="my-4" />

        {/* เลือกตอน */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              📚 เลือกตอนที่ต้องการซื้อ ({selectedEpisodes.length}/
              {purchasableEpisodes.length})
            </h3>
            <Button size="small" type="link" onClick={handleSelectAll}>
              {selectedEpisodes.length === purchasableEpisodes.length
                ? "ยกเลิกทั้งหมด"
                : "เลือกทั้งหมด"}
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {purchasableEpisodes.length > 0 ? (
              purchasableEpisodes.map((episode) => {
                const epKey = String(episode.ep_id ?? episode.epID);
                return (
                <div
                  key={epKey}
                  className={`flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer ${
                    selectedEpisodes.includes(epKey) ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleToggleEpisode(epKey)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedEpisodes.includes(epKey)}
                      onChange={() => handleToggleEpisode(epKey)}
                    />
                    <span className="text-sm text-gray-900 line-clamp-1">
                      {episode.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-600 font-semibold">
                    <span className="text-lg">💰</span>
                    <span className="text-sm">{episode.coin}</span>
                  </div>
                </div>
                )
              })
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>ไม่มีตอนที่สามารถซื้อได้</p>
              </div>
            )}
          </div>
        </div>

        <Divider className="my-4" />

        {/* เลือกวิธีชำระเงิน */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            💳 เลือกวิธีชำระเงิน
          </h3>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              {currencyOptions.map((currency) => {
                const isEnough = currency.balance >= currency.amount;
                return (
                  <Radio
                    key={currency.key}
                    value={currency.key}
                    className="w-full"
                    disabled={!isEnough}
                  >
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{currency.icon}</span>
                        <span className="text-sm">{currency.label}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">
                          {currency.amount.toLocaleString()} {currency.suffix}
                        </span>
                        <span
                          className={`ml-2 ${
                            isEnough ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          (คงเหลือ: {currency.balance.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        </div>

        <Divider className="my-4" />

        {/* สรุปยอดรวม */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">ตอนที่เลือก:</span>
            <span className="text-sm font-semibold">
              {selectedEpisodes.length} ตอน
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">ราคารวม:</span>
            <span className="text-sm font-semibold">{totalCost} เหรียญ</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">ชำระด้วย:</span>
            <span className="text-base font-bold text-purple-600">
              {selectedCurrency?.icon}{" "}
              {selectedCurrency?.amount.toLocaleString()}{" "}
              {selectedCurrency?.suffix}
            </span>
          </div>
        </div>

        {/* ปุ่มดำเนินการ */}
        <div className="flex gap-3 pt-2">
          <Button onClick={onCancel} className="flex-1">
            ยกเลิก
          </Button>
          <Button
            type="primary"
            onClick={handlePurchase}
            disabled={selectedEpisodes.length === 0 || !hasEnoughBalance}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {!hasEnoughBalance
              ? "ยอดเงินไม่เพียงพอ"
              : `ซื้อ ${selectedEpisodes.length} ตอน`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}