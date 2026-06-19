import { getTrips, getPersons, getWishlist, getAchievementDefs } from "@/lib/data";
import { getPublicSettings, homeFrom } from "@/lib/settings";
import ZielePage from "@/components/ZielePage";

export const dynamic = "force-dynamic";

export default async function Ziele() {
  const [trips, persons, wishlist, defs, settings] = await Promise.all([
    getTrips(),
    getPersons(),
    getWishlist(),
    getAchievementDefs(),
    getPublicSettings(),
  ]);
  return (
    <ZielePage
      trips={trips}
      persons={persons}
      wishlist={wishlist}
      home={homeFrom(settings)}
      achievementDefs={defs}
    />
  );
}
