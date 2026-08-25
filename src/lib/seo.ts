import { SITE } from "./site";
import type { Post, Project } from "./types";

// 구조화 데이터(JSON-LD). 검색 결과에 작성자·날짜·빵부스러기가 붙는 근거다.
// 화면에는 안 보이지만 크롤러가 읽는다. 페이지 컴포넌트에서 <JsonLd data={...} /> 로 심는다.

const PERSON_ID = `${SITE.url}/#person`;
const SITE_ID = `${SITE.url}/#website`;

/** publishedAt(ISO)이 있으면 그걸, 없으면 "2026.08.25" 표기를 ISO 날짜로 되돌린다. */
export function isoDate(post: Pick<Post, "date" | "publishedAt">): string {
  return post.publishedAt ?? post.date.replace(/\./g, "-");
}

function personNode() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.author,
    url: SITE.url,
    ...(SITE.avatarUrl ? { image: `${SITE.url}${SITE.avatarUrl}` } : {}),
  };
}

/** 루트 레이아웃용. 사이트 자체와 저자를 한 번 선언해 두고 나머지는 @id 로 참조한다. */
export function websiteJsonLd() {
  return [
    personNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": SITE_ID,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: SITE.locale,
      publisher: { "@id": PERSON_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE.url}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

/** 글 상세. 커버 이미지가 없으면 자동 생성 OG 이미지를 쓴다. */
export function blogPostingJsonLd(post: Post) {
  const url = `${SITE.url}/posts/${post.slug}`;
  const image = post.coverImage
    ? [post.coverImage.startsWith("http") ? post.coverImage : `${SITE.url}${post.coverImage}`]
    : [`${url}/opengraph-image`];

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: post.title,
    ...(post.excerpt ? { description: post.excerpt } : {}),
    image,
    datePublished: isoDate(post),
    dateModified: isoDate(post),
    inLanguage: SITE.locale,
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": SITE_ID },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
  };
}

/** 실험실 프로젝트 상세. 공개 URL 이 있으면 그걸 결과물로 가리킨다. */
export function projectJsonLd(project: Project) {
  const url = `${SITE.url}/lab/${project.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#project`,
    mainEntityOfPage: url,
    url,
    name: project.name,
    ...(project.tagline ? { description: project.tagline } : {}),
    ...(project.year ? { dateCreated: project.year } : {}),
    inLanguage: SITE.locale,
    creator: { "@id": PERSON_ID },
    isPartOf: { "@id": SITE_ID },
    ...(project.stack.length > 0 ? { keywords: project.stack.join(", ") } : {}),
    ...(project.url ? { sameAs: [project.url] } : {}),
  };
}

/** 빵부스러기. path 는 사이트 루트 기준 경로("/posts")로 넘긴다. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

/** 목록 페이지(전체 글·카테고리·태그·시리즈). 글 순서를 그대로 알려 준다. */
export function collectionJsonLd(opts: {
  path: string;
  name: string;
  description?: string;
  posts: Pick<Post, "slug" | "title">[];
}) {
  const url = `${SITE.url}${opts.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    inLanguage: SITE.locale,
    isPartOf: { "@id": SITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: opts.posts.length,
      itemListElement: opts.posts.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}/posts/${p.slug}`,
        name: p.title,
      })),
    },
  };
}
