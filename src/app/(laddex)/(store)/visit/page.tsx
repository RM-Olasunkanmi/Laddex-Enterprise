import { redirect } from "next/navigation";

/** The store visit section moved onto /contact. Old links land there. */
export default function VisitRedirect() {
  redirect("/contact#visit");
}
