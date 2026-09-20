"use client";

import { useEffect } from "react";

/**
 * A greeting for anyone who opens DevTools.
 *
 * The oldest tasteful place to sign a site: it costs no pixels, interrupts
 * nobody, and the only people who ever see it are the ones curious enough
 * to look at how it was built. Rendered null, mounted once from the root
 * layout.
 */
export function ConsoleSignature() {
  useEffect(() => {
    // Dev already floods the console with Fast Refresh noise; this is for
    // someone poking at the deployed site.
    if (process.env.NODE_ENV !== "production") return;
    const mint = "color:#4FF0C5;font:600 13px ui-monospace,monospace";
    const dim = "color:#8B929D;font:12px ui-monospace,monospace";
    console.log(
      "%c◆ Kaimana%c — pressure makes the edge.\n%cDesigned & built by Tumit Hasan.\nPoking at the internals? The judge is real, the hints are tiered, and the reference solutions only unlock once you have solved it yourself.",
      mint,
      dim,
      dim,
    );
  }, []);

  return null;
}
