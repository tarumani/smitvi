import { readAvatarBytes } from "@/infrastructure/storage/avatar-storage";

type RouteProps = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { userId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return new Response("Not found", { status: 404 });
  }

  const avatar = await readAvatarBytes(userId);
  if (!avatar) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(avatar.bytes), {
    status: 200,
    headers: {
      "Content-Type": avatar.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
