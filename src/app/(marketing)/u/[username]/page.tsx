import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/application/auth/get-current-session";
import { container } from "@/application/container";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { ConsultationRequestForm } from "@/components/consultations/consultation-request-form";
import { FollowButton } from "@/components/profile/follow-button";
import { ShareProfileButton } from "@/components/profile/share-profile-button";
import { ReviewForm } from "@/components/profile/review-form";
import { IntelligenceHubTabs, HubEngagementBar } from "@/components/profile/intelligence-hub-tabs";
import { ROUTES } from "@/config/constants";
import { getExampleHubByUsername } from "@/config/example-hubs";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await container.profiles.findByUsername(username);
  if (!profile || profile.visibility === "PRIVATE") {
    return { title: "Profile not found" };
  }
  return {
    title: `${profile.displayName} (@${profile.username})`,
    description: profile.headline ?? profile.bio ?? "Smitvi Knowledge Twin",
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await container.profiles.findByUsername(username);
  if (!profile || profile.visibility === "PRIVATE") {
    const example = getExampleHubByUsername(username);
    if (example) redirect(ROUTES.exampleHub(example.slug));
    notFound();
  }

  const session = await getCurrentSession();
  const isOwner = session?.user.id === profile.userId;
  const isFollowing = session
    ? await container.social.isFollowing(session.user.id, profile.userId)
    : false;

  const [publicKnowledge, reviews, consultationOffer, reputationScore, offerListings] =
    await Promise.all([
    container.knowledge.listPublicByUser(profile.userId),
    container.social.listReviews(profile.userId),
    container.consultations.getEnabledOfferByUserId(profile.userId),
    container.updateReputation.execute(profile.userId),
    container.marketplace.listActiveBySeller(profile.userId),
  ]);

  const consultationPriceLabel = consultationOffer
    ? consultationOffer.priceCents <= 0
      ? "Free intro"
      : `${(consultationOffer.priceCents / 100).toFixed(2)} ${consultationOffer.currency}`
    : "";

  const faqQuestions = publicKnowledge.flatMap((source) =>
    source.faqs.map((faq) => faq.question),
  );

  const overviewPanel = (
    <div className="space-y-6">
      <GlassCard className="p-6">
        {profile.headline ? (
          <p className="text-lg font-medium">{profile.headline}</p>
        ) : null}
        <p className="mt-3 text-[var(--muted-foreground)]">
          {profile.bio || "No bio yet."}
        </p>
        <div className="mt-5 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
          <span>{profile.followersCount} followers</span>
          <span>
            {profile.ratingAverage.toFixed(1)} ★ ({profile.ratingCount})
          </span>
          <span>Reputation {reputationScore}/100</span>
          {profile.location ? <span>{profile.location}</span> : null}
        </div>
        {profile.skills.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : null}
      </GlassCard>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Projects</h2>
        {profile.portfolio.length === 0 ? (
          <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
            No projects published yet.
          </GlassCard>
        ) : (
          profile.portfolio.map((item) => (
            <GlassCard key={item.id} className="overflow-hidden p-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-40 w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                <p className="font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                ) : null}
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
                  >
                    View project
                  </a>
                ) : null}
              </div>
            </GlassCard>
          ))
        )}
      </section>
    </div>
  );

  const bookPanel = (
    <GlassCard className="p-6">
      <h2 className="font-display text-xl font-semibold">Book a consultation</h2>
      {consultationOffer ? (
        <div className="mt-4 space-y-4">
          {consultationOffer.headline ? (
            <p className="text-sm font-medium">{consultationOffer.headline}</p>
          ) : null}
          {consultationOffer.description ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {consultationOffer.description}
            </p>
          ) : null}
          <p className="text-sm font-semibold text-[var(--accent)]">
            {consultationPriceLabel}
            {consultationOffer.durationMinutes
              ? ` · ${consultationOffer.durationMinutes} min`
              : ""}
          </p>
          {isOwner ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={ROUTES.consultationSettings}>Manage consultations</Link>
            </Button>
          ) : (
            <ConsultationRequestForm
              username={profile.username}
              defaultName={session?.profile?.displayName ?? ""}
              defaultEmail={session?.email ?? ""}
              durationMinutes={consultationOffer.durationMinutes}
              priceLabel={consultationPriceLabel}
            />
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            {isOwner
              ? "Turn on consultations so visitors can book time with you."
              : "This expert is not accepting consultations right now. Try Ask or Offers instead."}
          </p>
          {isOwner ? (
            <Button asChild variant="secondary" size="sm">
              <Link href={ROUTES.consultationSettings}>Set up consultations</Link>
            </Button>
          ) : null}
        </div>
      )}
    </GlassCard>
  );

  const reviewsPanel = (
    <GlassCard className="space-y-4 p-6">
      <h2 className="font-display text-xl font-semibold">Reviews</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          No reviews yet — be the first after you chat or book.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0"
            >
              <p className="text-sm font-medium">
                {review.rating} ★ · @{review.reviewerUsername}
              </p>
              {review.comment ? (
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {review.comment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
      {!isOwner ? (
        <ReviewForm
          username={profile.username}
          isAuthenticated={Boolean(session)}
        />
      ) : null}
    </GlassCard>
  );

  const connectPanel = (
    <GlassCard className="space-y-4 p-6">
      <h2 className="font-display text-xl font-semibold">Connect</h2>
      <p className="text-sm text-[var(--muted-foreground)]">
        Links and presence outside Smitvi — stay in touch across the web.
      </p>
      {profile.websiteUrl ? (
        <a
          href={profile.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium hover:border-[var(--accent)]"
        >
          Website →
        </a>
      ) : null}
      {profile.socialLinks.length ? (
        <ul className="space-y-2">
          {profile.socialLinks.map((link) => (
            <li key={link.id}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-[var(--border)] px-4 py-3 text-sm capitalize hover:border-[var(--accent)]"
              >
                {link.platform} →
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      {!profile.websiteUrl && profile.socialLinks.length === 0 ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {isOwner
            ? "Add website and social links in profile settings so visitors can follow you everywhere."
            : "No external links added yet."}
        </p>
      ) : null}
      {isOwner ? (
        <Button asChild variant="secondary" size="sm">
          <Link href={ROUTES.profileSettings}>Edit links</Link>
        </Button>
      ) : null}
    </GlassCard>
  );

  const ownerPulse = isOwner ? (
    <GlassCard className="border-[var(--accent)]/30 bg-[var(--accent-soft)]/30 p-5">
      <p className="text-sm font-semibold text-[var(--accent)]">
        Keep your hub active
      </p>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Train sources, respond to leads, and publish offers so visitors keep
        coming back.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={ROUTES.hub.intelligence}>Train Twin</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={ROUTES.hub.leads}>Leads</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href={ROUTES.marketplaceSell}>Sell expertise</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={ROUTES.hub.dashboard}>Dashboard</Link>
        </Button>
      </div>
    </GlassCard>
  ) : null;

  const knowledgePanel = (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Public knowledge</h2>
      {publicKnowledge.length === 0 ? (
        <GlassCard className="p-5 text-sm text-[var(--muted-foreground)]">
          No public expertise published yet.
        </GlassCard>
      ) : (
        publicKnowledge.map((source) => (
          <GlassCard key={source.id} className="p-5">
            <p className="font-semibold">{source.title}</p>
            {source.summary ? (
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {source.summary}
              </p>
            ) : null}
            {source.topics.length ? (
              <p className="mt-3 text-xs text-[var(--muted)]">
                {source.topics.join(" · ")}
              </p>
            ) : null}
          </GlassCard>
        ))
      )}
    </section>
  );

  return (
    <div className="pb-16">
      <div className="relative h-40 w-full bg-gradient-to-r from-teal-700/35 via-sky-600/20 to-transparent sm:h-52" />
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-col gap-6 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar
              src={profile.avatarUrl}
              name={profile.displayName}
              className="h-24 w-24 border-4 border-[var(--background)] text-xl"
            />
            <div className="pb-1">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {profile.displayName}
              </h1>
              <p className="text-[var(--muted-foreground)]">@{profile.username}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareProfileButton username={profile.username} />
            {!isOwner ? (
              <FollowButton
                username={profile.username}
                initialFollowing={isFollowing}
                isAuthenticated={Boolean(session)}
              />
            ) : (
              <Button asChild variant="secondary">
                <Link href={ROUTES.profileSettings}>Edit profile</Link>
              </Button>
            )}
            {profile.publicTwinEnabled ? (
              <Button asChild>
                <Link href={ROUTES.publicTwinChat(profile.username)}>
                  Chat with Twin
                </Link>
              </Button>
            ) : null}
          </div>
        </div>

        <HubEngagementBar
          username={profile.username}
          publicTwinEnabled={profile.publicTwinEnabled}
          hasConsultation={Boolean(consultationOffer)}
          offerCount={offerListings.length}
          isOwner={isOwner}
          showFollow={!isOwner}
          followSlot={
            <FollowButton
              username={profile.username}
              initialFollowing={isFollowing}
              isAuthenticated={Boolean(session)}
            />
          }
        />

        <IntelligenceHubTabs
          username={profile.username}
          publicTwinEnabled={profile.publicTwinEnabled}
          overview={overviewPanel}
          knowledge={knowledgePanel}
          book={bookPanel}
          reviews={reviewsPanel}
          connect={connectPanel}
          ownerPulse={ownerPulse}
          faqQuestions={faqQuestions}
          offers={offerListings.map((listing) => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            priceCents: listing.priceCents,
            currency: listing.currency,
            type: listing.type,
          }))}
        />
      </div>
    </div>
  );
}
