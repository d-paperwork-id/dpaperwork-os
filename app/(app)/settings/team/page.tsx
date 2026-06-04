import { redirect } from "next/navigation";

export default function TeamSettingsRoot() {
  redirect("/settings/team/members");
}
