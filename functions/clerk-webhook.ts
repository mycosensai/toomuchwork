import { Hono } from 'hono';
import { Webhook } from 'svix';
import { getDb } from '../api/queries/connection';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const clerkWebhook = new Hono();

clerkWebhook.post('/', async (c) => {
  const CLERK_WEBHOOK_SIGNING_SECRET = c.env.CLERK_WEBHOOK_SIGNING_SECRET as string;

  if (!CLERK_WEBHOOK_SIGNING_SECRET) {
    return c.json({ error: 'Missing webhook secret' }, 500);
  }

  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing svix headers' }, 400);
  }

  const body = await c.req.text();
  const wh = new Webhook(CLERK_WEBHOOK_SIGNING_SECRET);

  let evt: any;
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Clerk webhook verification failed:', err);
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  const eventType = evt.type;
  const data = evt.data;
  const db = getDb();

  console.log('Clerk webhook received:', eventType);

  switch (eventType) {
    case 'user.created': {
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || null;
      const name = data.first_name || data.last_name
        ? [data.first_name, data.last_name].filter(Boolean).join(' ')
        : data.username || email?.split('@')[0] || 'Collector';

      // Check if already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.unionId, clerkId))
        .limit(1);

      if (!existing) {
        // Check by email
        if (email) {
          const [byEmail] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (byEmail) {
            await db
              .update(users)
              .set({
                unionId: clerkId,
                name: name || byEmail.name,
                avatar: data.image_url || byEmail.avatar,
                updatedAt: new Date(),
              })
              .where(eq(users.id, byEmail.id));
            console.log('Clerk: Linked existing user by email:', byEmail.id);
            break;
          }
        }

        // Create new user
        await db.insert(users).values({
          unionId: clerkId,
          name,
          email,
          avatar: data.image_url || null,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignInAt: new Date(),
        });

        console.log('Clerk: User created:', { id: clerkId, email, name });
      }
      break;
    }

    case 'user.updated': {
      const clerkId = data.id;
      const email = data.email_addresses?.[0]?.email_address || null;
      const name = data.first_name || data.last_name
        ? [data.first_name, data.last_name].filter(Boolean).join(' ')
        : data.username;

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.unionId, clerkId))
        .limit(1);

      if (existing) {
        await db
          .update(users)
          .set({
            name: name || existing.name,
            email: email || existing.email,
            avatar: data.image_url || existing.avatar,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id));
        console.log('Clerk: User updated:', clerkId);
      }
      break;
    }

    case 'user.deleted': {
      const clerkId = data.id;
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.unionId, clerkId))
        .limit(1);

      if (existing) {
        // Soft-delete: clear OAuth/union link but keep account
        await db
          .update(users)
          .set({
            unionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existing.id));
        console.log('Clerk: User unlinked:', clerkId);
      }
      break;
    }

    case 'session.created':
    case 'session.ended':
    case 'session.removed':
      // Session events — we don't need to sync these to D1
      console.log(`Clerk: ${eventType} — session ${data.id} for user ${data.user_id}`);
      break;

    default:
      console.log('Clerk: Unhandled event:', eventType);
  }

  return c.json({
    success: true,
    event: eventType,
  });
});

export default clerkWebhook;
