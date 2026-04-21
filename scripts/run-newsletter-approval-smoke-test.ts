import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function decodeQuotedValue(value: string) {
  if (!value.length) {
    return value;
  }

  const quote = value[0];
  if ((quote !== '"' && quote !== "'") || value[value.length - 1] !== quote) {
    return value;
  }

  const inner = value.slice(1, -1);
  if (quote === "'") {
    return inner;
  }

  return inner
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function loadEnvFile(filePath: string) {
  const absolutePath = resolve(process.cwd(), filePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Env file not found: ${absolutePath}`);
  }

  const contents = readFileSync(absolutePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ") ? line.slice("export ".length) : line;
    const separatorIndex = normalizedLine.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
    process.env[key] = decodeQuotedValue(rawValue);
  }
}

function collectEnvFiles(argv: string[]) {
  const envFiles: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--env-file") {
      const candidate = argv[index + 1];
      if (!candidate) {
        throw new Error("Missing value after --env-file");
      }

      envFiles.push(candidate);
      index += 1;
    }
  }

  return envFiles;
}

async function main() {
  for (const envFile of collectEnvFiles(process.argv.slice(2))) {
    loadEnvFile(envFile);
  }

  const [{ createSupabaseAdminClient }, newsletter] = await Promise.all([
    import("@/lib/supabase/server"),
    import("@/lib/services/newsletter")
  ]);

  const { buildNewsletterSendApprovalSubjectKey, processScheduledNewsletterCampaigns } =
    newsletter;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client is not available with the loaded env file.");
  }

  const smokeSubject = `[Smoke test] Newsletter approval gate ${new Date().toISOString()}`;
  const sendAt = new Date(Date.now() - 60 * 1000).toISOString();

  const { data: insertedCampaign, error: insertError } = await supabase
    .from("newsletter_campaigns")
    .insert({
      subject: smokeSubject,
      preview_text: "Smoke test for approval-gated due-send processing.",
      html_content: "<p>Smoke test newsletter approval gate.</p>",
      text_content: "Smoke test newsletter approval gate.",
      status: "scheduled",
      send_at: sendAt,
      recipient_count: 0,
      provider: null,
      provider_broadcast_id: null
    })
    .select("id")
    .single();

  if (insertError || !insertedCampaign) {
    throw new Error(
      `Failed to insert smoke test campaign: ${insertError?.message ?? "unknown error"}`
    );
  }

  const campaignId = insertedCampaign.id;
  const subjectKey = buildNewsletterSendApprovalSubjectKey(campaignId);

  let processResult: Awaited<ReturnType<typeof processScheduledNewsletterCampaigns>> | null = null;
  let campaignAfterProcess: Record<string, unknown> | null = null;
  let approvalAfterProcess: Record<string, unknown> | null = null;
  let cleanupCampaignDeleted = false;
  let cleanupApprovalDeleted = false;

  try {
    processResult = await processScheduledNewsletterCampaigns();

    const [{ data: campaignRow, error: campaignError }, { data: approvalRow, error: approvalError }] =
      await Promise.all([
        supabase
          .from("newsletter_campaigns")
          .select("id, subject, status, send_at, sent_at")
          .eq("id", campaignId)
          .single(),
        supabase
          .from("automation_approvals")
          .select("id, agent_id, subject_type, subject_key, proposed_action, status")
          .eq("agent_id", "newsletter-digest-agent")
          .eq("subject_type", "newsletter_campaign")
          .eq("subject_key", subjectKey)
          .eq("proposed_action", "send_newsletter_campaign")
          .maybeSingle()
      ]);

    if (campaignError) {
      throw new Error(`Failed to read smoke test campaign: ${campaignError.message}`);
    }

    if (approvalError) {
      throw new Error(`Failed to read smoke test approval: ${approvalError.message}`);
    }

    campaignAfterProcess = campaignRow;
    approvalAfterProcess = approvalRow;
  } finally {
    const { data: approvalRow, error: approvalLookupError } = await supabase
      .from("automation_approvals")
      .select("id")
      .eq("agent_id", "newsletter-digest-agent")
      .eq("subject_type", "newsletter_campaign")
      .eq("subject_key", subjectKey)
      .eq("proposed_action", "send_newsletter_campaign")
      .maybeSingle();

    if (approvalLookupError) {
      throw new Error(
        `Failed to look up smoke test approval for cleanup: ${approvalLookupError.message}`
      );
    }

    if (approvalRow?.id) {
      const { error: deleteApprovalError } = await supabase
        .from("automation_approvals")
        .delete()
        .eq("id", approvalRow.id);

      if (deleteApprovalError) {
        throw new Error(
          `Failed to delete smoke test approval ${approvalRow.id}: ${deleteApprovalError.message}`
        );
      }

      cleanupApprovalDeleted = true;
    }

    const { error: deleteCampaignError } = await supabase
      .from("newsletter_campaigns")
      .delete()
      .eq("id", campaignId);

    if (deleteCampaignError) {
      throw new Error(
        `Failed to delete smoke test campaign ${campaignId}: ${deleteCampaignError.message}`
      );
    }

    cleanupCampaignDeleted = true;
  }

  console.log(
    JSON.stringify({
      insertedCampaignId: campaignId,
      processResult,
      campaignAfterProcess,
      approvalAfterProcess,
      cleanup: {
        campaignDeleted: cleanupCampaignDeleted,
        approvalDeleted: cleanupApprovalDeleted
      }
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
