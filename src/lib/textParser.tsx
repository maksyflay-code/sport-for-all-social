import { Link } from "react-router-dom";
import { ReactNode } from "react";

// Matches @username (letters, numbers, _ and . — Portuguese accents allowed)
const MENTION_REGEX = /@([A-Za-zÀ-ÿ0-9_\.]{2,40})/g;
// Matches #hashtag
const HASHTAG_REGEX = /#([A-Za-zÀ-ÿ0-9_]{2,40})/g;
// Combined for splitting
const COMBINED_REGEX = /(@[A-Za-zÀ-ÿ0-9_\.]{2,40}|#[A-Za-zÀ-ÿ0-9_]{2,40})/g;

interface MentionableUser {
  user_id: string;
  display_name: string | null;
}

/**
 * Renders text with clickable @mentions (linked to user profiles) and #hashtags (linked to tag pages).
 * Mentions are matched against the provided users map by lowercased display_name (with spaces stripped).
 */
export function renderRichText(
  text: string,
  mentionMap?: Map<string, string> // lowercased name (no spaces) → user_id
): ReactNode[] {
  if (!text) return [];
  const parts = text.split(COMBINED_REGEX);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith("@")) {
      const name = part.slice(1).toLowerCase();
      const userId = mentionMap?.get(name);
      if (userId) {
        return (
          <Link
            key={idx}
            to={`/usuario/${userId}`}
            className="text-orange-400 hover:text-orange-300 hover:underline font-medium"
          >
            {part}
          </Link>
        );
      }
      // unmatched mention — still highlight visually
      return (
        <span key={idx} className="text-orange-400/70">
          {part}
        </span>
      );
    }

    if (part.startsWith("#")) {
      const tag = part.slice(1).toLowerCase();
      return (
        <Link
          key={idx}
          to={`/tag/${encodeURIComponent(tag)}`}
          className="text-orange-400 hover:text-orange-300 hover:underline font-medium"
        >
          {part}
        </Link>
      );
    }

    return <span key={idx}>{part}</span>;
  });
}

/**
 * Extracts unique mention names (lowercase, no @) from a block of text.
 */
export function extractMentions(text: string): string[] {
  const matches = text.matchAll(MENTION_REGEX);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1].toLowerCase());
  return Array.from(set);
}

/**
 * Extracts unique hashtags (lowercase, no #) from a block of text.
 */
export function extractHashtags(text: string): string[] {
  const matches = text.matchAll(HASHTAG_REGEX);
  const set = new Set<string>();
  for (const m of matches) set.add(m[1].toLowerCase());
  return Array.from(set);
}

/**
 * Builds a Map of normalized display_name → user_id for fast mention resolution.
 * Adds both the spaced and unspaced lowercased versions.
 */
export function buildMentionMap(users: MentionableUser[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const u of users) {
    if (!u.display_name) continue;
    const lower = u.display_name.toLowerCase();
    map.set(lower, u.user_id);
    map.set(lower.replace(/\s+/g, ""), u.user_id);
  }
  return map;
}
