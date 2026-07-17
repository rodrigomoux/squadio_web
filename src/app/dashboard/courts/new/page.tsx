import { redirect } from "next/navigation";

/** Criação/edição agora ocorre via modal em /dashboard/courts */
export default function NewCourtPage() {
  redirect("/dashboard/courts");
}
