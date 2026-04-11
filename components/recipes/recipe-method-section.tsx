"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getStepIngredientMatches } from "@/lib/recipes";
import type { RecipeIngredientSection, RecipeMethodStep } from "@/lib/types";

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function StepTimer({ minutes }: { minutes: number }) {
  const initialSeconds = minutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          return 0;
        }

        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <div className="recipe-timer rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 print-hidden">
      <p className="text-xs uppercase tracking-[0.22em] text-ember">Step timer</p>
      <p className="mt-3 font-display text-3xl text-cream">{formatTimer(remainingSeconds)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRunning((value) => !value)}
          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream"
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            setRemainingSeconds(initialSeconds);
          }}
          className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cream/70"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function RecipeMethodSection({
  steps,
  ingredientSections
}: {
  steps: RecipeMethodStep[];
  ingredientSections: RecipeIngredientSection[];
}) {
  const [activeStep, setActiveStep] = useState(steps[0]?.step || 1);

  return (
    <section id="method" className="recipe-print-section panel p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Method</p>
          <h2 className="mt-3 font-display text-5xl text-cream">How to cook it</h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-cream/58">
          Use the step navigator to move around, or stay in cook mode and work top to bottom.
        </p>
      </div>

      <div className="recipe-step-nav mt-8 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-3 print-hidden">
        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
          {steps.map((step) => (
            <button
              key={step.step}
              type="button"
              onClick={() => {
                setActiveStep(step.step);
                document.getElementById(`recipe-step-${step.step}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });
              }}
              className={`w-full rounded-[1.25rem] px-4 py-3 text-left text-sm font-semibold leading-snug transition xl:w-auto xl:rounded-full xl:py-2 ${
                activeStep === step.step
                  ? "bg-white text-charcoal"
                  : "border border-white/10 text-cream"
              }`}
            >
              {step.step}. {step.title}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-8 space-y-5">
        {steps.map((step) => {
          const matchedIngredients = getStepIngredientMatches(ingredientSections, step).slice(0, 6);

          return (
            <li
              key={step.step}
              id={`recipe-step-${step.step}`}
              className="recipe-step-card recipe-print-keep rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 sm:p-6"
            >
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember font-display text-3xl text-white">
                      {step.step}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-ember">
                        Step {step.step} of {steps.length}
                      </p>
                      <h3 className="mt-2 font-display text-4xl leading-tight text-cream">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                  <p className="recipe-step-body mt-5 text-lg leading-8 text-cream/82">
                    {step.body}
                  </p>
                  {step.imageUrl ? (
                    <div className="recipe-step-image relative mt-6 overflow-hidden rounded-[1.75rem] border border-white/10">
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={step.imageUrl}
                          alt={step.imageAlt || step.title}
                          fill
                          sizes="(min-width: 1280px) 700px, 100vw"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <aside className="recipe-step-aside min-w-0 space-y-4 rounded-[1.75rem] border border-white/10 bg-charcoal/35 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-ember">You&apos;ll use</p>
                    {matchedIngredients.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {matchedIngredients.map((ingredient) => (
                          <span
                            key={`${step.step}-${ingredient.item}`}
                            className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-cream/72"
                          >
                            {ingredient.item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm leading-7 text-cream/58">
                        This step is mostly about sequencing and control.
                      </p>
                    )}
                  </div>

                  {step.cue ? (
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-ember">What to watch for</p>
                      <p className="mt-3 text-sm leading-7 text-cream/68">{step.cue}</p>
                    </div>
                  ) : null}

                  {step.tip ? (
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-ember">Editor tip</p>
                      <p className="mt-3 text-sm leading-7 text-cream/68">{step.tip}</p>
                    </div>
                  ) : null}

                  {step.durationMinutes ? <StepTimer minutes={step.durationMinutes} /> : null}
                </aside>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
