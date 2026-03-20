"use client"

import React from 'react'
import { Card, Tabs, Table, Empty, notification } from 'antd';
import apiClient from '@/services/apiClient'
import { useQuery } from '@tanstack/react-query'
import { get_date as use_date } from '@/utils/dateUtils'
import '@/components/home/Banner';
import { useWebsiteStore } from '@/stores/websiteStore';
import GifLoader from '@/components/utility/GifLoader';
import Image from 'next/image';
import '@/utils/imageUtils';
import { CloseCircleOutlined } from '@ant-design/icons';


function History() {
  const [activeKey, setActiveKey] = React.useState<string>('1')

  const tabs = [
    'ประวัติการเติมเหรียญ',
    'ประวัติการใช้เหรียญ',
    'ประวัติ REDEEM',
    'กิจกรรมกล่องสุ่มปริศนา',
    'ประวัติการได้รับเหรียญเพิ่มเติม',
    'ประวัติการแลกของขวัญ',
    'ประวัติการซื้อสินค้า',
  ]

  // table columns that apply for most history lists
  const columns = React.useMemo(() => [
    { title: 'วัน/เดือน/ปี', dataIndex: 'date', key: 'date', width: 180 },
    { title: 'รายละเอียดสินค้า', dataIndex: 'detail', key: 'detail' },
    { title: 'ราคา', dataIndex: 'price', key: 'price', width: 120, align: 'right' as const },
    { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
  ], [])

  // no data for now; each tab will render a table with Empty when data is empty
  const data: any[] = []

  // helper to clean strings (remove BOM, CR, zero-width chars and trim)
  const cleanString = (v: any) => {
    if (v === null || v === undefined) return ''
    try {
      return String(v).replace(/\uFEFF|\r|\n|\u200B/g, '').trim()
    } catch {
      return String(v)
    }
  }



  // use react-query to load history endpoints; enabled only when corresponding tab active

  // pagination state for tabs (declare before queries so queries can use them)
  const [paymentsPage, setPaymentsPage] = React.useState(1)
  const [useCoinsPage, setUseCoinsPage] = React.useState(1)
  const [redeemPage, setRedeemPage] = React.useState(1)
  const [gachaPage, setGachaPage] = React.useState(1)
  const [getmorePage, setGetmorePage] = React.useState(1)
  const [giftPage, setGiftPage] = React.useState(1)
  const [storeHistoryPage, setStoreHistoryPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)

  // keep last-known totals to avoid transient 0 totals during fetches



  const paymentsQuery = useQuery<any>(({
    queryKey: ['his_payment', paymentsPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_payment', { params: { page: paymentsPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '1',
    placeholderData: (previousData: any) => previousData,
  } as any))

  const useCoinQuery = useQuery<any>(({
    queryKey: ['his_usecoin', useCoinsPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_usecoin', { params: { page: useCoinsPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '2',
    placeholderData: (previousData: any) => previousData,
  } as any))



  // normalize raw payloads for tables (handle multiple backend shapes)
  const payments = React.useMemo(() => {
    const payload = paymentsQuery.data ?? (paymentsQuery as any).previousData ?? {}
    const container = payload.data ?? payload
    const list = Array.isArray(container)
      ? container
      : Array.isArray(container?.data)
        ? container.data
        : Array.isArray(container?.history)
          ? container.history
          : Array.isArray(payload?.history)
            ? payload.history
            : []

    return list.map((it: any, idx: number) => ({
      paymentID: it.paymentID ?? it.paymentId ?? it.id ?? '',
      date: it.date ? new Date(it.date).toLocaleString() : (it.created_at ? new Date(it.created_at).toLocaleString() : ''),
      status: it.status ?? it.result ?? '',
      price: it.price ?? it.total ?? it.coin ?? '',
      detail: it.ref_text ?? it.refText ?? it.description ?? '-',
      raw: it,
      key: `${it.paymentID ?? it.paymentId ?? it.id ?? 'payment'}-${idx}`,
    }))
  }, [paymentsQuery])

  // (pagination state declared above)

  // reset page when switching tabs
  React.useEffect(() => {
    setPaymentsPage(1)
    setUseCoinsPage(1)
    setRedeemPage(1)
    setGachaPage(1)
    setGetmorePage(1)
    setStoreHistoryPage(1)
  }, [activeKey])

  // redeem history query
  const redeemQuery = useQuery<any>(({
    queryKey: ['his_redeem', redeemPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_redeem', { params: { page: redeemPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '3',
    placeholderData: (previousData: any) => previousData,
  } as any))

  // gacha (กิจกรรมกล่องสุ่มปริศนา) history
  const gachaQuery = useQuery<any>(({
    queryKey: ['his_gacha', gachaPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_gacha', { params: { page: gachaPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '4',
    placeholderData: (previousData: any) => previousData,
  } as any))

  // history of received extras (ประวัติการได้รับเหรียญเพิ่มเติม)
  const getMoreQuery = useQuery<any>(({
    queryKey: ['his_getmore', getmorePage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_getmore', { params: { page: getmorePage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '5',
    placeholderData: (previousData: any) => previousData,
  } as any))

  // update last-known totals when new data arrives


  const redeemPrev = (redeemQuery as any).previousData
  const redeemRawSafe = React.useMemo(
    () => redeemQuery.data?.data ?? redeemQuery.data ?? redeemPrev?.data ?? redeemPrev ?? {},
    [redeemQuery.data, redeemPrev]
  )
  const redeems = React.useMemo(() => {
    const container = redeemRawSafe
    const list = Array.isArray(container)
      ? container
      : Array.isArray(container?.data)
        ? container.data
        : Array.isArray(container?.history)
          ? container.history
          : []

    const getRedeemDate = (it: any) => {
      const d = use_date(it.use_date)
      if (d) return d
    }

    return list.map((it: any, idx: number) => ({
      date: getRedeemDate(it),
      code: it.redeemCode ?? it.code ?? it.redeem_code ?? it.code ?? '',
      name: it.name ?? it.productName ?? it.rewardName ?? it.title ?? it.rawName ?? '',
      unit: it.unit ?? it.amount ?? it.coin ?? it.qty ?? it.quantity ?? '',
      type: it.type ?? it.paymentType ?? it.rewardType ?? '',
      status: it.status ?? 'redeemed',
      raw: it,
      key: `${it.code ?? it.redeemCode ?? idx}-${idx}`,
    }))
  }, [redeemRawSafe])

  const gachaPrev = (gachaQuery as any).previousData
  const gachaRaw = React.useMemo(
    () => gachaQuery.data?.data ?? gachaQuery.data ?? gachaPrev?.data ?? gachaPrev ?? [],
    [gachaQuery.data, gachaPrev]
  )
  const gachas = React.useMemo(() => {
    const list = Array.isArray(gachaRaw)
      ? gachaRaw
      : Array.isArray(gachaRaw?.history)
        ? gachaRaw.history
        : Array.isArray(gachaRaw?.data)
          ? gachaRaw.data
          : []

    return list.map((it: any, idx: number) => ({
      date: it.date ? new Date(it.date).toLocaleString() : it.get_date ? use_date(it.get_date) : '',
      gift_type: it.gift_type ?? it.type ?? '',
      gift_value: it.gift_value ?? it.value ?? it.qty ?? '',
      raw: it,
      key: `${it.id ?? it.txId ?? it.user_id ?? 'gacha'}-${idx}`,
    }))
  }, [gachaRaw])

  const getMorePrev = (getMoreQuery as any).previousData
  const getMoreRaw = React.useMemo(
    () => getMoreQuery.data?.data ?? getMoreQuery.data ?? getMorePrev?.data ?? getMorePrev ?? [],
    [getMoreQuery.data, getMorePrev]
  )
  const getMores = React.useMemo(() => {
    const list = Array.isArray(getMoreRaw)
      ? getMoreRaw
      : Array.isArray(getMoreRaw?.history)
        ? getMoreRaw.history
        : Array.isArray(getMoreRaw?.data)
          ? getMoreRaw.data
          : []

    return list.map((it: any, idx: number) => ({
      date: it.update_at ? new Date(it.update_at).toLocaleString() : it.date ? new Date(it.date).toLocaleString() : it.get_date ? new Date(it.get_date).toLocaleString() : '',
      condition: it.type === 'top' ? 'ได้รับ' : it.type ?? '',
      currency: it.currency ?? it.type ?? '',
      unit: it.unit ?? it.qty ?? it.value ?? '',
      note: it.note ?? it.description ?? '',
      raw: it,
      key: `${it.id ?? it.user_id ?? idx}-getmore-${idx}`,
    }))
  }, [getMoreRaw])

  const useCoinPrev = (useCoinQuery as any).previousData
  const useCoinRaw = React.useMemo(
    () => useCoinQuery.data?.data ?? useCoinQuery.data ?? useCoinPrev?.data ?? useCoinPrev ?? [],
    [useCoinQuery.data, useCoinPrev]
  )
  const useCoins = React.useMemo(() => {
    const list = Array.isArray(useCoinRaw)
      ? useCoinRaw
      : Array.isArray(useCoinRaw?.history)
        ? useCoinRaw.history
        : []

    return list.map((it: any, idx: number) => {
      // robust fallbacks for book/episode names from different API shapes
      const bookName = cleanString(
        it.BookTran?.name
        ?? it.BookTran?.title
        ?? it.book_name
        ?? it.bookTitle
        ?? it.book?.name
        ?? it.bookName
        ?? it.BookTranName
        ?? it.name
        ?? ''
      )

      const epName = cleanString(
        it.BookTranEp?.name
        ?? it.BookTranEp?.title
        ?? it.ep_name
        ?? it.epTitle
        ?? it.ep?.name
        ?? it.epName
        ?? it.BookTranEpName
        ?? ''
      )

      return {
        date: it.date ? new Date(it.date).toLocaleString() : '',
        bookTitle: bookName,
        epTitle: epName,
        total: it.coin ?? it.price ?? '',
        type: it.typePayment ?? it.type ?? it.pay_with ?? 'coin',
        raw: it,
        key: `${it.id ?? it.txId ?? it.paymentID ?? 'usecoin'}-${idx}`,
      }
    })
  }, [useCoinRaw])

  // his_gift (ประวัติการแลกของขวัญ)
  const giftQuery = useQuery<any>(({
    queryKey: ['his_gift', giftPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_gift', { params: { page: giftPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '6',
    placeholderData: (previousData: any) => previousData,
  } as any))

  // store purchase history (ประวัติการซื้อสินค้า)
  const storeHistoryQuery = useQuery<any>(({
    queryKey: ['his_store', storeHistoryPage, pageSize],
    queryFn: async () => {
      const resp = await apiClient.get('/user/his_store', { params: { page: storeHistoryPage, limit: pageSize } })
      return resp.data
    },
    enabled: activeKey === '7',
    placeholderData: (previousData: any) => previousData,
  } as any))

  React.useEffect(() => {
    const errorConfigs = [
      { isError: paymentsQuery.error, title: 'ประวัติการเติมเหรียญ' },
      { isError: useCoinQuery.error, title: 'ประวัติการใช้เหรียญ' },
      { isError: redeemQuery.error, title: 'ประวัติ REDEEM' },
      { isError: gachaQuery.error, title: 'กิจกรรมกล่องสุ่มปริศนา' },
      { isError: getMoreQuery.error, title: 'ประวัติการได้รับเหรียญเพิ่มเติม' },
      { isError: giftQuery.error, title: 'ประวัติการแลกของขวัญ' },
      { isError: storeHistoryQuery.error, title: 'ประวัติการซื้อสินค้า' }
    ];

    errorConfigs.forEach(({ isError, title }) => {
      if (isError) {
        notification.error({
          message: 'เกิดข้อผิดพลาด',
          description: `ไม่สามารถโหลด${title}ได้`,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          placement: 'topRight',
        });
      }
    });
  }, [
    paymentsQuery.error, useCoinQuery.error, redeemQuery.error,
    gachaQuery.error, getMoreQuery.error, giftQuery.error, storeHistoryQuery.error
  ])

  const giftPrev = (giftQuery as any).previousData
  const giftRaw = React.useMemo(
    () => giftQuery.data?.data ?? giftQuery.data ?? giftPrev?.data ?? giftPrev ?? {},
    [giftQuery.data, giftPrev]
  )
  const gifts = React.useMemo(() => {
    const container = giftRaw
    const list = Array.isArray(container)
      ? container
      : Array.isArray(container?.history)
        ? container.history
        : Array.isArray(container?.data)
          ? container.data
          : []

    return list.map((it: any, idx: number) => ({
      date: it.get_date ? use_date(it.get_date) : it.date ? new Date(it.date).toLocaleString() : it.update_at ? new Date(it.update_at).toLocaleString() : '',
      detail: it.name_gift ?? (it.Gift && Array.isArray(it.Gift) && it.Gift[0]?.name_gift) ?? '-',
      status: it.status ?? '',
      extra: it.reason ?? 'ยังไม่จัดส่ง',
      raw: it,
      key: `${it.id ?? it.txId ?? it.giftID ?? 'gift'}-${idx}`,
    }))
  }, [giftRaw])

  const storeHistoryPrev = (storeHistoryQuery as any).previousData
  const storeHistoryRaw = React.useMemo(
    () => storeHistoryQuery.data?.data ?? storeHistoryQuery.data ?? storeHistoryPrev?.data ?? storeHistoryPrev ?? {},
    [storeHistoryQuery.data, storeHistoryPrev]
  )
  const storeHistories = React.useMemo(() => {
    const list = Array.isArray(storeHistoryRaw)
      ? storeHistoryRaw
      : Array.isArray(storeHistoryRaw?.history)
        ? storeHistoryRaw.history
        : Array.isArray(storeHistoryRaw?.data)
          ? storeHistoryRaw.data
          : []

    return list.map((it: any, idx: number) => ({
      date: it.date ? new Date(it.date).toLocaleString() : '',
      name: it.name_display ?? it.StorePack?.name ?? it.name ?? '-',
      price: it.price_display ?? it.price ?? 0,
      des: it.des ?? it.type ?? '',
      currency: (it.des === 'coin' || it.type === 'coin') ? 'coin' : (it.des === 'stamp' || it.type === 'stamp') ? 'stamp' : 'baht',
      items: it.items || [],
      raw: it,
      key: `${it.id ?? idx}-store-${idx}`,
    }))
  }, [storeHistoryRaw])

  // Ensure current page indices stay within valid range when data or pageSize changes
  React.useEffect(() => {
    const paymentsTotal = paymentsQuery.data?.data?.total ?? paymentsQuery.data?.data?.pagination?.total ?? paymentsQuery.data?.total ?? (paymentsQuery as any).previousData?.data?.total ?? (paymentsQuery as any).previousData?.data?.pagination?.total ?? payments.length
    const maxPaymentsPage = Math.max(1, paymentsQuery.data?.data?.totalPages ?? Math.ceil((paymentsTotal ?? 0) / pageSize))
    if (!paymentsQuery.isFetching && paymentsPage > maxPaymentsPage) setPaymentsPage(maxPaymentsPage)

    const useCoinsTotal = useCoinQuery.data?.data?.total ?? useCoinQuery.data?.data?.pagination?.total ?? useCoinQuery.data?.total ?? (useCoinQuery as any).previousData?.data?.total ?? (useCoinQuery as any).previousData?.data?.pagination?.total ?? useCoins.length
    const maxUseCoinsPage = Math.max(1, useCoinQuery.data?.data?.totalPages ?? Math.ceil((useCoinsTotal ?? 0) / pageSize))
    if (!useCoinQuery.isFetching && useCoinsPage > maxUseCoinsPage) setUseCoinsPage(maxUseCoinsPage)

    const redeemTotal = redeemQuery.data?.data?.total ?? redeemQuery.data?.data?.pagination?.total ?? redeemQuery.data?.total ?? (redeemQuery as any).previousData?.data?.total ?? (redeemQuery as any).previousData?.data?.pagination?.total ?? redeems.length
    const maxRedeemPage = Math.max(1, redeemQuery.data?.data?.totalPages ?? Math.ceil((redeemTotal ?? 0) / pageSize))
    if (!redeemQuery.isFetching && redeemPage > maxRedeemPage) setRedeemPage(maxRedeemPage)

    const gachaTotal = gachaQuery.data?.data?.total ?? gachaQuery.data?.data?.pagination?.total ?? gachaQuery.data?.total ?? (gachaQuery as any).previousData?.data?.total ?? (gachaQuery as any).previousData?.data?.pagination?.total ?? gachas.length
    const maxGachaPage = Math.max(1, gachaQuery.data?.data?.totalPages ?? Math.ceil((gachaTotal ?? 0) / pageSize))
    if (!gachaQuery.isFetching && gachaPage > maxGachaPage) setGachaPage(maxGachaPage)

    const getMoreTotal = getMoreQuery.data?.data?.total ?? getMoreQuery.data?.data?.pagination?.total ?? getMoreQuery.data?.total ?? (getMoreQuery as any).previousData?.data?.total ?? (getMoreQuery as any).previousData?.data?.pagination?.total ?? getMores.length
    const maxGetMorePage = Math.max(1, getMoreQuery.data?.data?.totalPages ?? Math.ceil((getMoreTotal ?? 0) / pageSize))
    if (!getMoreQuery.isFetching && getmorePage > maxGetMorePage) setGetmorePage(maxGetMorePage)

    const giftTotal = giftQuery.data?.data?.total ?? giftQuery.data?.data?.pagination?.total ?? giftQuery.data?.total ?? (giftQuery as any).previousData?.data?.total ?? (giftQuery as any).previousData?.data?.pagination?.total ?? gifts.length
    const maxGiftPage = Math.max(1, giftQuery.data?.data?.totalPages ?? Math.ceil((giftTotal ?? 0) / pageSize))
    if (!giftQuery.isFetching && giftPage > maxGiftPage) setGiftPage(maxGiftPage)

    const storeTotal = storeHistoryQuery.data?.data?.total ?? storeHistoryQuery.data?.data?.pagination?.total ?? storeHistoryQuery.data?.total ?? (storeHistoryQuery as any).previousData?.data?.total ?? (storeHistoryQuery as any).previousData?.data?.pagination?.total ?? storeHistories.length
    const maxStorePage = Math.max(1, storeHistoryQuery.data?.data?.totalPages ?? Math.ceil((storeTotal ?? 0) / pageSize))
    if (!storeHistoryQuery.isFetching && storeHistoryPage > maxStorePage) setStoreHistoryPage(maxStorePage)
  }, [
    payments.length,
    useCoins.length,
    redeems.length,
    gachas.length,
    getMores.length,
    gifts.length,
    storeHistories.length,
    pageSize,
    paymentsPage,
    useCoinsPage,
    redeemPage,
    gachaPage,
    getmorePage,
    giftPage,
    storeHistoryPage,
    paymentsQuery,
    useCoinQuery,
    redeemQuery,
    gachaQuery,
    getMoreQuery,
    giftQuery,
    storeHistoryQuery,
  ])

  const { settings } = useWebsiteStore();

  const tableColumns = React.useMemo(() => {
    if (activeKey === '1') {
      return [
        { title: 'เลขที่รายการ', dataIndex: 'paymentID', key: 'paymentID', width: 220 },
        { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 200 },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
        { title: 'Total', dataIndex: 'price', key: 'price', width: 120, align: 'right' as const },
        { title: 'Detail', dataIndex: 'detail', key: 'detail', width: 120, align: 'center' as const },
      ]
    }

    if (activeKey === '2') {
      return [
        { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
        {
          title: 'ชื่อเรื่อง',
          dataIndex: 'bookTitle',
          key: 'bookTitle',
          render: (text: any, record: any) => (
            <div style={{ whiteSpace: 'nowrap' }}>{text ?? record?.raw?.BookTran?.name ?? ''}</div>
          ),
        },
        {
          title: 'ชื่อตอน',
          dataIndex: 'epTitle',
          key: 'epTitle',
          width: 240,
          render: (text: any, record: any) => (
            <div style={{ whiteSpace: 'nowrap' }}>{text ?? record?.raw?.BookTranEp?.name ?? ''}</div>
          ),
        },
        {
          title: 'Total',
          dataIndex: 'total',
          key: 'total',
          width: 140,
          align: 'right' as const,
          render: (text: any, record: any) => {
            const isFreeCoin = record.type === 'freecoin';
            const src = isFreeCoin ? (settings?.freecoin || '/images/money-bag.png') : (settings?.coin || '/images/e-coin.png');
            return (
              <div className="flex items-center justify-end gap-2">
                <span>{text}</span>
                <Image unoptimized src={src} alt="coin" width={18} height={18} />
              </div>
            )
          },
        },
      ]
    }

    if (activeKey === '3') {
      return [
        { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
        { title: 'Redeem Code', dataIndex: 'code', key: 'code', width: 200 },
        { title: 'รางวัล', dataIndex: 'name', key: 'name', render: (text: any) => <span>{text}</span> },
        {
          title: 'จำนวน',
          dataIndex: 'unit',
          key: 'unit',
          width: 140,
          align: 'right' as const,
          render: (unit: any, record: any) => {
            const type = record?.type ?? ''
            const src = type === 'getcoin' ? settings?.coin || '/images/e-coin.png' : type === 'getfreecoin' ? settings?.freecoin || '/images/money-bag.png' : settings?.coin || '/images/e-coin.png'
            return (
              <div className="flex items-center justify-end gap-2">
                <span>{unit}</span>
                <Image unoptimized src={src} alt="icon" width={18} height={18} />
              </div>
            )
          },
        },
      ]
    }

    if (activeKey === '6') {
      return [
        { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 220 },
        { title: 'รายละเอียด', dataIndex: 'detail', key: 'detail' },
        { title: 'สถานะ', dataIndex: 'status', key: 'status', width: 140, align: 'center' as const },
        { title: 'เพิ่มเติม / Tracking Number', dataIndex: 'extra', key: 'extra', width: 200 },
      ]
    }

    if (activeKey === '7') {
      return [
        { title: 'วัน-เวลา', dataIndex: 'date', key: 'date', width: 140 }, // Reduced from 220
        { title: 'สินค้า', dataIndex: 'name', key: 'name', width: 180 }, // Added width to prevent squishing
        {
          title: 'ราคา',
          dataIndex: 'price',
          key: 'price',
          width: 120, // Reduced from 250
          align: 'right' as const,
          render: (val: any, record: any) => {
            // If price is string (new format), display as is
            if (typeof val === 'string') {
                const parts = val.split(',').map(p => p.trim());
                return (
                    <div className="flex flex-col items-end gap-1">
                        {parts.map((part, idx) => {
                            const [amount, currency] = part.split(' ');
                            const curLower = (currency || '').toLowerCase();
                            
                            const map: Record<string, string> = {
                              coin: settings?.coin || '/images/e-coin.png',
                              coupon: settings?.coupon || '/images/gacha.png',
                              freecoin: settings?.freecoin || '/images/money-bag.png',
                              flower: settings?.flower || '/images/flower.png',
                              heart: settings?.heart || '/images/heart.png',
                              exp: settings?.exp || '/images/exp.png',
                              fast_ticket: settings?.fast_ticket || '/images/fast_ticket.png',
                              stamp: settings?.stamp || '/images/stamp.png',
                              current_rp: settings?.rp || settings?.exp || '/images/e-coin.png',
                              rp: settings?.rp || settings?.exp || '/images/e-coin.png',
                            }
                            const src = map[curLower];

                            if (src) {
                                return (
                                    <div key={idx} className="flex items-center justify-end gap-1">
                                        <span className="text-gray-700 font-medium">{Number(amount).toLocaleString()}</span>
                                        <Image unoptimized src={src} alt={currency} width={16} height={16} />
                                    </div>
                                )
                            }
                            
                            return <span key={idx} className="text-gray-700 font-medium">{part}</span>;
                        })}
                    </div>
                );
            }

            return (
              <div className="flex items-center justify-end gap-2">
                <span>{Number(val).toLocaleString()}</span>
                {record.des === 'coin' ? (
                  <Image unoptimized src={settings?.coin || '/images/e-coin.png'} alt="coin" width={18} height={18} />
                ) : record.des === 'freecoin' ? (
                  <Image unoptimized src={settings?.freecoin || '/images/money-bag.png'} alt="freecoin" width={18} height={18} />
                ) : record.des === 'stamp' ? (
                  <Image unoptimized src={settings?.stamp || '/images/stamp.png'} alt="stamp" width={18} height={18} />
                ) : (
                  <span className="text-gray-500 text-xs">THB</span>
                )}
              </div>
            )
          }
        },
      ]
    }

    if (activeKey === '4') {
      return [
        { title: 'วันที่ได้รับ', dataIndex: 'date', key: 'date', width: 220 },
        {
          title: 'รางวัล',
          dataIndex: 'gift_value',
          key: 'gift_value',
          align: 'center' as const,
          render: (val: any, record: any) => {
            const type = record?.gift_type ?? ''
            const value = val ?? record?.gift_value ?? ''
            const src = type === 'stamp' ? settings?.stamp || '/images/stamp.png' : type === 'freecoin' ? settings?.freecoin || '/images/money-bag.png' : type === 'coin' ? settings?.coin || '/images/e-coin.png' : settings?.stamp || '/images/stamp.png'
            return (
              <div className="flex items-center justify-center gap-2">
                <span className="text-center">{value}</span>
                <Image unoptimized src={src} alt={type} width={18} height={18} />
              </div>
            )
          },
        },
      ]
    }

    if (activeKey === '5') {
      return [
        { title: 'วันที่ได้รับ', dataIndex: 'date', key: 'date', width: 220 },
        { title: 'เงื่อนไข', dataIndex: 'condition', key: 'condition', width: 160 },
        {
          title: 'ประเภท',
          dataIndex: 'currency',
          key: 'currency',
          align: 'center' as const,
          render: (val: any, record: any) => {
            const cur = (val ?? record?.currency ?? '').toLowerCase()
            const map: Record<string, string> = {
              coin: settings?.coin || '/images/e-coin.png',
              coupon: settings?.coupon || '/images/gacha.png',
              freecoin: settings?.freecoin || '/images/money-bag.png',
              flower: settings?.flower || '/images/flower.png',
              heart: settings?.heart || '/images/heart.png',
              exp: settings?.exp || '/images/exp.png',
              fast_ticket: settings?.fast_ticket || '/images/fast_ticket.png',
              stamp: settings?.stamp || '/images/stamp.png',
              current_rp: settings?.rp || settings?.exp || '/images/e-coin.png',
              rp: settings?.rp || settings?.exp || '/images/e-coin.png',
            }
            const src = map[cur] ?? '/images/e-coin.png'
            return (
              <div className="flex items-center justify-center gap-2">
                <Image unoptimized src={src} alt={cur} width={18} height={18} />
              </div>
            )
          },
        },
        { title: 'จำนวน', dataIndex: 'unit', key: 'unit', width: 120, align: 'right' as const },
        { title: 'หมายเหตุ', dataIndex: 'note', key: 'note' },
      ]
    }

    return columns
  }, [
    activeKey,
    columns,
    settings?.coin,
    settings?.coupon,
    settings?.exp,
    settings?.fast_ticket,
    settings?.flower,
    settings?.freecoin,
    settings?.heart,
    settings?.stamp,
    settings?.rp,
  ])

  return (
    <div className="mt-10 mb-10">
      <div className="max-w-6xl mx-auto mt-6 px-2 sm:px-4">
        <div className="bg-rose-50 rounded-xl p-2 sm:p-6">
          <Card styles={{ body: { padding: 12 } }} style={{ borderRadius: 12, border: '1px solid #e5e7eb' }}>
            <div className="mb-4">
              <div className="overflow-x-auto">
                <Tabs
                  className="custom-history-tabs"
                  activeKey={activeKey}
                  onChange={(key) => setActiveKey(key)}
                  tabBarGutter={8}
                  type="line"
                  moreIcon={null}
                  tabBarStyle={{ padding: '6px', background: 'transparent', overflowX: 'visible' }}
                  items={tabs.map((t, i) => ({
                    key: String(i + 1),
                    label: (
                      <div
                        className={`relative px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${activeKey === String(i + 1) ? 'bg-white text-black shadow-sm' : 'bg-transparent text-gray-700 hover:bg-white/60'}`}
                      >
                        {t}
                      </div>
                    ),
                  }))}
                />
                <style jsx>{`
                  /* hide AntD default ink-bar (blue) and nav operations */
                  .custom-history-tabs :global(.ant-tabs-nav .ant-tabs-ink-bar) {
                    display: none !important;
                    background: transparent !important;
                    height: 0 !important;
                    box-shadow: none !important;
                  }

                  .custom-history-tabs :global(.ant-tabs-nav-operations) {
                    display: none !important;
                  }

                  /* give space for custom underline */
                  .custom-history-tabs :global(.ant-tabs-nav-wrap) {
                    padding-bottom: 1.2rem;
                  }

                  /* force tab button text color on active/focus */
                  .custom-history-tabs :global(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn),
                  .custom-history-tabs :global(.ant-tabs-tab-btn:focus),
                  .custom-history-tabs :global(.ant-tabs-tab-btn:active) {
                    color: #B01F1F !important;
                  }

                  /* add a custom red underline centered under the active tab button */
                  .custom-history-tabs :global(.ant-tabs-tab) {
                    position: relative;
                  }

                  .custom-history-tabs :global(.ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn)::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    bottom: -8px;
                    width: 60%;
                    height: 3px;
                    background: #B01F1F;
                    border-radius: 999px;
                    display: block;
                  }
                `}</style>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm border border-gray-200">
              {(activeKey === '1' ? paymentsQuery.isLoading : activeKey === '2' ? useCoinQuery.isLoading : activeKey === '3' ? redeemQuery.isLoading : activeKey === '4' ? gachaQuery.isLoading : activeKey === '5' ? getMoreQuery.isLoading : activeKey === '6' ? giftQuery.isLoading : activeKey === '7' ? storeHistoryQuery.isLoading : false) ? (
                <div className="flex justify-center items-center py-10 min-h-[400px]">
                  <GifLoader className="h-48 w-48" width={200} height={200} />
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    size="small"
                    scroll={{ x: 'max-content' }}
                    columns={tableColumns}
                    dataSource={
                      activeKey === '1'
                        ? payments
                        : activeKey === '2'
                          ? useCoins
                          : activeKey === '3'
                            ? redeems
                            : activeKey === '4'
                              ? gachas
                              : activeKey === '5'
                                ? getMores
                                : activeKey === '6'
                                  ? gifts
                                  : activeKey === '7'
                                    ? storeHistories
                                    : data
                    }
                    expandable={activeKey === '7' ? {
                        expandRowByClick: true,
                        expandedRowRender: (record: any) => {
                            if (!record.items || record.items.length === 0) return null;
                            const srcMap: Record<string, string> = {
                              coin: settings?.coin || '/images/e-coin.png',
                              coupon: settings?.coupon || '/images/gacha.png',
                              freecoin: settings?.freecoin || '/images/money-bag.png',
                              flower: settings?.flower || '/images/flower.png',
                              heart: settings?.heart || '/images/heart.png',
                              exp: settings?.exp || '/images/exp.png',
                              fast_ticket: settings?.fast_ticket || '/images/fast_ticket.png',
                              stamp: settings?.stamp || '/images/stamp.png',
                              current_rp: settings?.rp || settings?.exp || '/images/e-coin.png',
                              rp: settings?.rp || settings?.exp || '/images/e-coin.png',
                            };
                            return (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">รายละเอียดสินค้าในรายการนี้</h4>
                                    <div className="flex flex-col gap-2">
                                        {record.items.map((item: any, i: number) => {
                                             const currency = (item.currency_cached || '').toLowerCase();
                                             const src = srcMap[currency] || null;

                                             return (
                                                <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                                        <span className="text-gray-700 font-medium">{item.pack_name_cached}</span>
                                                        <span className="text-gray-400 text-xs">x {item.quantity}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold text-gray-800">{Number(item.final_price || item.total_price).toLocaleString()}</span>
                                                        {src && <Image unoptimized src={src} alt={currency} width={16} height={16} />}
                                                    </div>
                                                </div>
                                             );
                                        })}
                                    </div>
                                </div>
                            );
                        },
                        rowExpandable: (record: any) => record.items && record.items.length > 0,
                    } : undefined}
                    pagination={
                      activeKey === '1'
                        ? {
                          current: paymentsPage,
                          pageSize,
                          total: paymentsQuery.data?.data?.total ?? paymentsQuery.data?.data?.pagination?.total ?? paymentsQuery.data?.total ?? (paymentsQuery as any).previousData?.data?.total ?? (paymentsQuery as any).previousData?.data?.pagination?.total ?? payments.length,
                          showSizeChanger: false,
                          onChange: (page: number) => {
                            setPaymentsPage(page)
                          },
                        }
                        : activeKey === '2'
                          ? {
                            current: useCoinsPage,
                            pageSize,
                            // prefer server-provided total, fall back to previous known total or array length
                            total: useCoinQuery.data?.data?.total ?? useCoinQuery.data?.data?.pagination?.total ?? useCoinQuery.data?.total ?? (useCoinQuery as any).previousData?.data?.total ?? (useCoinQuery as any).previousData?.data?.pagination?.total ?? useCoins.length,
                            showSizeChanger: false,
                            onChange: (page: number, newPageSize?: number) => {
                              setUseCoinsPage(page)
                              if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
                            },
                          }
                          : activeKey === '3'
                            ? {
                              current: redeemPage,
                              pageSize,
                              // use server total if available, otherwise array length; prefer previousData total if present
                              total: redeemQuery.data?.data?.total ?? redeemQuery.data?.data?.pagination?.total ?? redeemQuery.data?.total ?? (redeemQuery as any).previousData?.data?.total ?? (redeemQuery as any).previousData?.data?.pagination?.total ?? redeems.length,
                              showSizeChanger: false,
                              onChange: (page: number) => setRedeemPage(page),
                            }
                            : activeKey === '4'
                              ? {
                                current: gachaPage,
                                pageSize,
                                total: gachaQuery.data?.data?.total ?? gachaQuery.data?.data?.pagination?.total ?? gachaQuery.data?.total ?? (gachaQuery as any).previousData?.data?.total ?? (gachaQuery as any).previousData?.data?.pagination?.total ?? gachas.length,
                                showSizeChanger: false,
                                onChange: (page: number, newPageSize?: number) => {
                                  setGachaPage(page)
                                  if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
                                },
                              }
                              : activeKey === '5'
                                ? {
                                  current: getmorePage,
                                  pageSize,
                                  total: getMoreQuery.data?.data?.total ?? getMoreQuery.data?.data?.pagination?.total ?? getMoreQuery.data?.total ?? (getMoreQuery as any).previousData?.data?.total ?? (getMoreQuery as any).previousData?.data?.pagination?.total ?? getMores.length,
                                  showSizeChanger: false,
                                  onChange: (page: number, newPageSize?: number) => {
                                    setGetmorePage(page)
                                    if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
                                  },
                                }
                                : activeKey === '6'
                                  ? {
                                    current: giftPage,
                                    pageSize,
                                    total: giftQuery.data?.data?.total ?? giftQuery.data?.data?.pagination?.total ?? giftQuery.data?.total ?? (giftQuery as any).previousData?.data?.total ?? (giftQuery as any).previousData?.data?.pagination?.total ?? gifts.length,
                                    showSizeChanger: false,
                                    onChange: (page: number, newPageSize?: number) => {
                                      setGiftPage(page)
                                      if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
                                    },
                                  }
                                  : activeKey === '7'
                                    ? {
                                      current: storeHistoryPage,
                                      pageSize,
                                      total: storeHistoryQuery.data?.data?.total ?? storeHistoryQuery.data?.data?.pagination?.total ?? storeHistoryQuery.data?.total ?? (storeHistoryQuery as any).previousData?.data?.total ?? (storeHistoryQuery as any).previousData?.data?.pagination?.total ?? storeHistories.length,
                                      showSizeChanger: false,
                                      onChange: (page: number, newPageSize?: number) => {
                                        setStoreHistoryPage(page)
                                        if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
                                      },
                                    }
                                    : { pageSize, current: 1, total: data.length }
                    }
                    rowKey="key"
                    locale={{
                      emptyText: (
                        <div className="p-10">
                          <Empty description={<span className="text-sm">No data</span>} />
                        </div>
                      ),
                    }}
                    // give table a little spacing to match screenshot look
                    style={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default History;
