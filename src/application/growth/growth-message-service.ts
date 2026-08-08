import type {
  GrowthMessageApprovalStatus,
  GrowthMessageChannel,
} from "@/generated/prisma/client";
import { ForbiddenError, ValidationError } from "@/domain/shared/errors";
import { prisma } from "@/infrastructure/database/prisma";
import { GrowthValuePropositionService } from "@/application/growth/growth-value-proposition-service";

const DAILY_OUTREACH_LIMIT = Number(
  process.env.GROWTH_DAILY_OUTREACH_LIMIT ?? "50",
);

export class GrowthMessageService {
  constructor(
    private readonly valueProps = new GrowthValuePropositionService(),
  ) {}

  async generateDraft(input: {
    prospectId: string;
    channel: GrowthMessageChannel;
  }) {
    const prospect = await prisma.growthProspect.findUnique({
      where: { id: input.prospectId },
    });
    if (!prospect) throw new ValidationError("Prospect not found");
    if (prospect.doNotContact) {
      throw new ForbiddenError("Prospect is do-not-contact");
    }

    const vp = this.valueProps.build({
      name: prospect.name,
      profession: prospect.profession,
      skills: prospect.skills,
      portfolioUrl: prospect.portfolioUrl,
      publicSignals: prospect.publicSignals as Record<string, unknown>,
    });

    let body = vp.body;
    let subject: string | null = null;

    switch (input.channel) {
      case "EMAIL":
        subject = `Smitvi — ${vp.headline}`;
        body = `${vp.body}\n\nWould you be open to a short intro call?`;
        break;
      case "LINKEDIN_NOTE":
        body = `${vp.headline}. ${vp.body.slice(0, 240)}`.slice(0, 280);
        break;
      case "LINKEDIN_MESSAGE":
      case "TWITTER":
        body = `${vp.headline} — ${vp.body.slice(0, 400)}`;
        break;
      default:
        body = vp.body;
    }

    const message = await prisma.growthMessage.create({
      data: {
        prospectId: input.prospectId,
        channel: input.channel,
        subject,
        body,
        approvalStatus: "PENDING_REVIEW",
      },
    });

    await prisma.growthProspect.update({
      where: { id: input.prospectId },
      data: {
        status: "MESSAGE_DRAFTED",
        valueProposition: vp.headline,
      },
    });

    return { message, valueProposition: vp };
  }

  async approveMessage(input: {
    messageId: string;
    approverUserId: string;
    action: "approve" | "reject" | "edit";
    editedBody?: string;
  }) {
    const message = await prisma.growthMessage.findUnique({
      where: { id: input.messageId },
    });
    if (!message) throw new ValidationError("Message not found");

    let status: GrowthMessageApprovalStatus = "APPROVED";
    let body = message.body;
    if (input.action === "reject") status = "REJECTED";
    if (input.action === "edit" && input.editedBody?.trim()) {
      status = "EDITED";
      body = input.editedBody.trim();
    }

    const updated = await prisma.growthMessage.update({
      where: { id: input.messageId },
      data: {
        approvalStatus: status,
        body,
        approvedByUserId:
          input.action === "reject" ? null : input.approverUserId,
        approvedAt: input.action === "reject" ? null : new Date(),
      },
    });

    if (status === "APPROVED" || status === "EDITED") {
      await prisma.growthProspect.update({
        where: { id: message.prospectId },
        data: { status: "READY_FOR_OUTREACH" },
      });
    }

    return updated;
  }

  /** Records manual send — does NOT call external APIs. */
  async recordManualSend(messageId: string, actorUserId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sentToday = await prisma.growthMessage.count({
      where: { sentAt: { gte: todayStart } },
    });
    if (sentToday >= DAILY_OUTREACH_LIMIT) {
      throw new ForbiddenError("Daily outreach limit reached");
    }

    const message = await prisma.growthMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new ValidationError("Message not found");
    if (
      message.approvalStatus !== "APPROVED" &&
      message.approvalStatus !== "EDITED"
    ) {
      throw new ForbiddenError("Message requires human approval before send");
    }

    await prisma.growthMessage.update({
      where: { id: messageId },
      data: { sentAt: new Date() },
    });

    await prisma.growthOutreachEvent.create({
      data: {
        messageId,
        eventType: "MANUAL_SENT",
        metadata: { actorUserId },
      },
    });

    await prisma.growthProspect.update({
      where: { id: message.prospectId },
      data: { status: "CONTACTED" },
    });
  }
}
