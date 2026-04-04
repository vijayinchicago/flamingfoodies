"use client";

import { useState } from "react";

import { getRecipeFaqs, getRecipeHeroSummary, getRecipeIngredientSections, getRecipeMethodSteps } from "@/lib/recipes";
import type { Recipe, RecipeQaReport } from "@/lib/types";

type RecipeEditorAction = (formData: FormData) => void | Promise<void>;

interface IngredientItemEditor {
  amount: string;
  unit: string;
  item: string;
  notes: string;
}

interface IngredientSectionEditor {
  title: string;
  items: IngredientItemEditor[];
}

interface MethodStepEditor {
  title: string;
  body: string;
  cue: string;
  tip: string;
  durationMinutes: string;
  ingredientRefs: string;
  imageUrl: string;
  imageAlt: string;
}

interface FaqEditor {
  question: string;
  answer: string;
}

function createEmptyIngredientItem(): IngredientItemEditor {
  return { amount: "", unit: "", item: "", notes: "" };
}

function createEmptyIngredientSection(): IngredientSectionEditor {
  return { title: "For the recipe", items: [createEmptyIngredientItem()] };
}

function createEmptyMethodStep(): MethodStepEditor {
  return {
    title: "",
    body: "",
    cue: "",
    tip: "",
    durationMinutes: "",
    ingredientRefs: "",
    imageUrl: "",
    imageAlt: ""
  };
}

function createEmptyFaq(): FaqEditor {
  return {
    question: "",
    answer: ""
  };
}

function normalizeList(values?: string[]) {
  return values?.length ? values : [""];
}

