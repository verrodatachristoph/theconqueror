import { getTrips, getPersons } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [trips, persons, settings] = await Promise.all([getTrips(), getPersons(), getPublicSettings()]);
  return <AppShell trips={trips} persons={persons} defaultAirport={settings.defaultAirport} />;
}
