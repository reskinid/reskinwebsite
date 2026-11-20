import { readFileSync } from "node:fs";
import { join } from "node:path";
import parse from "html-react-parser";
import type { Element } from "domhandler";
import LandingInteractions from "@/components/LandingInteractions";
import { Icon, type IconName } from "@/components/Icons";

export default function HomePage() {
  const filePath = join(process.cwd(), "src/content/landing-page.html");
  const markup = readFileSync(filePath, "utf8");

  const page = parse(markup, {
    replace(node) {
      // Do not use `instanceof Element` here. html-react-parser can receive
      // DOM nodes from a different domhandler instance (for example when the
      // package is deduplicated), making instanceof return false and leaving
      // every data-lucide placeholder empty. The DOM node type is stable.
      if (node.type === "tag" && "attribs" in node) {
        const element = node as Element;
        const name = element.attribs["data-lucide"] as IconName | undefined;
        if (name) {
          const className = element.attribs.class ?? "icon-inline";
          return <Icon name={name} className={className} />;
        }
      }
      return undefined;
    },
  });

  return <LandingInteractions>{page}</LandingInteractions>;
}
