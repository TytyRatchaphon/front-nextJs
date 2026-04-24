const fs = require('fs');
const p = 'src/features/user/EditMyBook.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Replace imports
c = c.replace(/import \{ fetchBookDetail.*?\} from '@\/services\/apiServices'/s, "import { useEditBookData } from './hooks/useEditBookData'\nimport { useEditBookGroups } from './hooks/useEditBookGroups'\nimport { useEditBookPromotions } from './hooks/useEditBookPromotions'");

// 2. Replace hooks block
const hookCalls = `	const router = useRouter()
	const { notification, modal: modalApi } = App.useApp()
	const messageApi = {
		success: (content) => notification.success({ message: String(content ?? '') }),
		error: (content) => notification.error({ message: String(content ?? '') }),
		warning: (content) => notification.warning({ message: String(content ?? '') }),
		info: (content) => notification.info({ message: String(content ?? '') }),
	}

	const { display, computedVisibleEps, getBookName, query, purchaseQuery, groupsQuery } = useEditBookData(initialBook, bookId)

	const groups = useEditBookGroups(bookId, groupsQuery, messageApi, modalApi)
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
	} = groups

	const clearSelection = () => { setSelectedIds(new Set()); setSelectAllChecked(false) }
	const promos = useEditBookPromotions(
		bookId, messageApi,
		() => query.refetch(), () => purchaseQuery.refetch(),
		() => groupEpisodesQuery.refetch(),
		selectedIds, clearSelection,
		groupEpisodesQuery.data, selectedGroupId,
	)
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
	} = promos

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
    c = c.substring(0, startIndex) + hookCalls + c.substring(endIndex);
}

// 3. Replace Add Group handler
c = c.replace(/onClick=\{async \(\) => \{\s+const trimmed = String\(newGroupName \?\? ''\)\.trim\(\)[\s\S]*?setCreatingGroup\(false\)\s+\}\s+\}\}/g, 'onClick={() => handleSubmitGroup(String(newGroupName ?? \'\').trim())}');

// 4. Replace Update Price handler
c = c.replace(/onClick=\{async \(\) => \{\s+if \(\!modalSelectedEpIds \|\| modalSelectedEpIds\.length === 0\) return messageApi\.info\('ไม่มีตอนที่เลือก'\)[\s\S]*?setPriceSubmitting\(false\)\s+\}\s+\}\}/g, 'onClick={handleUpdatePrice}');

// 5. Replace menu click handler
c = c.replace(/onClick: handleMenuClick \}\} placement="topRight">/g, 'onClick: handleFullMenuClick }} placement="topRight">');

fs.writeFileSync(p, c, 'utf8');
console.log('Done refactoring');
