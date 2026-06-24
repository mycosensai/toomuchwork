import { Hono } from 'hono';
import { getDb } from '../api/queries/connection';
import { supportConversations } from '../db/schema';
import { eq } from 'drizzle-orm';

const intercomWebhook = new Hono();

intercomWebhook.post('/', async (c) => {
  const INTERCOM_ACCESS_TOKEN = c.env.INTERCOM_ACCESS_TOKEN as string;

  if (!INTERCOM_ACCESS_TOKEN) {
    return c.json({ error: 'Missing Intercom access token' }, 500);
  }

  // Verify webhook signature (Intercom uses HMAC SHA256)
  const signature = c.req.header('x-hub-signature');
  const body = await c.req.text();

  if (signature) {
    const crypto = require('crypto');
    const expected = crypto
      .createHmac('sha256', INTERCOM_ACCESS_TOKEN)
      .update(body)
      .digest('hex');
    if (signature !== 'sha256=' + expected) {
      console.error('Intercom webhook signature verification failed');
      return c.json({ error: 'Invalid signature' }, 400);
    }
  }

  let evt;
  try {
    evt = JSON.parse(body);
  } catch (err) {
    console.error('Intercom webhook: Invalid JSON', err);
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const topic = evt.topic;
  const data = evt.data?.item || {};

  console.log('Intercom webhook received:', topic);

  const db = getDb();

  switch (topic) {
    case 'conversation.user.created': {
      // New conversation from a user
      const conversationId = data.id;
      const userId = data.conversation_parts?.conversation_parts?.[0]?.author?.id || 'unknown';

      await db
        .insert(supportConversations)
        .values({
          intercomConversationId: conversationId,
          userId,
          type: 'general',
          status: 'open',
          metadata: JSON.stringify(data),
        })
        .onConflictDoUpdate({
          target: supportConversations.intercomConversationId,
          set: { status: 'open', metadata: JSON.stringify(data), updatedAt: new Date() },
        });

      console.log('Intercom: Conversation created:', conversationId);
      break;
    }

    case 'conversation.admin.assigned': {
      // Admin assigned to conversation
      const conversationId = data.id;
      const adminId = data.assignee?.id;

      await db
        .update(supportConversations)
        .set({ assignedTo: adminId, status: 'assigned', updatedAt: new Date() })
        .where(eq(supportConversations.intercomConversationId, conversationId));

      console.log('Intercom: Conversation assigned:', conversationId, 'to', adminId);
      break;
    }

    case 'conversation.user.replied':
    case 'conversation.admin.replied': {
      // Update last activity
      const conversationId = data.id;
      await db
        .update(supportConversations)
        .set({ updatedAt: new Date() })
        .where(eq(supportConversations.intercomConversationId, conversationId));
      break;
    }

    case 'conversation.closed': {
      // Conversation closed
      const conversationId = data.id;
      await db
        .update(supportConversations)
        .set({ status: 'closed', updatedAt: new Date() })
        .where(eq(supportConversations.intercomConversationId, conversationId));
      console.log('Intercom: Conversation closed:', conversationId);
      break;
    }

    default:
      console.log('Intercom: Unhandled topic:', topic);
  }

  return c.json({ success: true, topic });
});

export default intercomWebhook;