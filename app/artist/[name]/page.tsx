import { ArtistView } from "./ArtistView";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <ArtistView artistName={decodeURIComponent(name)} />;
}
