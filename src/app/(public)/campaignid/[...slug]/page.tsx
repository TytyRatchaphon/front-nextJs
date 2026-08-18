import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

interface Props {
    params: Promise<{
        slug?: string[];
    }>;
}

export default async function CampaignLegacyRedirectPage({ params }: Props) {
    void params;
    // Always redirect to Home
    redirect('/');
}
