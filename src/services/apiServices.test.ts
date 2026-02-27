import { describe, it, expect } from 'vitest'
import * as api from '@/services/apiServices'

/**
 * Barrel re-export verification test
 * 
 * Ensures that apiServices.ts still exports every function
 * after splitting into domain files under services/api/
 */
describe('apiServices barrel re-export', () => {

  // --- homeApi ---
  it('exports homeApi functions', () => {
    expect(api.fetchHomeData).toBeTypeOf('function')
    expect(api.fetchBookUpdates).toBeTypeOf('function')
  })

  // --- bookApi ---
  it('exports bookApi functions', () => {
    expect(api.fetchBookTrans).toBeTypeOf('function')
    expect(api.fetchBookTransById).toBeTypeOf('function')
    expect(api.fetchBookDetail).toBeTypeOf('function')
    expect(api.fetchMyBookDetail).toBeTypeOf('function')
    expect(api.fetchBookEpisodes).toBeTypeOf('function')
    expect(api.fetchBookPurchaseDetails).toBeTypeOf('function')
    expect(api.fetchBookRecommendation).toBeTypeOf('function')
    expect(api.fetchBookPromotionOptions).toBeTypeOf('function')
    expect(api.fetchLatestReadEpisode).toBeTypeOf('function')
    expect(api.resolveEpisodeId).toBeTypeOf('function')
    expect(api.resolveBookId).toBeTypeOf('function')
    expect(api.buyGroupPromotion).toBeTypeOf('function')
    expect(api.postBookClick).toBeTypeOf('function')
    expect(api.fetchBookPromotions).toBeTypeOf('function')
  })

  // --- bookManageApi ---
  it('exports bookManageApi functions', () => {
    expect(api.fetchBookStats).toBeTypeOf('function')
    expect(api.fetchBookAnalytics).toBeTypeOf('function')
    expect(api.fetchBookEpisodesStats).toBeTypeOf('function')
    expect(api.fetchBookGroups).toBeTypeOf('function')
    expect(api.fetchGroupEpisodes).toBeTypeOf('function')
    expect(api.createGroup).toBeTypeOf('function')
    expect(api.updateGroup).toBeTypeOf('function')
    expect(api.deleteGroup).toBeTypeOf('function')
    expect(api.deleteGroupEpisode).toBeTypeOf('function')
    expect(api.updateEpisodesPrice).toBeTypeOf('function')
    expect(api.createPromotion).toBeTypeOf('function')
    expect(api.updatePromotion).toBeTypeOf('function')
    expect(api.deletePromotion).toBeTypeOf('function')
    expect(api.createGroupEpisodePromotion).toBeTypeOf('function')
    expect(api.deleteGroupEpisodePromotion).toBeTypeOf('function')
    expect(api.fetchUserMyBooks).toBeTypeOf('function')
    expect(api.fetchUserMyBookInfo).toBeTypeOf('function')
  })

  // --- commentApi ---
  it('exports commentApi functions', () => {
    expect(api.fetchBookReviews).toBeTypeOf('function')
    expect(api.postBookReview).toBeTypeOf('function')
    expect(api.postReply).toBeTypeOf('function')
    expect(api.deleteBookReview).toBeTypeOf('function')
    expect(api.reportBookReview).toBeTypeOf('function')
    expect(api.deleteBookReviewReply).toBeTypeOf('function')
    expect(api.reportBookReviewReply).toBeTypeOf('function')
    expect(api.fetchBookComments).toBeTypeOf('function')
    expect(api.postCommentReply).toBeTypeOf('function')
    expect(api.deleteBookComment).toBeTypeOf('function')
    expect(api.reportBookComment).toBeTypeOf('function')
    expect(api.deleteBookCommentReply).toBeTypeOf('function')
    expect(api.reportBookCommentReply).toBeTypeOf('function')
    expect(api.fetchEpisodeComments).toBeTypeOf('function')
    expect(api.postEpisodeComment).toBeTypeOf('function')
    expect(api.postEpisodeReply).toBeTypeOf('function')
    expect(api.reportEpisodeComment).toBeTypeOf('function')
    expect(api.reportEpisodeReply).toBeTypeOf('function')
    expect(api.deleteEpisodeComment).toBeTypeOf('function')
    expect(api.deleteEpisodeReply).toBeTypeOf('function')
  })

  // --- threadApi ---
  it('exports threadApi functions', () => {
    expect(api.fetchThreads).toBeTypeOf('function')
    expect(api.createThread).toBeTypeOf('function')
    expect(api.fetchThreadDetail).toBeTypeOf('function')
    expect(api.fetchThreadComments).toBeTypeOf('function')
    expect(api.postThreadComment).toBeTypeOf('function')
    expect(api.postThreadReply).toBeTypeOf('function')
    expect(api.reportThreadComment).toBeTypeOf('function')
    expect(api.reportThreadReply).toBeTypeOf('function')
    expect(api.deleteThreadComment).toBeTypeOf('function')
    expect(api.deleteThreadReply).toBeTypeOf('function')
    expect(api.deleteThread).toBeTypeOf('function')
  })

  // --- articleApi ---
  it('exports articleApi functions', () => {
    expect(api.fetchPopularArticles).toBeTypeOf('function')
    expect(api.fetchLatestArticles).toBeTypeOf('function')
    expect(api.fetchArticleDetail).toBeTypeOf('function')
  })

  // --- campaignApi ---
  it('exports campaignApi functions', () => {
    expect(api.fetchPackCampaignDetail).toBeTypeOf('function')
    expect(api.fetchCampaignsDiscount).toBeTypeOf('function')
    expect(api.fetchCampaignDetail).toBeTypeOf('function')
    expect(api.postCampaignClick).toBeTypeOf('function')
    expect(api.postBannerClick).toBeTypeOf('function')
  })

  // --- rankingApi ---
  it('exports rankingApi functions', () => {
    expect(api.fetchRankingBooks).toBeTypeOf('function')
    expect(api.fetchRankingCategories).toBeTypeOf('function')
    expect(api.fetchCategoryRankingBooks).toBeTypeOf('function')
  })

  // --- userApi ---
  it('exports userApi functions', () => {
    expect(api.registerWriter).toBeTypeOf('function')
    expect(api.updateWriter).toBeTypeOf('function')
    expect(api.fetchWriterCheck).toBeTypeOf('function')
    expect(api.updateUserAddress).toBeTypeOf('function')
    expect(api.fetchPublicWriterProfile).toBeTypeOf('function')
    expect(api.fetchWriterBooks).toBeTypeOf('function')
    expect(api.followWriter).toBeTypeOf('function')
    expect(api.fetchUserShelve).toBeTypeOf('function')
    expect(api.fetchUserShelveContinue).toBeTypeOf('function')
    expect(api.fetchUserShelveBuy).toBeTypeOf('function')
    expect(api.redeemCode).toBeTypeOf('function')
    expect(api.refreshToken).toBeTypeOf('function')
    expect(api.fetchWebsiteSettings).toBeTypeOf('function')
    expect(api.fetchWriterProfile).toBeTypeOf('function')
    expect(api.checkWriterStatus).toBeTypeOf('function')
  })

  // --- writerApi ---
  it('exports writerApi functions', () => {
    expect(api.getBankList).toBeTypeOf('function')
    expect(api.updateBankIdCardAccount).toBeTypeOf('function')
    expect(api.getBankIdCardAccount).toBeTypeOf('function')
    expect(api.postWriterWithdraw).toBeTypeOf('function')
    expect(api.fetchWriterWithdrawHistory).toBeTypeOf('function')
    expect(api.fetchWriterWithdrawSetting).toBeTypeOf('function')
  })

  // --- storeApi ---
  it('exports storeApi functions', () => {
    expect(api.fetchStoreData).toBeTypeOf('function')
    expect(api.buyStorePack).toBeTypeOf('function')
    expect(api.buyStorePackNow).toBeTypeOf('function')
    expect(api.fetchStickers).toBeTypeOf('function')
    expect(api.fetchAvailableCoupons).toBeTypeOf('function')
    expect(api.fetchUserCoupons).toBeTypeOf('function')
    expect(api.claimCoupon).toBeTypeOf('function')
    expect(api.claimCouponByCode).toBeTypeOf('function')
    expect(api.useCoupon).toBeTypeOf('function')
  })

  // --- miscApi ---
  it('exports miscApi functions', () => {
    expect(api.logActivity).toBeTypeOf('function')
    expect(api.syncReadingProgress).toBeTypeOf('function')
    expect(api.updateReadingProgress).toBeTypeOf('function')
    expect(api.fetchBookCategoryAll).toBeTypeOf('function')
    expect(api.fetchAllCategories).toBeTypeOf('function')
    expect(api.fetchCategoryBooks).toBeTypeOf('function')
    expect(api.fetchActiveTypes).toBeTypeOf('function')
    expect(api.fetchActiveCategories).toBeTypeOf('function')
    expect(api.fetchRecentNotifications).toBeTypeOf('function')
    expect(api.fetchAllNotifications).toBeTypeOf('function')
    expect(api.markNotificationAsRead).toBeTypeOf('function')
    expect(api.markAllNotificationsAsRead).toBeTypeOf('function')
    expect(api.postCommentNotification).toBeTypeOf('function')
    expect(api.postReviewNotification).toBeTypeOf('function')
    expect(api.postReviewReplyNotification).toBeTypeOf('function')
    expect(api.postCommentReplyNotification).toBeTypeOf('function')
    expect(api.fetchFaqs).toBeTypeOf('function')
    expect(api.getSearchHistory).toBeTypeOf('function')
    expect(api.deleteSearchHistory).toBeTypeOf('function')
    expect(api.saveSearchHistory).toBeTypeOf('function')
    expect(api.clearSearchHistory).toBeTypeOf('function')
    expect(api.fetchPopularSearches).toBeTypeOf('function')
    expect(api.fetchSearchSuggestions).toBeTypeOf('function')
  })
})
