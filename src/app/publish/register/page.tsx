import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/publish/register-form";
import { PageTitle } from "@/components/site/page-title";

export const metadata: Metadata = { title: "Register a plugin" };

export default function RegisterPage() {
  return (
    <>
      <PageTitle eyebrow="Publishing guide" title="Register a plugin">
        This form generates your registration files and opens GitHub&apos;s new-file page in the registry with them filled in. Read{" "}
        <Link href="/publish/registering" className="text-link hover:underline">
          Registering
        </Link>{" "}
        first.
      </PageTitle>
      <RegisterForm />
    </>
  );
}
