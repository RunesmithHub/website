export interface GuideTopic {
  readonly slug: string;
  readonly title: string;
}

export const GUIDE_TOPICS: readonly GuideTopic[] = [
  { slug: "", title: "Introduction" },
  { slug: "two-projects", title: "The two projects" },
  { slug: "manifest", title: "The manifest" },
  { slug: "capabilities", title: "Capabilities" },
  { slug: "images", title: "Images" },
  { slug: "versions", title: "Versions" },
  { slug: "dependencies", title: "Dependencies" },
  { slug: "registering", title: "Registering" },
  { slug: "releasing", title: "Releasing" },
  { slug: "after-release", title: "After you release" },
  { slug: "verification", title: "Verification" },
  { slug: "yanking-and-deprecating", title: "Yanking and deprecating" },
  { slug: "reports", title: "Responding to reports" },
  { slug: "check-tool", title: "The hub check tool" },
];
