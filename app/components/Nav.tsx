"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/now-playing", label: "Now Playing" },
  { href: "/recommendations", label: "Recommendations" },
  { href: "/new-releases", label: "New Releases" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800 px-6 py-4">
      <nav className="max-w-4xl mx-auto flex items-center gap-8">
        <span className="text-white font-semibold text-sm tracking-wide">
          Music
        </span>
        <div className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? "text-white font-medium"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
