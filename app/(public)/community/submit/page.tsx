import { submitCommunityPostAction } from "@/lib/actions/community";
import { SimpleFormShell } from "@/components/forms/simple-form-shell";
import { requireUser } from "@/lib/supabase/auth";

export default async function CommunitySubmitPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  await requireUser();

  return (
    <SimpleFormShell
      title="Submit to the community feed"
      copy="This form now writes a real pending-review submission when Supabase auth is configured. Standard posts stay lightweight, while recipe submissions also capture structured ingredients and method for moderation."
    >
      <form action={submitCommunityPostAction} encType="multipart/form-data" className="space-y-5">
        <input
          name="title"
          placeholder="Title"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <textarea
          name="caption"
          placeholder="Caption"
          rows={5}
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="type"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="photo">photo</option>
            <option value="recipe">recipe</option>
            <option value="video_url">video_url</option>
          </select>
          <select
            name="heatLevel"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="">Select heat level</option>
            <option value="mild">mild</option>
            <option value="medium">medium</option>
            <option value="hot">hot</option>
            <option value="inferno">inferno</option>
            <option value="reaper">reaper</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="cuisineType"
            className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          >
            <option value="">Cuisine type</option>
            <option value="american">american</option>
            <option value="mexican">mexican</option>
            <option value="thai">thai</option>
            <option value="korean">korean</option>
            <option value="indian">indian</option>
            <option value="ethiopian">ethiopian</option>
            <option value="jamaican">jamaican</option>
            <option value="other">other</option>
          </select>
          <input
            name="tags"
            placeholder="Tags, comma separated"
            className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        <input
          name="mediaUrl"
          placeholder="Hosted image URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <input
          name="mediaFile"
          type="file"
          accept="image/*"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-charcoal file:px-4 file:py-2 file:text-white"
        />
        <input
          name="videoUrl"
          placeholder="Video URL"
          className="w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
        />
        <div className="rounded-[2rem] border border-charcoal/10 bg-charcoal/[0.03] p-5">
          <div className="space-y-2">
            <h2 className="font-display text-3xl text-charcoal">Recipe details</h2>
            <p className="text-sm leading-7 text-charcoal/65">
              Fill this out when your submission type is <span className="font-semibold">recipe</span>.
              Photo and video submissions can leave these fields empty.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <input
              name="prepTimeMinutes"
              type="number"
              min="1"
              placeholder="Prep minutes"
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="cookTimeMinutes"
              type="number"
              min="1"
              placeholder="Cook minutes"
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
            <input
              name="servings"
              type="number"
              min="1"
              placeholder="Servings"
              className="rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
            />
          </div>
          <textarea
            name="recipeDescription"
            rows={3}
            placeholder="Recipe summary for the structured card"
            className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
          <textarea
            name="ingredients"
            rows={6}
            placeholder={`Ingredients, one per line\n1 | cup | lentils | rinsed\n2 | tsp | berbere`}
            className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember"
          />
          <textarea
            name="instructions"
            rows={6}
            placeholder={`Instructions, one per line\nBloom the spices in oil | keep the heat medium\nAdd lentils and stock | simmer until tender`}
            className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 font-mono text-sm outline-none focus:border-ember"
          />
          <textarea
            name="tips"
            rows={4}
            placeholder={`Tips, one per line\nFinish with lemon\nCool the heat with yogurt`}
            className="mt-4 w-full rounded-2xl border border-charcoal/10 px-4 py-3 outline-none focus:border-ember"
          />
        </div>
        {searchParams?.error ? (
          <p className="text-sm text-rose-600">{searchParams.error}</p>
        ) : null}
        <button className="rounded-full bg-gradient-to-r from-flame to-ember px-5 py-3 font-semibold text-white">
          Submit for review
        </button>
      </form>
    </SimpleFormShell>
  );
}
