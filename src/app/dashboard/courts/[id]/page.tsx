import { redirect } from "next/navigation";

/** Edição agora ocorre via modal em /dashboard/courts */
export default function EditCourtPage() {
  redirect("/dashboard/courts");
}
