// The five Fall 2026 classes. `slug` is used in URLs and as the on-disk folder
// name under "30 - Resources/". `dir` is the exact resource folder name.
export const CLASSES = [
  {
    slug: "cyber-security-cryptography",
    name: "Cyber Security & Cryptography",
    short: "Crypto",
  },
  {
    slug: "systems-programming",
    name: "Systems Programming (C/C++)",
    short: "Systems",
  },
  {
    slug: "oo-software-principles",
    name: "Object-Oriented Software Principles",
    short: "OOSP",
  },
  {
    slug: "professional-skills",
    name: "Professional Skills in Computing and Engineering",
    short: "Prof Skills",
  },
  {
    slug: "technical-writing",
    name: "Technical & Professional Writing",
    short: "Tech Writing",
  },
];

export function classBySlug(slug) {
  return CLASSES.find((c) => c.slug === slug) || null;
}
