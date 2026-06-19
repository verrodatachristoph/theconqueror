import { getTrips, getPersons } from "@/lib/data";
import { getPublicSettings, homeFrom } from "@/lib/settings";
import StatistikPage from "@/components/StatistikPage";

export const dynamic = "force-dynamic";

export default async function Statistik() {
  const [trips, persons, settings] = await Promise.all([getTrips(), getPersons(), getPublicSettings()]);
  return <StatistikPage trips={trips} persons={persons} home={homeFrom(settings)} />;
}
