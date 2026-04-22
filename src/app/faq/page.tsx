import FaqContent from '@/features/faq/FaqContent';
import { fetchFaqs } from '@/services/apiServices';

export const revalidate = 3600;

export default async function FaqPage() {
    const initialFaqs = await fetchFaqs();

    return (
        <FaqContent initialFaqs={initialFaqs} />
    );
}
