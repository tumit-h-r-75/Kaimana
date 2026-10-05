"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

const loadFeatures = () =>
  import("./motion-features").then((module) => module.default);

/** Content stays visible in SSR; animation enhances it after hydration. */
export function MotionReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">
        <m.div
          className={className}
          initial={false}
          whileInView={
            reducedMotion ? undefined : { y: [14, 0], opacity: [0.8, 1] }
          }
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
