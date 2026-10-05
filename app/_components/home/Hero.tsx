import Image from "next/image";
import { ArrowDown, ArrowUpRight, Check, Code2 } from "lucide-react";
import Link from "@/components/ui/Link";
import { MotionReveal } from "@/components/ui/MotionReveal";
import workspace from "@/public/images/coding-workspace.webp";
import styles from "./hero.module.css";

const PATHS = [
  {
    number: "01",
    title: "Make a little progress",
    detail: "Choose a topic. Work through one problem.",
    href: "/problems",
    label: "Explore problems",
  },
  {
    number: "02",
    title: "Understand your code",
    detail: "Get a hint, review an approach, try again.",
    href: "#coach",
    label: "Meet your coach",
  },
  {
    number: "03",
    title: "Enjoy the challenge",
    detail: "Test your thinking with a clock running.",
    href: "/contest",
    label: "Explore contests",
  },
];

export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <div className="section-shell">
        <div className={styles.inner}>
          <div className={styles.copy}>
            <p className={styles.kicker}>
              <span /> Built for the way you learn
            </p>
            <h1 id="home-title" className={styles.title}>
              Make time
              <br />
              for better code.
            </h1>
            <p className={styles.lede}>
              A quiet place to work through a problem, get unstuck, and
              understand what you just built. One good session at a time.
            </p>
            <div className={styles.actions}>
              <Link className="button" href="/problems">
                Explore problems <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
              <Link className={styles.secondary} href="#loop">
                Take a look around <ArrowDown size={15} aria-hidden="true" />
              </Link>
            </div>
            <ul className={styles.ticks}>
              <li>
                <Check size={14} aria-hidden="true" /> Free to practise
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Four languages
              </li>
              <li>
                <Check size={14} aria-hidden="true" /> Your own pace
              </li>
            </ul>
          </div>
          <MotionReveal className={styles.visual}>
            <div className={styles.photo}>
              <Image
                src={workspace}
                alt="A developer wearing headphones, working on a laptop at a shared wooden desk"
                fill
                priority
                sizes="(max-width: 760px) 100vw, (max-width: 1200px) 48vw, 560px"
                placeholder="blur"
              />
              <span className={styles.photoLabel}>
                <Code2 size={16} aria-hidden="true" /> Less scrolling. More
                solving.
              </span>
            </div>
            <div className={styles.caption}>
              <span>A little focus goes a long way.</span>
              <span>Python · C++ · JS · TS</span>
            </div>
          </MotionReveal>
        </div>
        <div className={styles.paths} aria-label="Ways to practise">
          {PATHS.map((item) => (
            <Link key={item.number} href={item.href} className={styles.path}>
              <span className={styles.pathNumber}>{item.number}</span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
                <span className={styles.pathLink}>
                  {item.label} <ArrowUpRight size={14} aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
