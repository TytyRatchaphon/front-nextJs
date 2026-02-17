const fs = require('fs');
const path = require('path');

const files = [
  'src/features/campaign/CampaignDetail.tsx',
  'src/features/campaign/PackCampaign.tsx',
  'src/features/user/Store.tsx',
  'src/features/user/History.tsx',
  'src/features/read/page.client.internal.tsx',
  'src/features/mybook/Report.tsx',
  'src/features/Home/CategoryRank.tsx',
  'src/features/Home/HowToRegis.tsx',
  'src/features/article/ArticleDetail.tsx',
  'src/components/utility/AmountPill.tsx',
  'src/components/utility/StampPill.tsx',
  'src/components/utility/StoreCard.tsx',
  'src/components/utility/FreeCoinPill.tsx',
  'src/components/utility/FloatingGiftButton.tsx',
  'src/components/novelCard/PackCardBookHorizontal.tsx',
  'src/components/novelCard/PackCardBook.tsx',
  'src/components/novelCard/NewArrivalCard.tsx',
  'src/components/novelCard/CategoryHorizontalCard.tsx',
  'src/components/novelCard/ArticleCard.tsx',
  'src/components/novelCard/CardBook.tsx',
  'src/components/home/Footer.tsx',
  'src/components/home/RankingCategoryRight.tsx',
  'src/components/home/RankingCategoryLeft.tsx',
  'src/components/home/TopRanking.tsx',
  'src/components/event/AllEvent.tsx',
  'src/components/event/SevenDaysLogin.tsx',
  'src/components/event/UserProfileEvent.tsx',
  'src/features/book/ThreadCommentItem.tsx',
  'src/components/bookdetail/CommentItem.tsx',
  'src/components/bookdetail/BookInfoCard.tsx',
  'src/components/bookdetail/BookDetailHeader.tsx'
];

let updatedCount = 0;

files.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if file has the loader prop
      if (content.includes('unoptimized')) {
        // Replace globally
        const newContent = content.replace(/loader=\{imageLoader\}/g, 'unoptimized');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${relativePath}`);
        updatedCount++;
      } else {
        console.log(`No match in: ${relativePath}`);
      }
    } catch (e) {
      console.error(`Error processing ${relativePath}: ${e.message}`);
    }
  } else {
    console.error(`File not found: ${relativePath}`);
  }
});

console.log(`Total files updated: ${updatedCount}`);
