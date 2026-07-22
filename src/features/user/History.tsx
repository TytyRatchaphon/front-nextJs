"use client"

import React from 'react'
import { Card, Tabs, Table, Empty, notification } from 'antd';
import {
  fetchGachaHistory,
  fetchGetMoreHistory,
  fetchGiftHistory,
  fetchPaymentHistory,
  fetchRedeemHistory,
  fetchStoreHistory,
  fetchUseCoinHistory,
} from '@/services/apiServices'
import { useHistoryTab } from './hooks/useHistoryTab'
import { clampHistoryPage, getHistoryTotal, type HistoryQueryLike } from './historyPagination'
import { createHistoryColumns, createStoreHistoryExpandable, HISTORY_TABS } from './historyColumns'
import { get_date as use_date } from '@/utils/dateUtils'
import '@/features/Home/components/Banner';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import GifLoader from '@/components/utility/GifLoader';
import '@/utils/imageUtils';
import { CloseCircleOutlined } from '@ant-design/icons';


function History() {
  const [activeKey, setActiveKey] = React.useState<string>('1')

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
  const [pageSize, setPageSize] = React.useState(20)

  // keep last-known totals to avoid transient 0 totals during fetches



  const {
    page: paymentsPage,
    setPage: setPaymentsPage,
    query: paymentsQuery,
  } = useHistoryTab({
    queryKey: 'his_payment',
    pageSize,
    enabled: activeKey === '1',
    fetcher: fetchPaymentHistory,
  })

  const {
    page: useCoinsPage,
    setPage: setUseCoinsPage,
    query: useCoinQuery,
  } = useHistoryTab({
    queryKey: 'his_usecoin',
    pageSize,
    enabled: activeKey === '2',
    fetcher: fetchUseCoinHistory,
  })



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
  const {
    page: redeemPage,
    setPage: setRedeemPage,
    query: redeemQuery,
  } = useHistoryTab({
    queryKey: 'his_redeem',
    pageSize,
    enabled: activeKey === '3',
    fetcher: fetchRedeemHistory,
  })

  // gacha (กิจกรรมกล่องสุ่มปริศนา) history
  const {
    page: gachaPage,
    setPage: setGachaPage,
    query: gachaQuery,
  } = useHistoryTab({
    queryKey: 'his_gacha',
    pageSize,
    enabled: activeKey === '4',
    fetcher: fetchGachaHistory,
  })

  // history of received extras (ประวัติการได้รับเหรียญเพิ่มเติม)
  const {
    page: getmorePage,
    setPage: setGetmorePage,
    query: getMoreQuery,
  } = useHistoryTab({
    queryKey: 'his_getmore',
    pageSize,
    enabled: activeKey === '5',
    fetcher: fetchGetMoreHistory,
  })

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
        fastTrack: it.fast_track ?? (
          it.fast_use_type || it.fast_use_amount
            ? {
              fast_use_type: it.fast_use_type,
              fast_use_amount: it.fast_use_amount,
            }
            : null
        ),
        key: `${it.id ?? it.txId ?? it.paymentID ?? 'usecoin'}-${idx}`,
      }
    })
  }, [useCoinRaw])

  // his_gift (ประวัติการแลกของขวัญ)
  const {
    page: giftPage,
    setPage: setGiftPage,
    query: giftQuery,
  } = useHistoryTab({
    queryKey: 'his_gift',
    pageSize,
    enabled: activeKey === '6',
    fetcher: fetchGiftHistory,
  })

  // store purchase history (ประวัติการซื้อสินค้า)
  const {
    page: storeHistoryPage,
    setPage: setStoreHistoryPage,
    query: storeHistoryQuery,
  } = useHistoryTab({
    queryKey: 'his_store',
    pageSize,
    enabled: activeKey === '7',
    fetcher: fetchStoreHistory,
  })

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

  const historyPageConfigs = React.useMemo(() => [
    {
      query: paymentsQuery as HistoryQueryLike,
      page: paymentsPage,
      fallbackLength: payments.length,
      setPage: setPaymentsPage,
    },
    {
      query: useCoinQuery as HistoryQueryLike,
      page: useCoinsPage,
      fallbackLength: useCoins.length,
      setPage: setUseCoinsPage,
    },
    {
      query: redeemQuery as HistoryQueryLike,
      page: redeemPage,
      fallbackLength: redeems.length,
      setPage: setRedeemPage,
    },
    {
      query: gachaQuery as HistoryQueryLike,
      page: gachaPage,
      fallbackLength: gachas.length,
      setPage: setGachaPage,
    },
    {
      query: getMoreQuery as HistoryQueryLike,
      page: getmorePage,
      fallbackLength: getMores.length,
      setPage: setGetmorePage,
    },
    {
      query: giftQuery as HistoryQueryLike,
      page: giftPage,
      fallbackLength: gifts.length,
      setPage: setGiftPage,
    },
    {
      query: storeHistoryQuery as HistoryQueryLike,
      page: storeHistoryPage,
      fallbackLength: storeHistories.length,
      setPage: setStoreHistoryPage,
    },
  ], [
    paymentsQuery,
    paymentsPage,
    payments.length,
    useCoinQuery,
    useCoinsPage,
    useCoins.length,
    redeemQuery,
    redeemPage,
    redeems.length,
    gachaQuery,
    gachaPage,
    gachas.length,
    getMoreQuery,
    getmorePage,
    getMores.length,
    giftQuery,
    giftPage,
    gifts.length,
    storeHistoryQuery,
    storeHistoryPage,
    storeHistories.length,
  ])

  // Ensure current page indices stay within valid range when data or pageSize changes
  React.useEffect(() => {
    historyPageConfigs.forEach((config) => {
      clampHistoryPage({
        ...config,
        pageSize,
      })
    })
  }, [historyPageConfigs, pageSize])

  const { settings } = useWebsiteSettings();

  const tableColumns = React.useMemo(() => createHistoryColumns({ activeKey, settings }), [activeKey, settings])

  const storeHistoryExpandable = React.useMemo(() => createStoreHistoryExpandable(settings), [settings])

  const createHistoryPagination = React.useCallback(({
    page,
    query,
    fallbackLength,
    setPage,
  }: {
    page: number;
    query: HistoryQueryLike;
    fallbackLength: number;
    setPage: (page: number) => void;
  }) => ({
    current: page,
    pageSize,
    total: getHistoryTotal(query, fallbackLength),
    showSizeChanger: false,
    onChange: (nextPage: number, newPageSize?: number) => {
      setPage(nextPage)
      if (newPageSize && newPageSize !== pageSize) setPageSize(newPageSize)
    },
  }), [pageSize])

  const tablePagination = React.useMemo(() => {
    if (activeKey === '1') {
      return createHistoryPagination({
        page: paymentsPage,
        query: paymentsQuery as HistoryQueryLike,
        fallbackLength: payments.length,
        setPage: setPaymentsPage,
      })
    }

    if (activeKey === '2') {
      return createHistoryPagination({
        page: useCoinsPage,
        query: useCoinQuery as HistoryQueryLike,
        fallbackLength: useCoins.length,
        setPage: setUseCoinsPage,
      })
    }

    if (activeKey === '3') {
      return createHistoryPagination({
        page: redeemPage,
        query: redeemQuery as HistoryQueryLike,
        fallbackLength: redeems.length,
        setPage: setRedeemPage,
      })
    }

    if (activeKey === '4') {
      return createHistoryPagination({
        page: gachaPage,
        query: gachaQuery as HistoryQueryLike,
        fallbackLength: gachas.length,
        setPage: setGachaPage,
      })
    }

    if (activeKey === '5') {
      return createHistoryPagination({
        page: getmorePage,
        query: getMoreQuery as HistoryQueryLike,
        fallbackLength: getMores.length,
        setPage: setGetmorePage,
      })
    }

    if (activeKey === '6') {
      return createHistoryPagination({
        page: giftPage,
        query: giftQuery as HistoryQueryLike,
        fallbackLength: gifts.length,
        setPage: setGiftPage,
      })
    }

    if (activeKey === '7') {
      return createHistoryPagination({
        page: storeHistoryPage,
        query: storeHistoryQuery as HistoryQueryLike,
        fallbackLength: storeHistories.length,
        setPage: setStoreHistoryPage,
      })
    }

    return { pageSize, current: 1, total: data.length }
  }, [
    activeKey,
    createHistoryPagination,
    data.length,
    gachaPage,
    gachaQuery,
    gachas.length,
    getMoreQuery,
    getMores.length,
    getmorePage,
    giftPage,
    giftQuery,
    gifts.length,
    pageSize,
    payments.length,
    paymentsPage,
    paymentsQuery,
    redeemPage,
    redeemQuery,
    redeems.length,
    storeHistories.length,
    storeHistoryPage,
    storeHistoryQuery,
    useCoinQuery,
    useCoins.length,
    useCoinsPage,
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
                  items={HISTORY_TABS.map((t, i) => ({
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
                    expandable={activeKey === '7' ? storeHistoryExpandable : undefined}
                    pagination={tablePagination}
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

