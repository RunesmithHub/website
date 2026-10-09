"use client";

import { ExternalLinkIcon, PlusIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { useId, useMemo, useState, useSyncExternalStore } from "react";
import type * as React from "react";
import { Alert, AlertBody } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { REGISTRY } from "@/config/runesmith";
import { newFileUrl, pluginId, publisherFile, registrationFile, validate, type RegistrationInput } from "@/lib/registration";

const INITIAL: RegistrationInput = {
  newPublisher: true,
  publisher: "",
  displayName: "",
  ownerLogin: "",
  ownerType: "Organization",
  ownerId: "",
  name: "",
  repository: "",
  repositoryId: "",
  path: ".",
  maintainers: [{ login: "", id: "" }],
};

const OPENED_AT = `${new Date().toISOString().slice(0, 19)}Z`;

function subscribeNothing(): () => void {
  return () => undefined;
}

function clientTime(): string {
  return OPENED_AT;
}

function Field({
  label,
  hint,
  error,
  touched,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  touched: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string }) => React.ReactNode;
}) {
  const id = useId();
  const show = touched && error !== undefined;
  return (
    <div className="mt-3">
      <label htmlFor={id} className="text-foreground mb-1 block text-[12.5px] font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": show, "aria-describedby": `${id}-hint` })}
      <p id={`${id}-hint`} className={show ? "text-destructive-foreground mt-1 mb-0 text-xs" : "text-subtle-foreground mt-1 mb-0 text-xs"}>
        {show ? error : hint}
      </p>
    </div>
  );
}

function LookUp({ href, label }: { href: string | null; label: string }) {
  return href ? (
    <a href={href} rel="noopener noreferrer" className="text-link hover:underline">
      {label}
    </a>
  ) : (
    <span>{label}</span>
  );
}

function FileOutput({ title, file, disabled }: { title: string; file: { path: string; content: string }; disabled: boolean }) {
  return (
    <Card className="mt-3.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <CardTitle className="m-0">{title}</CardTitle>
        <span className="text-subtle-foreground font-mono text-xs">{file.path}</span>
      </div>
      <pre className="bg-muted text-foreground m-0 max-h-[260px] overflow-auto rounded-[6px] border p-3 font-mono text-xs">{file.content}</pre>
      <div className="mt-3">
        <Button asChild variant="primary" aria-disabled={disabled}>
          <a
            href={disabled ? undefined : newFileUrl(REGISTRY.url, REGISTRY.defaultBranch, file)}
            rel="noopener noreferrer"
            target="_blank"
            data-testid={`open-${file.path.startsWith("publishers/") ? "publisher" : "registration"}`}
          >
            <ExternalLinkIcon aria-hidden />
            Open on GitHub
          </a>
        </Button>
      </div>
    </Card>
  );
}

