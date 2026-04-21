import { describe, expect, it } from "vitest";

import {
  getAutomationPolicyBlock,
  isEtHourInQuietHours,
  type AutomationPolicyState
} from "@/lib/services/automation-control";

const basePolicyState: AutomationPolicyState = {
  globalPause: false,
  externalSendPause: false,
  draftCreationPause: false,
  defaultQuietHoursStartEt: null,
  defaultQuietHoursEndEt: null,
  source: "fallback"
};

describe("automation control policy guardrails", () => {
  it("handles same-day and overnight ET quiet-hours windows", () => {
    expect(isEtHourInQuietHours(11, 9, 17)).toBe(true);
    expect(isEtHourInQuietHours(18, 9, 17)).toBe(false);
    expect(isEtHourInQuietHours(23, 22, 6)).toBe(true);
    expect(isEtHourInQuietHours(2, 22, 6)).toBe(true);
    expect(isEtHourInQuietHours(12, 22, 6)).toBe(false);
    expect(isEtHourInQuietHours(12, null, 6)).toBe(false);
    expect(isEtHourInQuietHours(12, 6, 6)).toBe(false);
  });

  it("blocks all automation when the global pause is enabled", () => {
    const block = getAutomationPolicyBlock({
      agent: {
        name: "Shop shelf curator",
        riskClass: "bounded_live",
        autonomyMode: "bounded_live",
        quietHoursStartEt: null,
        quietHoursEndEt: null
      },
      triggerSource: "manual",
      policyState: {
        ...basePolicyState,
        globalPause: true
      }
    });

    expect(block).toMatchObject({
      errorCode: "global_pause"
    });
  });

  it("blocks external-send lanes when the site-wide external pause is enabled", () => {
    const block = getAutomationPolicyBlock({
      agent: {
        name: "Pinterest distributor",
        riskClass: "external_send",
        autonomyMode: "external_send",
        quietHoursStartEt: null,
        quietHoursEndEt: null
      },
      triggerSource: "cron",
      policyState: {
        ...basePolicyState,
        externalSendPause: true
      }
    });

    expect(block).toMatchObject({
      errorCode: "external_send_pause"
    });
  });

  it("uses default quiet hours for automated triggers but lets manual runs through", () => {
    const agent = {
      name: "Search recommendation executor",
      riskClass: "bounded_live" as const,
      autonomyMode: "bounded_live" as const,
      quietHoursStartEt: null,
      quietHoursEndEt: null
    };
    const policyState: AutomationPolicyState = {
      ...basePolicyState,
      defaultQuietHoursStartEt: 22,
      defaultQuietHoursEndEt: 6
    };

    const cronBlock = getAutomationPolicyBlock({
      agent,
      triggerSource: "cron",
      policyState,
      now: new Date("2026-04-21T03:00:00.000Z")
    });
    const manualBlock = getAutomationPolicyBlock({
      agent,
      triggerSource: "manual",
      policyState,
      now: new Date("2026-04-21T03:00:00.000Z")
    });

    expect(cronBlock).toMatchObject({
      errorCode: "quiet_hours"
    });
    expect(manualBlock).toBeNull();
  });

  it("blocks draft-only lanes when draft creation is paused", () => {
    const block = getAutomationPolicyBlock({
      agent: {
        name: "Festival discovery",
        riskClass: "draft_only",
        autonomyMode: "draft_only",
        quietHoursStartEt: null,
        quietHoursEndEt: null
      },
      triggerSource: "cron",
      policyState: {
        ...basePolicyState,
        draftCreationPause: true
      }
    });

    expect(block).toMatchObject({
      errorCode: "draft_creation_pause"
    });
  });
});
