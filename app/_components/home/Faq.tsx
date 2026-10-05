"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { useReveal } from "@/hooks/useReveal";
import { Plus } from "lucide-react";
import styles from "./faq.module.css";

const QA = [
  {
    q: "Is any of this paid?",
    a: "No. Every problem, the judge, the AI coach, contests and the mock interviewer are free. Gems are earned by solving and spent on hints — they are a budget, not a currency you top up.",
  },
  {
    q: "Which languages can I use?",
    a: "Python, C++, JavaScript and TypeScript, each with starter code for the problem you are on. Submissions run on a real judge, not a simulation, so the timing you see is the timing that counts.",
  },
  {
    q: "Do the hints just give me the answer?",
    a: "Deliberately not. Tier one asks a question, tier two describes the approach, tier three gets close. The worked solution only unlocks after you have solved it yourself — before that it would just be the answer key.",
  },
  {
    q: "What does the AI actually look at?",
    a: "Your submitted code, not the problem statement. That is how it can tell you the complexity you actually wrote rather than the one the problem intended, and why the refactor it suggests is a version of yours.",
  },
  {
    q: "Is a contest different from practice?",
    a: "Only in who is watching. Same judge, same hidden tests, same verdicts — with a clock, penalty time for wrong submissions, and a board that moves while you type.",
  },
  {
    q: "I am new to this. Where do I start?",
    a: "Sign in and the library suggests one: an easy problem in a topic you have not touched, or whatever you left half-finished. You never have to pick from forty titles on your own.",
  },
] as const;

export function Faq() {
  const head = useReveal<HTMLDivElement>();
  return (
    <section className={styles.section}>
      <div className="section-shell">
        <div ref={head.ref} className={`${styles.head} ${head.className}`}>
          <p className={styles.kicker}>Before you start</p>
          <h2>Questions people ask.</h2>
        </div>
        <Accordion.Root
          className={styles.list}
          type="single"
          collapsible
          defaultValue="question-0"
        >
          {QA.map((item, index) => (
            <Accordion.Item
              key={item.q}
              value={`question-${index}`}
              className={styles.item}
            >
              <Accordion.Header className={styles.questionHeading}>
                <Accordion.Trigger className={styles.q}>
                  <span>{item.q}</span>
                  <span className={styles.mark}>
                    <Plus size={15} aria-hidden="true" />
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className={styles.aWrap}>
                <p className={styles.a}>{item.a}</p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