export function RegisterForm() {
  const [input, setInput] = useState<RegistrationInput>(INITIAL);
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const registeredAt = useSyncExternalStore(subscribeNothing, clientTime, () => "");
  const errors = useMemo(() => validate(input), [input]);
  const valid = Object.keys(errors).length === 0;
  const set = <K extends keyof RegistrationInput>(key: K, value: RegistrationInput[K]): void => {
    setInput((current) => ({ ...current, [key]: value }));
    setTouched((current) => new Set(current).add(key));
  };
  const text = (key: "publisher" | "displayName" | "ownerLogin" | "ownerId" | "name" | "repository" | "repositoryId" | "path") =>
    ({ value: input[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value) });
  const repositoryPath = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/.exec(input.repository)?.[1] ?? null;
  const problems = Object.values(errors);

  return (
    <div className="grid gap-7 xl:grid-cols-2">
      <form aria-label="Registration details" onSubmit={(event) => event.preventDefault()}>
        <h2 className="mt-0 mb-1 text-base font-semibold">Publisher</h2>
        <div className="mt-2 flex items-start gap-2.5">
          <Checkbox id="new-publisher" checked={input.newPublisher} onCheckedChange={(value) => set("newPublisher", value === true)} />
          <label htmlFor="new-publisher" className="text-muted-foreground text-[13px]">
            This is my first plugin: also create my publisher record
          </label>
        </div>
        <Field label="Publisher name" hint="The first part of your plugin IDs, such as lumen." error={errors.publisher} touched={touched.has("publisher")}>
          {(props) => <Input {...props} {...text("publisher")} autoComplete="off" spellCheck={false} />}
        </Field>
        {input.newPublisher && (
          <Field label="Display name" hint="Shown on your plugins, such as Lumen Labs." error={errors.displayName} touched={touched.has("displayName")}>
            {(props) => <Input {...props} {...text("displayName")} />}
          </Field>
        )}
        <Field label="GitHub owner" hint="The user or organization that owns the repository." error={errors.ownerLogin} touched={touched.has("ownerLogin")}>
          {(props) => <Input {...props} {...text("ownerLogin")} autoComplete="off" spellCheck={false} />}
        </Field>
        {input.newPublisher && (
          <>
            <div className="mt-3">
              <span className="text-foreground mb-1 block text-[12.5px] font-medium" id="owner-type-label">
                Owner type
              </span>
              <Select aria-labelledby="owner-type-label" value={input.ownerType} onChange={(event) => set("ownerType", event.target.value === "User" ? "User" : "Organization")}>
                <option value="Organization">Organization</option>
                <option value="User">User</option>
              </Select>
            </div>
            <Field
              label="Owner's GitHub ID"
              hint={
                <>
                  The permanent number GitHub gives the account.{" "}
                  <LookUp href={input.ownerLogin ? `https://api.github.com/users/${encodeURIComponent(input.ownerLogin)}` : null} label="Look it up" /> (the{" "}
                  <code>id</code> field).
                </>
              }
              error={errors.ownerId}
              touched={touched.has("ownerId")}
            >
              {(props) => <Input {...props} {...text("ownerId")} inputMode="numeric" />}
            </Field>
          </>
        )}

        <h2 className="mt-7 mb-1 text-base font-semibold">Plugin</h2>
        <Field label="Plugin name" hint="The second part of the ID, such as todo." error={errors.name} touched={touched.has("name")}>
          {(props) => <Input {...props} {...text("name")} autoComplete="off" spellCheck={false} />}
        </Field>
        <Field label="Repository" hint="Public, on GitHub, with plugin.json on its default branch." error={errors.repository} touched={touched.has("repository")}>
          {(props) => <Input {...props} {...text("repository")} placeholder="https://github.com/owner/repository" spellCheck={false} />}
        </Field>
        <Field
          label="Repository's GitHub ID"
          hint={
            <>
              <LookUp href={repositoryPath ? `https://api.github.com/repos/${repositoryPath}` : null} label="Look it up" /> (the <code>id</code> field).
            </>
          }
          error={errors.repositoryId}
          touched={touched.has("repositoryId")}
        >
          {(props) => <Input {...props} {...text("repositoryId")} inputMode="numeric" />}
        </Field>
        <Field label="Plugin folder" hint="Where plugin.json is. Use . for the repository root." error={errors.path} touched={touched.has("path")}>
          {(props) => <Input {...props} {...text("path")} spellCheck={false} />}
        </Field>

        <h2 className="mt-7 mb-1 text-base font-semibold">Maintainers</h2>
        <p className="text-subtle-foreground mt-0 text-xs">GitHub accounts that may act for the plugin. Each needs write access to the repository.</p>
        {input.maintainers.map((maintainer, index) => (
          <div key={index} className="mt-2 flex items-start gap-2">
            <Input
              aria-label={`Maintainer ${index + 1} login`}
              placeholder="GitHub login"
              value={maintainer.login}
              spellCheck={false}
              onChange={(event) =>
                set(
                  "maintainers",
                  input.maintainers.map((item, at) => (at === index ? { ...item, login: event.target.value } : item)),
                )
              }
            />
            <Input
              aria-label={`Maintainer ${index + 1} GitHub ID`}
              placeholder="GitHub ID"
              inputMode="numeric"
              className="w-[140px]"
              value={maintainer.id}
              onChange={(event) =>
                set(
                  "maintainers",
                  input.maintainers.map((item, at) => (at === index ? { ...item, id: event.target.value } : item)),
                )
              }
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove maintainer ${index + 1}`}
              disabled={input.maintainers.length === 1}
              onClick={() => set("maintainers", input.maintainers.filter((_, at) => at !== index))}
            >
              <Trash2Icon aria-hidden />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => set("maintainers", [...input.maintainers, { login: "", id: "" }])}>
          <PlusIcon aria-hidden />
          Add a maintainer
        </Button>
      </form>

      <section aria-label="Generated files">
        <Card>
          <CardTitle>Plugin ID</CardTitle>
          <p className="text-foreground m-0 font-mono text-sm" data-testid="plugin-id">
            {input.publisher || "publisher"}.{input.name || "name"}
          </p>
          <p className="text-subtle-foreground mt-1 mb-0 text-xs">Starts unverified. IDs are never reused.</p>
        </Card>
        {problems.length > 0 && touched.size > 0 && (
          <Alert variant="danger" data-testid="registration-problems">
            <XCircleIcon aria-hidden />
            <AlertBody>
              <p>Fix these before opening the files on GitHub:</p>
              <ul className="m-0 list-disc pl-4 text-[13px]">
                {[...new Set(problems)].map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </AlertBody>
          </Alert>
        )}
        {input.newPublisher && <FileOutput title="Publisher record" file={publisherFile(input)} disabled={!valid} />}
        <FileOutput title={`Registration for ${pluginId(input)}`} file={registrationFile(input, registeredAt)} disabled={!valid || !registeredAt} />
        <p className="text-subtle-foreground mt-3 text-xs">
          This page only builds links; nothing is sent anywhere. On GitHub, commit each file to one new branch and open a single pull request. The
          registration check runs on it, and an administrator looks at the name, icon, repository and README.
        </p>
      </section>
    </div>
  );
}
