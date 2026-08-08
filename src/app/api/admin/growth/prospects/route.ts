import {
  handleGetProspects,
  handlePostProspect,
} from "@/application/growth/growth-admin-handlers";
import { jsonError } from "@/infrastructure/http/respond";

export async function GET(request: Request) {
  try {
    return handleGetProspects(request);
  } catch (e) {
    return jsonError(e);
  }
}

export async function POST(request: Request) {
  try {
    return handlePostProspect(request);
  } catch (e) {
    return jsonError(e);
  }
}