function ListEditor({
  label,
  description,
  values,
  onChange,
  placeholder
}: {
  label: string;
  description: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">{description}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...values, ""])}
          className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
        >
          Add item
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-3">
            <input
              value={value}
              onChange={(event) =>
                onChange(
                  values.map((entry, entryIndex) =>
                    entryIndex === index ? event.target.value : entry
                  )
                )
              }
              placeholder={placeholder}
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <button
              type="button"
              onClick={() =>
                onChange(values.filter((_, entryIndex) => entryIndex !== index) || [""])
              }
              className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RecipeEditorForm({
  formAction,
  recipe,
  qaReport,
  submitLabel,
  successMessage,
  errorMessage,
  redirectTo
}: {
  formAction: RecipeEditorAction;
  recipe?: Recipe;
  qaReport?: RecipeQaReport;
  submitLabel: string;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: string;
}) {
  const [ingredientSections, setIngredientSections] = useState<IngredientSectionEditor[]>(
    getRecipeIngredientSections(recipe ?? { ingredients: [] }).length
      ? getRecipeIngredientSections(recipe ?? { ingredients: [] }).map((section) => ({
          title: section.title,
          items: section.items.map((item) => ({
            amount: item.amount,
            unit: item.unit,
            item: item.item,
            notes: item.notes || ""
          }))
        }))
      : [createEmptyIngredientSection()]
  );
  const [methodSteps, setMethodSteps] = useState<MethodStepEditor[]>(
    getRecipeMethodSteps(recipe ?? { instructions: [] }).length
      ? getRecipeMethodSteps(recipe ?? { instructions: [] }).map((step) => ({
          title: step.title,
          body: step.body,
          cue: step.cue || "",
          tip: step.tip || "",
          durationMinutes: step.durationMinutes ? String(step.durationMinutes) : "",
          ingredientRefs: step.ingredientRefs?.join(", ") || "",
          imageUrl: step.imageUrl || "",
          imageAlt: step.imageAlt || ""
        }))
      : [createEmptyMethodStep()]
  );
  const [tips, setTips] = useState(normalizeList(recipe?.tips));
  const [variations, setVariations] = useState(normalizeList(recipe?.variations));
  const [substitutions, setSubstitutions] = useState(normalizeList(recipe?.substitutions));
  const [servingSuggestions, setServingSuggestions] = useState(
    normalizeList(recipe?.servingSuggestions)
  );
  const [equipment, setEquipment] = useState(normalizeList(recipe?.equipment));
  const [faqs, setFaqs] = useState<FaqEditor[]>(
    getRecipeFaqs(recipe ?? {}).length
      ? getRecipeFaqs(recipe ?? {}).map((faq) => ({
          question: faq.question,
          answer: faq.answer
        }))
      : [createEmptyFaq()]
  );

  const serializedIngredientSections = JSON.stringify(
    ingredientSections
      .map((section) => ({
        title: section.title.trim(),
        items: section.items
          .map((item) => ({
            amount: item.amount.trim(),
            unit: item.unit.trim(),
            item: item.item.trim(),
            notes: item.notes.trim() || undefined
          }))
          .filter((item) => item.item)
      }))
      .filter((section) => section.title && section.items.length)
  );

  const serializedMethodSteps = JSON.stringify(
    methodSteps
      .map((step, index) => ({
        step: index + 1,
        title: step.title.trim(),
        body: step.body.trim(),
        cue: step.cue.trim() || undefined,
        tip: step.tip.trim() || undefined,
        durationMinutes: step.durationMinutes ? Number(step.durationMinutes) : undefined,
        ingredientRefs: step.ingredientRefs
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        imageUrl: step.imageUrl.trim() || undefined,
        imageAlt: step.imageAlt.trim() || undefined
      }))
      .filter((step) => step.title && step.body)
  );

  const serializeStringList = (values: string[]) =>
    JSON.stringify(values.map((value) => value.trim()).filter(Boolean));

  const serializedFaqs = JSON.stringify(
    faqs
      .map((faq) => ({
        question: faq.question.trim(),
        answer: faq.answer.trim()
      }))
      .filter((faq) => faq.question && faq.answer)
  );

  return (
    <form action={formAction} encType="multipart/form-data" className="panel-light mt-6 space-y-6 p-6">
      {recipe ? <input type="hidden" name="id" value={recipe.id} /> : null}
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <input type="hidden" name="ingredientSectionsJson" value={serializedIngredientSections} />
      <input type="hidden" name="methodStepsJson" value={serializedMethodSteps} />
      <input type="hidden" name="tipsJson" value={serializeStringList(tips)} />
      <input type="hidden" name="variationsJson" value={serializeStringList(variations)} />
      <input type="hidden" name="substitutionsJson" value={serializeStringList(substitutions)} />
      <input
        type="hidden"
        name="servingSuggestionsJson"
        value={serializeStringList(servingSuggestions)}
      />
      <input type="hidden" name="equipmentJson" value={serializeStringList(equipment)} />
      <input type="hidden" name="faqsJson" value={serializedFaqs} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <p className="eyebrow">Editorial framing</p>
          <h2 className="mt-3 font-display text-4xl text-charcoal">Recipe foundations</h2>
        </div>
        <input
          name="title"
          defaultValue={recipe?.title}
          placeholder="Title"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember md:col-span-2"
        />
        <textarea
          name="description"
          defaultValue={recipe?.description}
          placeholder="Description"
          rows={3}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember md:col-span-2"
        />
        <textarea
          name="intro"
          defaultValue={recipe?.intro}
          placeholder="Intro / cultural context"
          rows={4}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="heroSummary"
          defaultValue={recipe ? getRecipeHeroSummary(recipe) : ""}
          placeholder="Hero summary / why this recipe lands"
          rows={4}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-3 md:col-span-2">
          <select
            name="heatLevel"
            defaultValue={recipe?.heatLevel || "medium"}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="medium">medium</option>
            <option value="mild">mild</option>
            <option value="hot">hot</option>
            <option value="inferno">inferno</option>
            <option value="reaper">reaper</option>
          </select>
          <select
            name="cuisineType"
            defaultValue={recipe?.cuisineType || "other"}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="other">other</option>
            <option value="american">american</option>
            <option value="mexican">mexican</option>
            <option value="thai">thai</option>
            <option value="korean">korean</option>
            <option value="indian">indian</option>
            <option value="ethiopian">ethiopian</option>
            <option value="jamaican">jamaican</option>
            <option value="west_african">west_african</option>
            <option value="caribbean">caribbean</option>
            <option value="italian">italian</option>
            <option value="moroccan">moroccan</option>
            <option value="szechuan">szechuan</option>
          </select>
          <select
            name="difficulty"
            defaultValue={recipe?.difficulty || "beginner"}
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="beginner">beginner</option>
            <option value="intermediate">intermediate</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-4 md:col-span-2">
          <input
            name="prepTimeMinutes"
            type="number"
            min="0"
            defaultValue={recipe?.prepTimeMinutes ?? 15}
            placeholder="Prep time"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="cookTimeMinutes"
            type="number"
            min="0"
            defaultValue={recipe?.cookTimeMinutes ?? 20}
            placeholder="Cook time"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="activeTimeMinutes"
            type="number"
            min="0"
            defaultValue={recipe?.activeTimeMinutes ?? ""}
            placeholder="Active time"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <input
            name="servings"
            type="number"
            min="1"
            defaultValue={recipe?.servings ?? 4}
            placeholder="Servings"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Grouped ingredients</p>
            <h3 className="mt-3 font-display text-3xl text-charcoal">Build the shopping rail</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
              Group ingredients by component so the public page can render sauce, garnish,
              marinade, and assembly cleanly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIngredientSections([...ingredientSections, createEmptyIngredientSection()])}
            className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Add section
          </button>
        </div>
        <div className="mt-6 space-y-5">
          {ingredientSections.map((section, sectionIndex) => (
            <article key={`ingredient-section-${sectionIndex}`} className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <input
                  value={section.title}
                  onChange={(event) =>
                    setIngredientSections(
                      ingredientSections.map((entry, entryIndex) =>
                        entryIndex === sectionIndex
                          ? { ...entry, title: event.target.value }
                          : entry
                      )
                    )
                  }
                  placeholder="Section title"
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIngredientSections(
                      ingredientSections.length > 1
                        ? ingredientSections.filter((_, entryIndex) => entryIndex !== sectionIndex)
                        : ingredientSections
                    )
                  }
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Remove
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {section.items.map((item, itemIndex) => (
                  <div key={`ingredient-${sectionIndex}-${itemIndex}`} className="grid gap-3 md:grid-cols-[110px_110px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <input
                      value={item.amount}
                      onChange={(event) =>
                        setIngredientSections(
                          ingredientSections.map((entry, entryIndex) =>
                            entryIndex === sectionIndex
                              ? {
                                  ...entry,
                                  items: entry.items.map((sectionItem, sectionItemIndex) =>
                                    sectionItemIndex === itemIndex
                                      ? { ...sectionItem, amount: event.target.value }
                                      : sectionItem
                                  )
                                }
                              : entry
                          )
                        )
                      }
                      placeholder="Amount"
                      className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                    />
                    <input
                      value={item.unit}
                      onChange={(event) =>
                        setIngredientSections(
                          ingredientSections.map((entry, entryIndex) =>
                            entryIndex === sectionIndex
                              ? {
                                  ...entry,
                                  items: entry.items.map((sectionItem, sectionItemIndex) =>
                                    sectionItemIndex === itemIndex
                                      ? { ...sectionItem, unit: event.target.value }
                                      : sectionItem
                                  )
                                }
                              : entry
                          )
                        )
                      }
                      placeholder="Unit"
                      className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                    />
                    <input
                      value={item.item}
                      onChange={(event) =>
                        setIngredientSections(
                          ingredientSections.map((entry, entryIndex) =>
                            entryIndex === sectionIndex
                              ? {
                                  ...entry,
                                  items: entry.items.map((sectionItem, sectionItemIndex) =>
                                    sectionItemIndex === itemIndex
                                      ? { ...sectionItem, item: event.target.value }
                                      : sectionItem
                                  )
                                }
                              : entry
                          )
                        )
                      }
                      placeholder="Ingredient"
                      className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                    />
                    <input
                      value={item.notes}
                      onChange={(event) =>
                        setIngredientSections(
                          ingredientSections.map((entry, entryIndex) =>
                            entryIndex === sectionIndex
                              ? {
                                  ...entry,
                                  items: entry.items.map((sectionItem, sectionItemIndex) =>
                                    sectionItemIndex === itemIndex
                                      ? { ...sectionItem, notes: event.target.value }
                                      : sectionItem
                                  )
                                }
                              : entry
                          )
                        )
                      }
                      placeholder="Notes"
                      className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIngredientSections(
                          ingredientSections.map((entry, entryIndex) =>
                            entryIndex === sectionIndex
                              ? {
                                  ...entry,
                                  items:
                                    entry.items.length > 1
                                      ? entry.items.filter((_, sectionItemIndex) => sectionItemIndex !== itemIndex)
                                      : entry.items
                                }
                              : entry
                          )
                        )
                      }
                      className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setIngredientSections(
                      ingredientSections.map((entry, entryIndex) =>
                        entryIndex === sectionIndex
                          ? { ...entry, items: [...entry.items, createEmptyIngredientItem()] }
                          : entry
                      )
                    )
                  }
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Add ingredient
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Method</p>
            <h3 className="mt-3 font-display text-3xl text-charcoal">Build real step cards</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
              Each step gets a headline, body, success cue, optional tip, optional timer, and
              optional image.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMethodSteps([...methodSteps, createEmptyMethodStep()])}
            className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Add step
          </button>
        </div>
        <div className="mt-6 space-y-5">
          {methodSteps.map((step, stepIndex) => (
            <article key={`method-step-${stepIndex}`} className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-2xl text-charcoal">Step {stepIndex + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setMethodSteps(
                      methodSteps.length > 1
                        ? methodSteps.filter((_, entryIndex) => entryIndex !== stepIndex)
                        : methodSteps
                    )
                  }
                  className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                >
                  Remove
                </button>
              </div>
              <div className="mt-4 grid gap-4">
                <input
                  value={step.title}
                  onChange={(event) =>
                    setMethodSteps(
                      methodSteps.map((entry, entryIndex) =>
                        entryIndex === stepIndex ? { ...entry, title: event.target.value } : entry
                      )
                    )
                  }
                  placeholder="Step title"
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
                <textarea
                  value={step.body}
                  onChange={(event) =>
                    setMethodSteps(
                      methodSteps.map((entry, entryIndex) =>
                        entryIndex === stepIndex ? { ...entry, body: event.target.value } : entry
                      )
                    )
                  }
                  rows={4}
                  placeholder="Step body"
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <textarea
                    value={step.cue}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex ? { ...entry, cue: event.target.value } : entry
                        )
                      )
                    }
                    rows={3}
                    placeholder="What to watch for"
                    className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                  />
                  <textarea
                    value={step.tip}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex ? { ...entry, tip: event.target.value } : entry
                        )
                      )
                    }
                    rows={3}
                    placeholder="Optional extra tip"
                    className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    value={step.durationMinutes}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex
                            ? { ...entry, durationMinutes: event.target.value }
                            : entry
                        )
                      )
                    }
                    type="number"
                    min="1"
                    placeholder="Timer minutes"
                    className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                  />
                  <input
                    value={step.ingredientRefs}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex
                            ? { ...entry, ingredientRefs: event.target.value }
                            : entry
                        )
                      )
                    }
                    placeholder="Ingredient refs, comma separated"
                    className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember md:col-span-2"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    value={step.imageUrl}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex ? { ...entry, imageUrl: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Step image URL"
                    className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                  />
                  <input
                    value={step.imageAlt}
                    onChange={(event) =>
                      setMethodSteps(
                        methodSteps.map((entry, entryIndex) =>
                          entryIndex === stepIndex ? { ...entry, imageAlt: event.target.value } : entry
                        )
                      )
                    }
                    placeholder="Step image alt text"
                    className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                  />
                  <input
                    name={`methodStepImageFile-${stepIndex}`}
                    type="file"
                    accept="image/*"
                    className="rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <ListEditor
          label="Tips"
          description="Practical troubleshooting notes and editor guidance."
          values={tips}
          onChange={setTips}
          placeholder="Add a tip"
        />
        <ListEditor
          label="Variations"
          description="Alternative versions that still keep the recipe coherent."
          values={variations}
          onChange={setVariations}
          placeholder="Add a variation"
        />
        <ListEditor
          label="Substitutions"
          description="Meaningful swaps for availability or dietary needs."
          values={substitutions}
          onChange={setSubstitutions}
          placeholder="Add a substitution"
        />
        <ListEditor
          label="Serving suggestions"
          description="What to pair with the dish and how to finish it."
          values={servingSuggestions}
          onChange={setServingSuggestions}
          placeholder="Add a serving suggestion"
        />
        <ListEditor
          label="Equipment"
          description="Only the tools the cook truly needs."
          values={equipment}
          onChange={setEquipment}
          placeholder="Add equipment"
        />
        <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <p className="eyebrow">Storage and planning</p>
          <div className="mt-5 space-y-4">
            <textarea
              name="makeAheadNotes"
              defaultValue={recipe?.makeAheadNotes}
              rows={4}
              placeholder="Make-ahead notes"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <textarea
              name="storageNotes"
              defaultValue={recipe?.storageNotes}
              rows={4}
              placeholder="Storage notes"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <textarea
              name="reheatNotes"
              defaultValue={recipe?.reheatNotes}
              rows={4}
              placeholder="Reheat notes"
              className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">FAQ</p>
            <h3 className="mt-3 font-display text-3xl text-charcoal">Answer the repeat questions</h3>
          </div>
          <button
            type="button"
            onClick={() => setFaqs([...faqs, createEmptyFaq()])}
            className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
          >
            Add FAQ
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {faqs.map((faq, faqIndex) => (
            <article key={`faq-${faqIndex}`} className="rounded-[1.5rem] border border-charcoal/10 bg-white p-5">
              <div className="grid gap-4">
                <input
                  value={faq.question}
                  onChange={(event) =>
                    setFaqs(
                      faqs.map((entry, entryIndex) =>
                        entryIndex === faqIndex
                          ? { ...entry, question: event.target.value }
                          : entry
                      )
                    )
                  }
                  placeholder="Question"
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
                <textarea
                  value={faq.answer}
                  onChange={(event) =>
                    setFaqs(
                      faqs.map((entry, entryIndex) =>
                        entryIndex === faqIndex ? { ...entry, answer: event.target.value } : entry
                      )
                    )
                  }
                  rows={4}
                  placeholder="Answer"
                  className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
                />
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setFaqs(
                        faqs.length > 1 ? faqs.filter((_, entryIndex) => entryIndex !== faqIndex) : faqs
                      )
                    }
                    className="rounded-full border border-charcoal/10 px-4 py-2 text-sm font-semibold text-charcoal"
                  >
                    Remove FAQ
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <input
          name="tags"
          defaultValue={recipe?.tags.join(", ")}
          placeholder="spicy, tacos, weekend"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <select
          name="status"
          defaultValue={recipe?.status || "draft"}
          className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
        <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 px-4 py-3 text-sm text-charcoal/70">
          <input type="checkbox" name="featured" defaultChecked={recipe?.featured} />
          Featured recipe
        </label>
        <input
          name="imageUrl"
          defaultValue={recipe?.imageUrl}
          placeholder="Hero image URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="imageAlt"
          defaultValue={recipe?.imageAlt}
          placeholder="Hero image alt text"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="imageFile"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
        />
      </section>

      <section className="rounded-[1.75rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
        <p className="eyebrow">QA gate</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl text-charcoal">Cuisine and image signoff</h3>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-charcoal/65">
              Drafts can save without approval, but publishing now requires both manual review
              boxes plus a clean blocker list from the recipe QA validator.
            </p>
          </div>
          {qaReport ? (
            <div className="rounded-full bg-charcoal px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              QA {qaReport.status} · {qaReport.score}/100
            </div>
          ) : null}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/80">
            <input
              type="checkbox"
              name="heroImageReviewed"
              defaultChecked={recipe?.heroImageReviewed}
            />
            Hero image manually reviewed against the actual dish
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/80">
            <input
              type="checkbox"
              name="cuisineQaReviewed"
              defaultChecked={recipe?.cuisineQaReviewed}
            />
            Cuisine and technique reviewed for authenticity and coherence
          </label>
        </div>
        <textarea
          name="qaNotes"
          defaultValue={recipe?.qaNotes}
          rows={3}
          placeholder="Internal QA notes, sourcing concerns, or image validation notes"
          className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        {qaReport ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                Blockers
              </p>
              {qaReport.blockers.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-rose-800">
                  {qaReport.blockers.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-7 text-emerald-700">
                  No blocker issues. This recipe can publish if the manual reviews stay checked.
                </p>
              )}
            </div>
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Warnings
              </p>
              {qaReport.warnings.length ? (
                <ul className="mt-3 space-y-2 text-sm leading-7 text-amber-900">
                  {qaReport.warnings.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-7 text-emerald-700">
                  No warning-level issues right now.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

      <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
        {submitLabel}
      </button>
    </form>
  );
}
