import { getTrips, getPersons } from "@/lib/data";
import { getPublicSettings, homeFrom } from "@/lib/settings";
import StatisticsPage from "@/components/StatisticsPage";

export const dynamic = "force-dynamic";

export default async function Statistik() {
  const [trips, persons, settings] = await Promise.all([getTrips(), getPersons(), getPublicSettings()]);
  return <StatisticsPage trips={trips} persons={persons} home={homeFrom(settings)} />;
}
