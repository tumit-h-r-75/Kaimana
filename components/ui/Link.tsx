"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";

/** Download a route when it is opened, rather than prefetching every visible card. */
export default function Link({
  prefetch = false,
  ...props
}: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
