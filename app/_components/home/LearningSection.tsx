import Image from "next/image";
import { ArrowUpRight, Blocks, Users } from "lucide-react";
import Link from "@/components/ui/Link";
import { MotionReveal } from "@/components/ui/MotionReveal";
import together from "@/public/images/practice-together.webp";
import learner from "@/public/images/young-learner.webp";
import styles from "./learningSection.module.css";

export function LearningSection() {
  return (
    <section className={styles.section} aria-labelledby="learning-title">
      <div className="section-shell">
        <div className={styles.heading}>
          <p>There is more than one way to learn</p>
          <h2 id="learning-title">
            Find your people.
            <br />
            Follow your curiosity.
          </h2>
        </div>
        <div className={styles.grid}>
          <MotionReveal>
            <Link href="/community" className={styles.card}>
              <div className={styles.photo}>
                <Image
                  src={together}
                  alt="People working together around a table with their laptops"
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  placeholder="blur"
                />
                <span>
                  <Users size={16} aria-hidden="true" /> Community
                </span>
              </div>
              <div className={styles.copy}>
                <div>
                  <h3>A different approach changes everything.</h3>
                  <p>
                    Read accepted solutions, compare ideas, and talk through the
                    details with other solvers.
                  </p>
                </div>
                <ArrowUpRight size={24} aria-hidden="true" />
              </div>
            </Link>
          </MotionReveal>
          <MotionReveal>
            <Link href="/kids" className={styles.card}>
              <div className={styles.photo}>
                <Image
                  src={learner}
                  alt="A young learner wearing headphones and concentrating on a laptop"
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  placeholder="blur"
                />
                <span>
                  <Blocks size={16} aria-hidden="true" /> Kaimana Kids
                </span>
              </div>
              <div className={styles.copy}>
                <div>
                  <h3>Big ideas start with small steps.</h3>
                  <p>
                    Ages 8–14. Start with visual puzzles, then write your first
                    real Python programs.
                  </p>
                </div>
                <ArrowUpRight size={24} aria-hidden="true" />
              </div>
            </Link>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}
