import {
  handleGetGrowthOverview,
  handleGetOpportunities,
  handleGetProspects,
  handlePostProspect,
  handlePostProspectResearch,
  handlePostProspectScore,
  handlePostMessageGenerate,
  handlePostMessageApprove,
  handleGetCampaigns,
  handlePostCampaign,
  handleGetAnalytics,
  handleGetReports,
  handleGetExperiments,
  handlePostProcessJobs,
} from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function GET() {
  try {
    return handleGetGrowthOverview();
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request) {
  try {
    return handlePostProcessJobs();
  } catch (e) {
    return jsonError(e);
  }
}
