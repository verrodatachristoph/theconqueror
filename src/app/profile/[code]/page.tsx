import { notFound } from "next/navigation";
import { getTrips, getPersons } from "@/lib/data";
import { getPublicSettings, homeFrom } from "@/lib/settings";
import ProfilePage from "@/components/ProfilePage";

export const dynamic = "force-dynamic";

export default async function Profil({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [trips, persons, settings] = await Promise.all([getTrips(), getPersons(), getPublicSettings()]);
  const person = persons.find((p) => p.code.toLowerCase() === code.toLowerCase());
  if (!person) notFound();
  return (
    <ProfilePage
      person={person}
      persons={persons}
      trips={trips}
      home={homeFrom(settings)}
      defaultAirport={settings.defaultAirport}
    />
  );
}
