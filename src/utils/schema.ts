/**
 * Schema.org JSON-LD structured data generators for SEO.
 * 
 * These utilities produce valid Schema.org objects that can be
 * injected into pages via <script type="application/ld+json">.
 *
 * @see https://schema.org
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

const BASE_URL = 'https://enjoybook.co';

// ─── Input Types ────────────────────────────────────────────

export interface BookSchemaInput {
  name: string;
  authorName: string;
  description: string;
  image: string;
  url: string;
  genre?: string;
  genre2?: string;
  ratingValue?: number;
  reviewCount?: number;
  numberOfChapters?: number;
  datePublished?: string;
  dateModified?: string;
  bookId?: number | string;
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  image?: string;
  url: string;
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
}

export interface ThreadSchemaInput {
  title: string;
  body: string;
  url: string;
  authorName?: string;
  datePublished?: string;
  commentCount?: number;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProfileSchemaInput {
  name: string;
  description: string;
  url: string;
  image?: string;
  interactionStatistic?: {
    interactionType: string;
    userInteractionCount: number;
  };
}

// ─── Generators ─────────────────────────────────────────────

/**
 * Generates a WebSite schema with SearchAction for sitelinks search box.
 * Used on the homepage.
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Enjoybook',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates a Book schema with optional AggregateRating.
 * Maps to https://schema.org/Book
 */
export function generateBookSchema(input: BookSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: input.name,
    url: input.url,
    image: input.image,
    description: input.description,
    author: {
      '@type': 'Person',
      name: input.authorName || 'Unknown',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Enjoybook',
      url: BASE_URL,
    },
    inLanguage: 'th',
    bookFormat: 'https://schema.org/EBook',
  };

  if (input.genre) {
    schema.genre = input.genre2
      ? [input.genre, input.genre2]
      : input.genre;
  }

  if (input.numberOfChapters && input.numberOfChapters > 0) {
    schema.numberOfPages = input.numberOfChapters;
  }

  if (input.datePublished) {
    schema.datePublished = input.datePublished;
  }

  if (input.dateModified) {
    schema.dateModified = input.dateModified;
  }

  if (
    input.ratingValue != null &&
    input.ratingValue > 0 &&
    input.reviewCount != null &&
    input.reviewCount > 0
  ) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: input.ratingValue,
      reviewCount: input.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Generates an Article schema.
 * Maps to https://schema.org/Article
 */
export function generateArticleSchema(input: ArticleSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: input.url,
    publisher: {
      '@type': 'Organization',
      name: 'Enjoybook',
      url: BASE_URL,
    },
    inLanguage: 'th',
  };

  if (input.image) {
    schema.image = input.image;
  }

  if (input.authorName) {
    schema.author = {
      '@type': 'Person',
      name: input.authorName,
    };
  }

  if (input.datePublished) {
    schema.datePublished = input.datePublished;
  }

  if (input.dateModified) {
    schema.dateModified = input.dateModified;
  }

  return schema;
}

/**
 * Generates a DiscussionForumPosting schema for threads.
 * Maps to https://schema.org/DiscussionForumPosting
 */
export function generateThreadSchema(input: ThreadSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: input.title,
    text: input.body,
    url: input.url,
    publisher: {
      '@type': 'Organization',
      name: 'Enjoybook',
    },
  };

  if (input.authorName) {
    schema.author = {
      '@type': 'Person',
      name: input.authorName,
    };
  }

  if (input.datePublished) {
    schema.datePublished = input.datePublished;
  }

  if (input.commentCount != null && input.commentCount > 0) {
    schema.commentCount = input.commentCount;
  }

  return schema;
}

/**
 * Generates a BreadcrumbList schema.
 * Maps to https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates a CollectionPage schema for category/listing pages.
 * Maps to https://schema.org/CollectionPage
 */
export function generateCollectionPageSchema(input: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: input.name,
    description: input.description,
    url: input.url,
    publisher: {
      '@type': 'Organization',
      name: 'Enjoybook',
      url: BASE_URL,
    },
  };
}

/**
 * Generates a FAQPage schema for the FAQ page.
 * Maps to https://schema.org/FAQPage
 */
export function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates a ProfilePage schema for writer profiles.
 * Maps to https://schema.org/ProfilePage
 */
export function generateProfilePageSchema(input: ProfileSchemaInput) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: input.name,
      description: input.description,
      url: input.url,
    },
  };

  if (input.image) {
    (schema.mainEntity as any).image = input.image;
  }

  if (input.interactionStatistic) {
    (schema.mainEntity as any).interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: `https://schema.org/${input.interactionStatistic.interactionType}`,
      userInteractionCount: input.interactionStatistic.userInteractionCount,
    };
  }

  return schema;
}
