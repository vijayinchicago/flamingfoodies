"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { getQuizResult } from "@/lib/quiz";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

type Answers = Record<number, string>;

function formatResultLabel(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const questions = [
  {
    prompt: "What sounds right on a normal weeknight?",
    options: [
      "Warm and balanced",
      "A clear kick, but still easygoing",
      "Hot enough to feel it",
      "Big heat is part of the fun"
    ]
  },
  {
    prompt: "When spice shows up, you want it to...",
    options: [
      "Stay gentle and let flavor lead",
      "Wake the dish up without taking over",
      "Hang around for a while",
      "Push all the way to the edge"
    ]
  },
  {
    prompt: "Which bottle sounds most useful to you?",
    options: [
      "An everyday taco-and-eggs bottle",
      "A balanced sauce with some personality",
      "A hotter bottle for wings and grilled food",
      "A serious-heat bottle for challenge mode"
    ]
  },
  {
    prompt: "Who are you usually cooking for?",
    options: [
      "A mixed crowd with cautious eaters",
      "People who like spice but not chaos",
      "Mostly heat-friendly eaters",
      "People who want the hottest thing on the table"
    ]
  },
  {
    prompt: "If you were shopping today, what lane fits best?",
    options: [
      "Starter bottle",
      "Balanced everyday pour",
      "Bolder shelf upgrade",
      "Maximum-heat flex pick"
    ]
  }
];

export function QuizForm() {
  const [answers, setAnswers] = useState<Answers>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const answerCount = Object.keys(answers).length;
  const allAnswered = answerCount === questions.length;
  const result = useMemo(
    () => getQuizResult(Object.values(answers).map((value) => Number(value))),
    [answers]
  );

  return (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <section key={question.prompt} className="panel p-6">
          <h2 className="font-display text-3xl text-cream">{question.prompt}</h2>
          <div className="mt-5 grid gap-3">
            {question.options.map((option, optionIndex) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-cream/80"
              >
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={optionIndex}
                  onChange={(event) => {
                    if (!quizStarted) {
                      setQuizStarted(true);
                      trackEvent(ANALYTICS_EVENTS.quizStart, {
                        path: "/quiz",
                        answerCount: 1
                      });
                    }

                    setAnswers((current) => ({
                      ...current,
                      [index]: event.target.value
                    }));
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="panel flex flex-col items-start gap-4 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-ember">Your heat lane so far</p>
        <h2 className="font-display text-4xl text-cream">{formatResultLabel(result)}</h2>
        <p className="text-sm text-cream/68">
          {allAnswered
            ? "All set. Open your result for recipes, bottle picks, and gift-safe next steps."
            : `Answer ${questions.length - answerCount} more question${questions.length - answerCount === 1 ? "" : "s"} to lock in a starting lane.`}
        </p>
        <Link
          href={allAnswered ? `/quiz/results/${result}` : "/quiz"}
          aria-disabled={!allAnswered}
          onClick={(event) => {
            if (!allAnswered) {
              event.preventDefault();
              return;
            }

            trackEvent(ANALYTICS_EVENTS.quizComplete, {
              path: "/quiz",
              result,
              answerCount,
              value: answerCount
            });
          }}
          className={`rounded-full px-6 py-3 font-semibold ${allAnswered ? "bg-gradient-to-r from-flame to-ember text-white" : "cursor-not-allowed border border-white/10 text-cream/45"}`}
        >
          See your recipe + bottle plan
        </Link>
      </div>
    </div>
  );
}
