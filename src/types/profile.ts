/**
 * Profile-related types shared between the frontend and the API.
 *
 * Mirrors `api/src/types.ts` — keep both in sync when shape changes.
 */

/**
 * Item shape for `profiles.conversation_topics` (jsonb array, max 5).
 * Surfaces topic hints on member cards to break the ice in offline meetups.
 */
export interface ConversationTopic {
  emoji: string;
  title: string;
  description: string;
}

export const CONVERSATION_TOPICS_MAX = 5;
