import { redirect } from 'next/navigation';

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
