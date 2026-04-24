"use client"
import Image from 'next/image'
import { Progress, Button, notification } from 'antd';
import { GiftOutlined } from '@ant-design/icons'
import apiClient from '@/services/apiClient'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { QUERY_CONFIG, queryKeys } from '@/constants/query'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

type Props = {
    width?: number | string
    progressHeight?: number
}

export default function UserTopupCoin({
    width = 1040,
    progressHeight = 22,
}: Props) {
    const queryClient = useQueryClient()
    const token = useAuthStore((state) => state.token) // ✅ Use selector instead of .getState()

    // 1. Fetch Functions
    const fetchEventSummary = async () => {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
        const url = `${base}/user/event`
        const res = await apiClient.get(url)
        return res.data?.data ?? {}
    }

    // Claim API (Placeholder - Update URL when known)
    const claimRewardApi = async () => {
        // const currentToken = useAuthStore.getState().token
        // const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
        // const url = `${base}/user/event/get-topup-reward` // Example URL
        // const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        // if (currentToken) headers['Authorization'] = currentToken
        // const res = await axios.post(url, {}, { headers })
        // return res.data
        throw new Error("Claim API not implemented")
    }

    // 2. Query Data
    const { data } = useQuery({
        queryKey: queryKeys.user.eventSummary(token),
        queryFn: () => fetchEventSummary(),
        staleTime: QUERY_CONFIG.STALE_TIME_MEDIUM,
        retry: QUERY_CONFIG.RETRY_COUNT
    })

    // Using weekly_topup_data
    const apiCoin = data?.weekly_topup_data
    const rewardToClaim = apiCoin?.reward_to_claim ?? false
    // const totalUnclaimed = Number(apiCoin?.total_unclaimed_reward_unit ?? 0) // No such field in provided JSON for topup

    const { mutate: handleClaim, isPending: isClaiming } = useMutation({
        mutationFn: claimRewardApi,
        onSuccess: () => {
            notification.success({
                message: 'รับรางวัลสำเร็จ!',
                description: 'รับรางวัลเรียบร้อยแล้ว',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                placement: 'topRight',
            });
            queryClient.invalidateQueries({ queryKey: queryKeys.user.eventSummaryRoot() })
        },
        onError: (error: any) => {
            notification.error({
                message: 'รับรางวัลไม่สำเร็จ',
                description: error?.response?.data?.message || 'รับรางวัลไม่สำเร็จ',
                icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                placement: 'topRight',
            });
        }
    })

    const apiUsed = Number(apiCoin?.user_weekly_topup ?? 0)
    const apiGoal = Number(apiCoin?.goal ?? 500)

    const apiPercentRaw = Number(apiCoin?.current_reward_percentage ?? NaN)
    const percent = Number.isFinite(apiPercentRaw)
        ? Math.max(0, Math.min(100, Math.round(apiPercentRaw)))
        : Math.max(0, Math.min(100, Math.round((apiUsed / Math.max(1, apiGoal)) * 100)))

    const showClaimButton = rewardToClaim
    const apiRemaining = Math.max(0, apiGoal - apiUsed)

    const displayUsed = apiUsed
    const displayRemaining = apiRemaining

    // Hardcoded defaults for now as props were specific to UserUseCoin
    const leftLabel = 'เติมไปแล้ว'
    const displayLeftAmount = `${displayUsed} coin`
    const displayRightAmount = `${apiGoal} coin`
 // Using a generic icon or reused icon

    if (!apiCoin) return null;

    return (
        <div className={`w-full ${typeof width === 'number' ? `max-w-[${width}px]` : `max-w-[${width}]`} mx-auto px-4 md:px-0`}>
            <div style={{ borderRadius: 12, overflow: 'hidden' }}>

                {/* Header Section */}
                <div style={{ background: 'linear-gradient(90deg,#b71c26,#8b0c14)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Image src='/images/warning_cat.png' alt="avatar" width={44} height={44} className="object-cover" unoptimized />
                    </div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>ยอดเติมคอยน์สะสม</div>
                </div>

                {/* Body Section */}
                <div style={{ background: 'white', padding: '18px 20px', border: '1px solid rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>{leftLabel} {displayUsed}</div>
                        <div style={{ color: '#6b7280', fontSize: 13 }}>{`เติมอีก ${displayRemaining} คอยน์เพื่อรับรางวัล`}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontSize: 20, color: '#111827', fontWeight: 600 }}>{displayLeftAmount}</div>
                        <div style={{ fontSize: 18, color: '#111827', fontWeight: 600 }}>{displayRightAmount}</div>
                    </div>

                    <div style={{ marginTop: 12, position: 'relative' }}>
                        <Progress
                            percent={percent}
                            percentPosition={{ type: 'inner', align: 'center' }}
                            strokeColor="#d40b1d"
                            trailColor="#f3f4f6"
                            strokeLinecap="round"
                            size={{ height: progressHeight ?? 12 }}
                        />
                    </div>

                    {/* ----- ส่วนปุ่มรับรางวัล ----- */}
                    {showClaimButton && (
                        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', animation: 'fadeIn 0.5s ease-in-out' }}>
                            <Button
                                type="primary"
                                size="large"
                                icon={<GiftOutlined />}
                                loading={isClaiming}
                                onClick={() => handleClaim()}
                                style={{
                                    height: 48,
                                    borderRadius: 24,
                                    paddingLeft: 32,
                                    paddingRight: 32,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    background: 'linear-gradient(90deg, #FF4D4F 0%, #D32029 100%)',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(211, 32, 41, 0.35)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                                className="hover:scale-105 transition-transform duration-300"
                            >
                                กดรับรางวัล
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    )
}
