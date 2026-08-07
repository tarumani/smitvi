import { z } from "zod";
import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  HEADLINE_MAX,
  USERNAME_MAX,
  USERNAME_MIN,
} from "@/config/constants";
import { HUB_ARCHETYPES } from "@/config/brand";
import { ValidationError } from "@/domain/shared/errors";

const hubArchetypeIds = HUB_ARCHETYPES.map((item) => item.id) as [
  string,
  ...string[],
];

const usernameRegex = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
  .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
  .regex(
    usernameRegex,
    "Username may contain lowercase letters, numbers, dots, underscores, and hyphens",
  )
  .refine(
    (value) => !value.includes("..") && !value.includes("__") && !value.includes("--"),
    "Username cannot contain consecutive separators",
  );

export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN, `Display name must be at least ${DISPLAY_NAME_MIN} characters`)
  .max(DISPLAY_NAME_MAX, `Display name must be at most ${DISPLAY_NAME_MAX} characters`);

export const bioSchema = z
  .string()
  .trim()
  .max(BIO_MAX, `Bio must be at most ${BIO_MAX} characters`)
  .optional()
  .nullable();

export const headlineSchema = z
  .string()
  .trim()
  .max(HEADLINE_MAX, `Headline must be at most ${HEADLINE_MAX} characters`)
  .optional()
  .nullable();

export const optionalUrlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .optional()
  .nullable()
  .or(z.literal("").transform(() => null));

export const socialPlatformSchema = z.enum([
  "linkedin",
  "github",
  "x",
  "youtube",
  "instagram",
  "website",
  "other",
]);

export const portfolioItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Project title is required")
    .max(160, "Project title must be at most 160 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  url: optionalUrlSchema,
  imageUrl: optionalUrlSchema,
});

export const createProfileSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
  bio: bioSchema,
  headline: headlineSchema,
  websiteUrl: optionalUrlSchema,
  location: z.string().trim().max(120).optional().nullable(),
  timezone: z.string().trim().max(64).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
  publicTwinEnabled: z.boolean().default(true),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .max(30)
    .default([]),
  socialLinks: z
    .array(
      z.object({
        platform: socialPlatformSchema,
        url: z.string().trim().url(),
      }),
    )
    .max(10)
    .default([]),
  portfolio: z.array(portfolioItemSchema).max(20).default([]),
  hubArchetypeId: z.enum(hubArchetypeIds).optional().nullable(),
  onboardingStep: z
    .enum([
      "welcome",
      "profession",
      "interests",
      "photo",
      "bio",
      "knowledge",
      "follow",
      "score",
      "archetype",
      "profile",
      "connect",
      "build",
      "celebrate",
    ])
    .optional()
    .nullable(),
  hubDigestEmailEnabled: z.boolean().optional(),
  avatarUrl: optionalUrlSchema,
});

export const updateProfileSchema = createProfileSchema.partial().extend({
  username: usernameSchema.optional(),
  displayName: displayNameSchema.optional(),
  publicTwinEnabled: z.boolean().optional(),
  portfolio: z.array(portfolioItemSchema).max(20).optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function parseCreateProfileInput(input: unknown): CreateProfileInput {
  const parsed = createProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid profile data", flattenZodErrors(parsed.error));
  }
  return parsed.data;
}

export function parseUpdateProfileInput(input: unknown): UpdateProfileInput {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Invalid profile data", flattenZodErrors(parsed.error));
  }
  return parsed.data;
}

function flattenZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "root";
    details[key] = details[key] ? [...details[key], issue.message] : [issue.message];
  }
  return details;
}

export function slugifySkill(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
