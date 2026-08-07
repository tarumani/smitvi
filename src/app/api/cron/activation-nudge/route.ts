import { SendActivationNudges } from "@/application/notifications/send-activation-nudges";
import { UnauthorizedError } from "@/domain/shared/errors";
import { jsonError, jsonOk } from "@/infrastructure/http/respond";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return jsonError(new UnauthorizedError());
  }

  try {
    const result = await new SendActivationNudges().execute();
    return jsonOk({ result });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  return POST(request);
}
