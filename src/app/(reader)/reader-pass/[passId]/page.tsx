import RoyalePassDetailPage from "@/features/royale-pass/RoyalePassDetailPage";

import type { Metadata } from 'next';

type Props = {
  params: { passId: string } | Promise<{ passId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Reader Pass - EnjoyBook`,
    description: `รายละเอียด Reader Pass บน Enjoybook`,
    alternates: { canonical: `/reader-pass/${resolvedParams.passId}` },
  };
}

export default async function Page({ params }: Props) {
  const { passId } = await params;
  return <RoyalePassDetailPage passId={passId} />;
}
