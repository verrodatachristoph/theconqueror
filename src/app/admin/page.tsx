import { getPersons, getAchievementDefs } from "@/lib/data";
import { getPublicSettings } from "@/lib/settings";
import AdminPage from "@/components/AdminPage";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const [persons, settings, achievementDefs] = await Promise.all([
    getPersons(),
    getPublicSettings(),
    getAchievementDefs(),
  ]);
  return <AdminPage persons={persons} settings={settings} achievementDefs={achievementDefs} />;
}
