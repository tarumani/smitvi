import type { PrismaProfileRepository } from "@/infrastructure/database/repositories/profile-repository";
import type { PrismaPushDeviceRepository } from "@/infrastructure/database/repositories/push-device-repository";
import { sendExpoPushMessages } from "@/infrastructure/push/expo-push-client";

export class MarketplaceOrderPushNotifier {
  constructor(
    private readonly pushDevices: PrismaPushDeviceRepository,
    private readonly profiles: PrismaProfileRepository,
  ) {}

  async notifySellerOrderPaid(input: {
    sellerUserId: string;
    buyerUserId: string;
    orderId: string;
    listingTitle: string;
    netAmountCents: number;
    currency: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.sellerUserId);
    if (tokens.length === 0) return;

    const buyer = await this.profiles.findSummaryByUserId(input.buyerUserId);
    const buyerName =
      buyer?.displayName ??
      (buyer?.username ? `@${buyer.username}` : "Someone");
    const amount = `${(input.netAmountCents / 100).toFixed(2)} ${input.currency}`;
    const title = truncate(input.listingTitle, 60);

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Marketplace sale",
        body: `${buyerName} bought “${title}” · net ${amount}`,
        sound: "default",
        data: {
          type: "marketplace_order_paid",
          orderId: input.orderId,
        },
      })),
    );
  }

  async notifyBuyerOrderPaid(input: {
    buyerUserId: string;
    sellerUserId: string;
    orderId: string;
    listingTitle: string;
    grossAmountCents: number;
    currency: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.buyerUserId);
    if (tokens.length === 0) return;

    const seller = await this.profiles.findSummaryByUserId(input.sellerUserId);
    const sellerName =
      seller?.displayName ??
      (seller?.username ? `@${seller.username}` : "the seller");
    const amount = `${(input.grossAmountCents / 100).toFixed(2)} ${input.currency}`;
    const title = truncate(input.listingTitle, 60);

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Purchase confirmed",
        body: `You bought “${title}” from ${sellerName} · ${amount}`,
        sound: "default",
        data: {
          type: "marketplace_purchase_paid",
          orderId: input.orderId,
        },
      })),
    );
  }

  async notifySellerRefundRequested(input: {
    sellerUserId: string;
    buyerUserId: string;
    orderId: string;
    listingTitle: string;
    netAmountCents: number;
    currency: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.sellerUserId);
    if (tokens.length === 0) return;

    const buyer = await this.profiles.findSummaryByUserId(input.buyerUserId);
    const buyerName =
      buyer?.displayName ??
      (buyer?.username ? `@${buyer.username}` : "A buyer");
    const title = truncate(input.listingTitle, 60);

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Refund requested",
        body: `${buyerName} requested a refund for “${title}”`,
        sound: "default",
        data: {
          type: "marketplace_refund_requested",
          orderId: input.orderId,
        },
      })),
    );
  }

  async notifyBuyerRefundCompleted(input: {
    buyerUserId: string;
    sellerUserId: string;
    orderId: string;
    listingTitle: string;
    grossAmountCents: number;
    currency: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.buyerUserId);
    if (tokens.length === 0) return;

    const title = truncate(input.listingTitle, 60);
    const amount = `${(input.grossAmountCents / 100).toFixed(2)} ${input.currency}`;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Refund completed",
        body: `“${title}” · ${amount} · library access removed`,
        sound: "default",
        data: {
          type: "marketplace_refund_completed",
          orderId: input.orderId,
        },
      })),
    );
  }

  async notifySellerRefundCompleted(input: {
    sellerUserId: string;
    buyerUserId: string;
    orderId: string;
    listingTitle: string;
    netAmountCents: number;
    currency: string;
    reversedFrom: string;
  }): Promise<void> {
    const tokens = await this.pushDevices.listTokensForUser(input.sellerUserId);
    if (tokens.length === 0) return;

    const title = truncate(input.listingTitle, 60);
    const amount = `${(input.netAmountCents / 100).toFixed(2)} ${input.currency}`;

    await sendExpoPushMessages(
      tokens.map((to) => ({
        to,
        title: "Sale refunded",
        body: `“${title}” · ${amount} reversed from ${input.reversedFrom}`,
        sound: "default",
        data: {
          type: "marketplace_refund_completed",
          orderId: input.orderId,
        },
      })),
    );
  }
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
