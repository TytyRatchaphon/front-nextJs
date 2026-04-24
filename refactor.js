const fs = require('fs');
const p = 'src/features/user/EditMyBook.tsx';
let c = fs.readFileSync(p, 'utf8');

const hookCalls = `
	const router = useRouter()
	const { notification, modal: modalApi } = App.useApp()
	const messageApi = {
		success: (content) => notification.success({ message: String(content ?? '') }),
		error: (content) => notification.error({ message: String(content ?? '') }),
		warning: (content) => notification.warning({ message: String(content ?? '') }),
		info: (content) => notification.info({ message: String(content ?? '') }),
	}

	const { display, computedVisibleEps, getBookName, query, purchaseQuery, groupsQuery } = useEditBookData(initialBook, bookId)

	const {
		selectedGroupId, isGroupModalOpen, editingGroup, addGroupModalOpen, newGroupName,
		creatingGroup, newGroupError, deletingId, confirmModalOpen, selectedIds, selectAllChecked,
		episodeFilter, priceModalOpen, priceSelected, priceSubmitting, modalSelectedEpIds,
		groupEpisodesQuery,
		setNewGroupName, setNewGroupError, setAddGroupModalOpen, setConfirmModalOpen,
		setEpisodeFilter, setSelectedIds, setSelectAllChecked,
		setPriceModalOpen, setPriceSelected, setModalSelectedEpIds,
		validateGroupName, openGroupModal, closeGroupModal,
		handleOpenEditGroup, handleOpenAddGroup,
		handleDeleteEpisode, toggleSelect, handleSelectAll,
		handleBulkDelete, handleDeleteGroup, handleSubmitGroup,
		handleUpdatePrice, handleMenuClick,
	} = useEditBookGroups(bookId, groupsQuery, messageApi, modalApi)

	const clearSelection = () => { setSelectedIds(new Set()); setSelectAllChecked(false) }
	const {
		promoModalOpen, promoName, promoDiscount, promoStart, promoEnd,
		promoSelectedGroups, creatingPromo, openPromoId, editingPromoId,
		promoEpModalOpen, cancelPromoEpModalOpen, promoDiscountPrice,
		promoStartDate, promoEndDate, promoEpSubmitting,
		setPromoModalOpen, setPromoName, setPromoDiscount, setPromoStart, setPromoEnd,
		setPromoSelectedGroups, setOpenPromoId, setEditingPromoId,
		setPromoEpModalOpen, setCancelPromoEpModalOpen, setPromoDiscountPrice,
		setPromoStartDate, setPromoEndDate,
		resetPromoForm, handleDeletePromotion, handleOpenEditPromotion,
		handleCreatePromotion, handleBulkSetPromotion, handleBulkCancelPromotion,
	} = useEditBookPromotions(
		bookId, messageApi,
		() => query.refetch(), () => purchaseQuery.refetch(),
		() => groupEpisodesQuery.refetch(),
		selectedIds, clearSelection,
		groupEpisodesQuery.data, selectedGroupId,
	)

	const handleFullMenuClick = (info) => {
		const { key } = info
		if (key === 'set_promotion') {
			if (Array.from(selectedIds).length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการตั้งค่าส่วนลด')
			setPromoEpModalOpen(true)
			return
		} else if (key === 'cancel_promotion') {
			if (Array.from(selectedIds).length === 0) return messageApi.info('กรุณาเลือกตอนที่ต้องการยกเลิกส่วนลด')
			setCancelPromoEpModalOpen(true)
			return
		}
		handleMenuClick(info)
	}
`;

const startIndex = c.indexOf('\tconst [book, setBook] = useState<Partial<BookDetail> | null>(initialBook || null)');
const endIndex = c.indexOf('\t// While no book data, show a loading indicator');

if (startIndex > -1 && endIndex > -1) {
    c = c.substring(0, startIndex) + hookCalls + '\n' + c.substring(endIndex);
    fs.writeFileSync(p, c, 'utf8');
    console.log('Replaced hooks section successfully');
} else {
    console.log('Could not find start/end indices: startIndex=', startIndex, 'endIndex=', endIndex);
}
