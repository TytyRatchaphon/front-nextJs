import RoyalePassDetailPage from "@/features/royale-pass/RoyalePassDetailPage";

type Props = {
  params: { passId: string } | Promise<{ passId: string }>;
};

export default async function Page({ params }: Props) {
  const { passId } = await params;
  return <RoyalePassDetailPage passId={passId} />;
}
