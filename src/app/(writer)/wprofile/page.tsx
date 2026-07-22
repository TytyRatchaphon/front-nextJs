import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ id?: string | string[] }> | { id?: string | string[] };
};

export default async function WProfileIndex({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const writerId = Array.isArray(resolvedSearchParams.id)
    ? resolvedSearchParams.id[0]
    : resolvedSearchParams.id;

  if (writerId?.trim()) {
    redirect(`/wprofile/${encodeURIComponent(writerId.trim())}`);
  }

  redirect("/");
}
