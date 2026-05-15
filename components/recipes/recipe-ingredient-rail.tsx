"use client";

import { useState } from "react";

import { scaleIngredientAmount } from "@/lib/recipes";
import type { RecipeIngredientSection } from "@/lib/types";

export function RecipeIngredientRail({
  sections,
  baseServings
}: {
  sections: RecipeIngredientSection[];
  baseServings: number;
}) {
  const [targetServings, setTargetServings] = useState(baseServings || 1);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const safeBaseServings = Math.max(baseServings || 1, 1);
  const safeTargetServings = Math.max(targetServings || safeBaseServings, 1);
  const factor = safeTargetServings / safeBaseServings;

  return (
    <section id="ingredients" className="recipe-print-section panel p-6 sm:p-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Shopping rail</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Ingredients</h2>
        </div>
        <div className="text-right text-sm text-charcoal/55">
          <p>Base recipe</p>
          <p>Serves {safeBaseServings}</p>
        </div>
      </div>

      <div className="recipe-ingredient-controls mt-6 rounded-[1.5rem] border border-charcoal/10 bg-charcoal/[0.04] p-4 print-hidden">
        <p className="text-xs uppercase tracking-[0.22em] text-ember">Scale the recipe</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setTargetServings((value) => Math.max(1, value - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 text-xl text-charcoal"
          >
            -
          </button>
          <input
            type="number"
            min="1"
            value={safeTargetServings}
            onChange={(event) => setTargetServings(Number(event.target.value) || safeBaseServings)}
            className="w-24 rounded-2xl border border-charcoal/10 bg-transparent px-4 py-3 text-center font-semibold text-charcoal caret-charcoal outline-none focus:border-ember"
          />
          <button
            type="button"
            onClick={() => setTargetServings((value) => value + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-charcoal/10 text-xl text-charcoal"
          >
            +
          </button>
          <p className="text-sm text-charcoal/55">Adjusted yield</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-display text-3xl text-charcoal">{section.title}</h3>
              {sectionIndex === 0 ? (
                <button
                  type="button"
                  onClick={() => setCheckedItems({})}
                  className="rounded-full border border-charcoal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/55"
                >
                  Reset checks
                </button>
              ) : null}
            </div>
            <ul className="space-y-3">
              {section.items.map((ingredient, ingredientIndex) => {
                const key = `${sectionIndex}-${ingredientIndex}-${ingredient.item}`;
                const checked = checkedItems[key] || false;

                return (
                  <li
                    key={key}
                    className={`recipe-print-keep recipe-ingredient-item grid grid-cols-[auto_84px_minmax(0,1fr)] gap-4 rounded-[1.5rem] border px-4 py-4 transition ${
                      checked
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : "border-charcoal/10 bg-charcoal/[0.04]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setCheckedItems((value) => ({
                          ...value,
                          [key]: !checked
                        }))
                      }
                      className={`mt-1 h-5 w-5 rounded-full border ${
                        checked ? "border-emerald-500 bg-emerald-500" : "border-charcoal/30"
                      }`}
                      aria-label={checked ? "Mark ingredient unchecked" : "Mark ingredient checked"}
                    />
                    <div className={`text-sm font-semibold ${checked ? "text-charcoal/55" : "text-charcoal"}`}>
                      {[scaleIngredientAmount(ingredient.amount, factor), ingredient.unit]
                        .filter(Boolean)
                        .join(" ")}
                    </div>
                    <div className={`min-w-0 ${checked ? "text-charcoal/55" : ""}`}>
                      <p className="text-base text-charcoal">{ingredient.item}</p>
                      {ingredient.notes ? (
                        <p className="mt-1 text-sm text-charcoal/55">{ingredient.notes}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
