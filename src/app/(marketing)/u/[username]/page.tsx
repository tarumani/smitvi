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

  const [publicKnowledge, reviews, consultationOffer] = await Promise.all([
    container.knowledge.listPublicByUser(profile.userId),
    container.social.listReviews(profile.userId),
    container.consultations.getEnabledOfferByUserId(profile.userId),
  ]);

  const consultationPriceLabel = consultationOffer
    ? consultationOffer.priceCents <= 0
      ? "Free intro"
      : `${(consultationOffer.priceCents / 100).toFixed(2)} ${consultationOffer.currency}`
    : "";

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

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
              <h2 className="font-display text-xl font-semibold">Expertise</h2>
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

          <div className="space-y-6">
            <GlassCard className="p-5">
              <h2 className="font-semibold">Consultation</h2>
              {consultationOffer ? (
                <div className="mt-3 space-y-4">
                  {consultationOffer.headline ? (
                    <p className="text-sm font-medium">
                      {consultationOffer.headline}
                    </p>
                  ) : null}
                  {consultationOffer.description ? (
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {consultationOffer.description}
                    </p>
                  ) : null}
                  {isOwner ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={ROUTES.consultationSettings}>
                        Manage consultations
                      </Link>
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
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {isOwner
                      ? "Turn on consultations to accept booking requests on this profile."
                      : "This expert is not accepting consultations right now."}
                  </p>
                  {isOwner ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={ROUTES.consultationSettings}>
                        Set up consultations
                      </Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </GlassCard>

            <GlassCard className="space-y-4 p-5">
              <h2 className="font-semibold">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-[var(--muted-foreground)]">
                  No reviews yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-t border-[var(--border)] pt-3 first:border-0 first:pt-0">
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
          </div>
        </div>
      </div>
    </div>
  );
}
