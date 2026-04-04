import type { BlogPost, RecipeFaq } from "@/lib/types";
import { absoluteUrl } from "@/lib/utils";

export type ItemListEntry = {
  name: string;
  url: string;
  image?: string;
};

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function buildArticleStructuredData(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    headline: post.title,
    description: post.description,
    image: post.imageUrl ? [post.imageUrl] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.authorName
    },
    publisher: {
      "@type": "Organization",
      name: "FlamingFoodies",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/api/og?title=FlamingFoodies")
      }
    },
    articleSection: post.category,
    keywords: post.tags.length ? post.tags.join(", ") : undefined,
    wordCount: countWords(post.content)
  };
}

export function buildFaqStructuredData(faqs: RecipeFaq[]) {
  if (!faqs.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function buildItemListStructuredData(name: string, items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
      image: item.image
    }))
  };
}
