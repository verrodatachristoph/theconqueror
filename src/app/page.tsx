import { getTrips, getPersons, getWishlist } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [trips, persons, wishlist, settings] = await Promise.all([
    getTrips(),
    getPersons(),
    getWishlist(),
    getPublicSettings(),
  ]);
  return (
    <AppShell
      trips={trips}
      persons={persons}
      defaultAirport={settings.defaultAirport}
      wishlist={wishlist.map((w) => w.iso3)}
    />
  );
}
