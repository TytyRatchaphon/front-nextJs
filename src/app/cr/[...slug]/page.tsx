import { redirect } from 'next/navigation';

interface Props {
    params: Promise<{
        slug: string[];
    }>;
}

export default async function LegacyRedirectPage({ params }: Props) {
    const { slug } = await params;

    // Join slugs and remove any spaces that might corrupt Base64
    // Example: /cr/BASE64== might come as ['BASE64=='] or ['BASE64', '=='] depending on browser/router encoding
    const base64String = slug.join('').replace(/\s/g, '');

    let redirectPath = '/';

    try {
        // Decode base64: "bookID,epID"
        const decoded = Buffer.from(base64String, 'base64').toString('utf-8');

        const parts = decoded.split(','); // Split by comma

        // Super aggressive cleaning: Keep only A-Z, a-z, 0-9, and common safe chars (-_.)
        // This removes ALL invisible control characters including null bytes, newlines, etc.
        let bookId = parts[0]?.replace(/[^a-zA-Z0-9\-_.]/g, '');
        let epId = parts.length > 1 ? parts[1]?.replace(/[^a-zA-Z0-9\-_.]/g, '') : null;


        if (bookId) {
            const { resolveEpisodeId, resolveBookId } = await import('@/services/apiServices');

            // 1. Resolve Book ID if legacy
            if (isNaN(Number(bookId))) {
                const resolvedBook = await resolveBookId(bookId);
                if (resolvedBook?.data?.book_id) {
                    bookId = resolvedBook.data.book_id.toString();
                }
            }

            // 2. Resolve Episode ID if exists and legacy
            if (epId) {
                if (isNaN(Number(epId))) {
                    const resolvedEp = await resolveEpisodeId(epId);
                    if (resolvedEp?.data) {
                        epId = resolvedEp.data.ep_id.toString();
                        // Optional: Update bookId from episode if we prefer that source of truth
                        if (resolvedEp.data.book_id) {
                            bookId = resolvedEp.data.book_id.toString();
                        }
                    } else {
                        // Resolution failed (e.g. not found) -> Force fallback to Book Detail
                        epId = null;
                    }
                }

                if (epId) {
                    redirectPath = `/read/${bookId}/${epId}`;
                } else {
                    redirectPath = `/book/${bookId}`;
                }
            } else {
                // No episode ID found -> Redirect to Book Detail
                redirectPath = `/book/${bookId}`;
            }
        }
    } catch (error) {
        console.error('Failed to decode legacy CR URL:', error);
    }

    // Sanitize redirectPath: remove newlines/tabs and trim whitespace
    redirectPath = redirectPath.replace(/[\n\r\t]/g, '').trim();

    // Perform redirect outside try-catch
    redirect(redirectPath);

    // Fallback if decoding fails
    redirect('/');
}
