export interface MaintainerInput {
  readonly login: string;
  readonly id: string;
}

export interface RegistrationInput {
  readonly newPublisher: boolean;
  readonly publisher: string;
  readonly displayName: string;
  readonly ownerLogin: string;
  readonly ownerType: "Organization" | "User";
  readonly ownerId: string;
  readonly name: string;
  readonly repository: string;
  readonly repositoryId: string;
  readonly path: string;
  readonly maintainers: readonly MaintainerInput[];
}

export type FieldErrors = Partial<Record<keyof RegistrationInput | `maintainer${number}`, string>>;

const NAME = /^[a-z][a-z0-9-]{1,39}$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;
const REPOSITORY = /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/;
const ID = /^[1-9]\d{0,11}$/;
const RESERVED = new Set(["runesmith", "official", "hub", "verified", "admin", "security", "runesmithhub"]);

function nameProblem(value: string, what: string): string | undefined {
  if (!NAME.test(value) || value.includes("--") || value.endsWith("-")) {
    return `The ${what} must be 2 to 40 lowercase letters, digits or single hyphens, starting with a letter.`;
  }
  return RESERVED.has(value) ? `"${value}" is reserved.` : undefined;
}

export function validate(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};
  errors.publisher = nameProblem(input.publisher, "publisher name");
  errors.name = nameProblem(input.name, "plugin name");
  if (input.newPublisher && (input.displayName.trim().length < 2 || input.displayName.length > 40)) {
    errors.displayName = "The display name must be 2 to 40 characters.";
  }
  if (!LOGIN.test(input.ownerLogin)) {
    errors.ownerLogin = "Enter the GitHub user or organization that owns the repository.";
  }
  if (input.newPublisher && !ID.test(input.ownerId)) {
    errors.ownerId = "Enter the owner's numeric GitHub ID.";
  }
  const repository = REPOSITORY.exec(input.repository);
  if (!repository) {
    errors.repository = "Enter the repository address, such as https://github.com/owner/repository.";
  } else if (repository[1]?.toLowerCase() !== input.ownerLogin.toLowerCase()) {
    errors.repository = "The repository must belong to the publisher's GitHub owner.";
  }
  if (!ID.test(input.repositoryId)) {
    errors.repositoryId = "Enter the repository's numeric GitHub ID.";
  }
  if (!/^(\.|[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*)$/.test(input.path) || input.path.split("/").includes("..")) {
    errors.path = "Use . for the repository root, or a relative folder such as plugins/todo.";
  }
  input.maintainers.forEach((maintainer, index) => {
    if (!LOGIN.test(maintainer.login) || !ID.test(maintainer.id)) {
      errors[`maintainer${index}`] = "Enter each maintainer's GitHub login and numeric ID.";
    }
  });
  return Object.fromEntries(Object.entries(errors).filter(([, value]) => value !== undefined)) as FieldErrors;
}

export function pluginId(input: RegistrationInput): string {
  return `${input.publisher}.${input.name}`;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function publisherFile(input: RegistrationInput): { path: string; content: string } {
  return {
    path: `publishers/${input.publisher}.json`,
    content: json({
      name: input.publisher,
      displayName: input.displayName.trim(),
      owner: { id: Number(input.ownerId), login: input.ownerLogin, type: input.ownerType },
      state: "active",
    }),
  };
}

export function registrationFile(input: RegistrationInput, registeredAt: string): { path: string; content: string } {
  const id = pluginId(input);
  return {
    path: `plugins/${id}/registration.json`,
    content: json({
      id,
      repository: { id: Number(input.repositoryId), url: input.repository, path: input.path, tagPrefix: "v" },
      maintainers: input.maintainers.map((maintainer) => ({ id: Number(maintainer.id), login: maintainer.login })),
      tier: "unverified",
      state: "registered",
      registeredAt,
    }),
  };
}

export function newFileUrl(registry: string, branch: string, file: { path: string; content: string }): string {
  return `${registry}/new/${branch}?filename=${encodeURIComponent(file.path)}&value=${encodeURIComponent(file.content)}`;
}
