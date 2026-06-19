import { getTrips, getPersons } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import TagebuchPage from "@/components/TagebuchPage";

export const dynamic = "force-dynamic";

export default async function Tagebuch() {
  const [trips, persons, settings] = await Promise.all([getTrips(), getPersons(), getPublicSettings()]);
  return <TagebuchPage trips={trips} persons={persons} defaultAirport={settings.defaultAirport} />;
}
