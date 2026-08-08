import { requireAdmin } from "@/application/auth/require-admin";
import { container } from "@/application/container";
import { GetGrowthMetrics } from "@/application/growth/get-growth-metrics";
import { prisma } from "@/infrastructure/database/prisma";
import type { GrowthMessageChannel } from "@/generated/prisma/client";
import { ValidationError } from "@/domain/shared/errors";
import { jsonOk } from "@/infrastructure/http/respond";

export async function handleGetGrowthOverview() {
  await requireAdmin();
  const [metrics, overview] = await Promise.all([
    new GetGrowthMetrics().execute(),
    container.growthAgent.getOverview(),
  ]);
  return jsonOk({ metrics, ...overview });
}

export async function handleGetOpportunities(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const refresh = url.searchParams.get("refresh") === "1";
  if (refresh) {
    await container.growthAgent.refreshOpportunities();
  }
  const rows = await prisma.growthOpportunity.findMany({
    orderBy: { opportunityScore: "desc" },
    take: 50,
  });
  return jsonOk({ opportunities: rows });
}

export async function handleGetProspects(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const result = await container.growthProspects.list({
    status: status as never,
    limit: Number(url.searchParams.get("limit") ?? 50),
    cursor: url.searchParams.get("cursor") ?? undefined,
  });
  return jsonOk(result);
}

export async function handlePostProspect(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as Record<string, unknown>;
  const result = await container.growthProspects.create({
    name: String(body.name ?? ""),
    professionalTitle: body.professionalTitle as string | undefined,
    profession: body.profession as string | undefined,
    company: body.company as string | undefined,
    website: body.website as string | undefined,
    portfolioUrl: body.portfolioUrl as string | undefined,
    publicProfileUrl: body.publicProfileUrl as string | undefined,
    email: body.email as string | undefined,
    skills: Array.isArray(body.skills) ? (body.skills as string[]) : [],
    topics: Array.isArray(body.topics) ? (body.topics as string[]) : [],
    campaignId: body.campaignId as string | undefined,
    acquisitionSource: body.acquisitionSource as string | undefined,
  });
  return jsonOk(result);
}

export async function handlePostProspectResearch(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { prospectId?: string };
  if (!body.prospectId) throw new ValidationError("prospectId required");
  const job = await container.growthAgent.researchProspect(body.prospectId);
  await container.growthJobRunner.processNext(1);
  return jsonOk({ job });
}

export async function handlePostProspectScore(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as { prospectId?: string };
  if (!body.prospectId) throw new ValidationError("prospectId required");
  const result = await container.growthJobRunner.scoreProspectById(
    body.prospectId,
  );
  return jsonOk({ result });
}

export async function handlePostMessageGenerate(request: Request) {
  await requireAdmin();
  const body = (await request.json()) as {
    prospectId?: string;
    channel?: GrowthMessageChannel;
  };
  if (!body.prospectId || !body.channel) {
    throw new ValidationError("prospectId and channel required");
  }
  const draft = await container.growthMessages.generateDraft({
    prospectId: body.prospectId,
    channel: body.channel,
  });
  return jsonOk(draft);
}

export async function handlePostMessageApprove(request: Request) {
  const session = await requireAdmin();
  const body = (await request.json()) as {
    messageId?: string;
    action?: "approve" | "reject" | "edit";
    editedBody?: string;
  };
  if (!body.messageId || !body.action) {
    throw new ValidationError("messageId and action required");
  }
  const message = await container.growthMessages.approveMessage({
    messageId: body.messageId,
    approverUserId: session.user.id,
    action: body.action,
    editedBody: body.editedBody,
  });
  return jsonOk({ message });
}

export async function handleGetCampaigns() {
  await requireAdmin();
  const campaigns = await container.growthCampaigns.list();
  return jsonOk({ campaigns });
}

export async function handlePostCampaign(request: Request) {
  const session = await requireAdmin();
  const body = (await request.json()) as Record<string, unknown>;
  const campaign = await container.growthCampaigns.create({
    name: String(body.name ?? "Campaign"),
    description: body.description as string | undefined,
    targetProfession: body.targetProfession as string | undefined,
    targetSkills: body.targetSkills as string[] | undefined,
    goal: body.goal as string | undefined,
    createdByUserId: session.user.id,
  });
  return jsonOk({ campaign });
}

export async function handleGetAnalytics() {
  await requireAdmin();
  const [funnel, channels] = await Promise.all([
    container.growthAnalytics.getFunnel(30),
    container.growthAnalytics.getChannelAttribution(),
  ]);
  return jsonOk({ funnel, channels });
}

export async function handleGetReports(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "daily";
  const reports = await prisma.growthReport.findMany({
    where: { kind },
    orderBy: { createdAt: "desc" },
    take: 14,
  });
  return jsonOk({ reports });
}

export async function handleGetExperiments() {
  await requireAdmin();
  const experiments = await prisma.growthExperiment.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return jsonOk({ experiments });
}

export async function handlePostProcessJobs() {
  await requireAdmin();
  const processed = await container.growthAgent.processJobs(5);
  return jsonOk({ processed });
}
