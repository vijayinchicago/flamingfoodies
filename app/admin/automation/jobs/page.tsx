import { AdminPage } from "@/components/admin/admin-page";
import { GenerationJobPanel } from "@/components/admin/generation-job-panel";
import { getGenerationJobs } from "@/lib/services/admin";

export default async function AdminJobsPage() {
  const jobs = await getGenerationJobs();

  return (
    <AdminPage
      title="Generation jobs"
      description="Review queue health, inspect parameters, and retry failed content runs."
    >
      <div className="grid gap-6">
        {jobs.map((job) => (
          <GenerationJobPanel key={job.id} job={job} />
        ))}
      </div>
    </AdminPage>
  );
}
