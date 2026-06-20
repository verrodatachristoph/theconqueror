import { notFound } from "next/navigation";
import { getTrips, getPersons, getWishlist } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const settings = await getSettings();
  if (!settings?.share_token || settings.share_token !== token) notFound();

  const [trips, persons, wishlist] = await Promise.all([getTrips(), getPersons(), getWishlist()]);
  return (
    <AppShell
      trips={trips}
      persons={persons}
      defaultAirport={null}
      wishlist={wishlist.map((w) => w.iso3)}
      readOnly
    />
  );
}
