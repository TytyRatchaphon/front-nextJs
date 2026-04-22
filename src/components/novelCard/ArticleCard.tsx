import Image from 'next/image';
import Link from 'next/link';
import parse from 'html-react-parser';
import { Clock, Eye } from 'lucide-react';
import { ArticleItem } from '@/types/api';

interface ArticleCardProps {
  article: ArticleItem;
}



function ArticleCard({ article }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Link href={`/article/${article.id}`} className="block">
      <div className="w-[265px] h-[205px] flex flex-col gap-2 font-primary cursor-pointer group">
        {/* Image Container */}
        <div className="w-full h-[140px] relative rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={article.img}
            alt={typeof article.name === 'string' ? article.name.replace(/<[^>]*>?/gm, '') : 'Article'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1 min-h-0">
          {/* Title */}
          <div className="text-sm font-bold text-gray-900 line-clamp-1 truncate group-hover:text-red-600 transition-colors">
            {parse(article.name)}
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(article.date_post)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{article.view}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ArticleCard;
