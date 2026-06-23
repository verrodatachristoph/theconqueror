import { redirect } from "next/navigation";
import { getPersons } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProfilIndex() {
  const persons = await getPersons();
  if (persons.length) redirect(`/profile/${persons[0].code}`);
  redirect("/admin"); // no persons yet — send to admin to create one
}
