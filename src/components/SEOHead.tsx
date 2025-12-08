import { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogType?: string;
    canonicalPath?: string;
    noindex?: boolean;
    structuredData?: object;
}

/**
 * SEO Head component for dynamic meta tag management.
 * Updates document head with page-specific SEO metadata.
 */
const SEOHead = ({
    title = 'HavenComics - Ler Mangá Online Grátis | Manhwa e Manhua em Português',
    description = 'Leia mangá, manhwa e manhua online grátis em português! +1000 obras com atualizações diárias. Solo Leveling, One Piece, Naruto, Tower of God e muito mais.',
    keywords = 'ler mangá online grátis, manhwa online português, manhua grátis, webtoon português',
    ogImage = 'https://havencomics.com/favicon.png',
    ogType = 'website',
    canonicalPath = '',
    noindex = false,
    structuredData,
}: SEOHeadProps) => {
    const baseUrl = 'https://havencomics.com';
    const fullUrl = `${baseUrl}${canonicalPath}`;

    useEffect(() => {
        // Update title
        document.title = title;

        // Helper to update or create meta tag
        const updateMeta = (property: string, content: string, isProperty = false) => {
            const attribute = isProperty ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attribute}="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        // Update basic meta tags
        updateMeta('description', description);
        updateMeta('keywords', keywords);
        updateMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

        // Update Open Graph tags
        updateMeta('og:title', title, true);
        updateMeta('og:description', description, true);
        updateMeta('og:image', ogImage, true);
        updateMeta('og:url', fullUrl, true);
        updateMeta('og:type', ogType, true);

        // Update Twitter tags
        updateMeta('twitter:title', title);
        updateMeta('twitter:description', description);
        updateMeta('twitter:image', ogImage);

        // Update canonical URL
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', fullUrl);

        // Add structured data if provided
        if (structuredData) {
            const existingScript = document.querySelector('script[data-seo-head="true"]');
            if (existingScript) {
                existingScript.remove();
            }
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-seo-head', 'true');
            script.textContent = JSON.stringify(structuredData);
            document.head.appendChild(script);

            return () => {
                script.remove();
            };
        }
    }, [title, description, keywords, ogImage, ogType, fullUrl, noindex, structuredData]);

    return null;
};

export default SEOHead;

// Helper to generate manga-specific structured data
export const generateMangaSchema = (manga: {
    title: string;
    description: string;
    author: string;
    cover: string;
    genres?: string[];
    rating?: number;
    id: string;
}) => ({
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `https://havencomics.com/manga/${manga.id}`,
    name: manga.title,
    description: manga.description,
    author: {
        '@type': 'Person',
        name: manga.author,
    },
    image: manga.cover,
    genre: manga.genres || [],
    aggregateRating: manga.rating ? {
        '@type': 'AggregateRating',
        ratingValue: manga.rating,
        bestRating: 5,
        worstRating: 1,
    } : undefined,
    url: `https://havencomics.com/manga/${manga.id}`,
    inLanguage: 'pt-BR',
});

// Helper to generate catalog page structured data
export const generateCatalogSchema = (totalItems: number) => ({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Catálogo de Mangás - HavenComics',
    description: 'Explore nosso catálogo completo de mangás, manhwas e manhuas em português.',
    url: 'https://havencomics.com/catalogo',
    mainEntity: {
        '@type': 'ItemList',
        numberOfItems: totalItems,
        itemListElement: [],
    },
});
