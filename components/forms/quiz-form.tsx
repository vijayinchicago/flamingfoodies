"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { getQuizResult } from "@/lib/quiz";
import { ANALYTICS_EVENTS } from "@/lib/telemetry-events";

type Answers = Record<number, string>;

const questions = [
  {
    prompt: "Pick a wing challenge:",
    options: ["Buffalo mild", "Classic hot", "Ghost pepper glaze", "Reaper roulette"]
  },
  {
    prompt: "How do you feel about fermented funk?",
    options: ["No thanks", "A little", "Love it", "Need more of it"]
  },
  {
    prompt: "What ruins a spicy dish for you?",
    options: ["Pain without flavor", "Too sweet", "Too mild", "Nothing, push it harder"]
  },
  {
    prompt: "Choose a pantry move:",
    options: ["Paprika and move on", "Chilli crisp", "Habanero mash", "Fermented mash plus fresh pepper"]
  },
  {
    prompt: "Best late-night heat move:",
    options: ["Spicy popcorn", "Kimchi noodles", "Jerk chicken leftovers", "Sauce tasting flight"]
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
        <p className="text-sm uppercase tracking-[0.24em] text-ember">Current result</p>
        <h2 className="font-display text-4xl text-cream">{result.replace(/-/g, " ")}</h2>
        <p className="text-sm text-cream/68">
          {allAnswered
            ? "Quiz complete. Open the result to get the matching content path."
            : `Answer ${questions.length - answerCount} more question${questions.length - answerCount === 1 ? "" : "s"} to lock in the result.`}
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
          See your results
        </Link>
      </div>
    </div>
  );
}
