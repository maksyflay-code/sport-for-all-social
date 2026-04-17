import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface MentionUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  multiline?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * Textarea/Input with @mention autocomplete.
 * Shows a dropdown of matching users when the user types @ followed by 1+ chars.
 */
const MentionTextarea = forwardRef<HTMLTextAreaElement | HTMLInputElement, Props>(
  ({ value, onChange, placeholder, rows = 2, className, multiline = true, onKeyDown }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as any);

    const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [mentionStart, setMentionStart] = useState(-1);

    const detectMention = (text: string, caretPos: number) => {
      // Look back from caret for @ that is preceded by start/space/newline
      let i = caretPos - 1;
      while (i >= 0) {
        const ch = text[i];
        if (ch === "@") {
          if (i === 0 || /\s/.test(text[i - 1])) {
            const fragment = text.slice(i + 1, caretPos);
            if (/^[A-Za-zÀ-ÿ0-9_\.]*$/.test(fragment)) {
              return { start: i, query: fragment };
            }
          }
          return null;
        }
        if (/\s/.test(ch)) return null;
        i--;
      }
      return null;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newVal = e.target.value;
      onChange(newVal);
      const caret = e.target.selectionStart || newVal.length;
      const mention = detectMention(newVal, caret);
      if (mention) {
        setMentionStart(mention.start);
        searchUsers(mention.query);
      } else {
        setShowSuggestions(false);
        setMentionStart(-1);
      }
    };

    const searchUsers = async (query: string) => {
      if (query.length === 0) {
        // show recent / no results immediately
        setShowSuggestions(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .ilike("display_name", `%${query}%`)
        .limit(6);
      if (data && data.length > 0) {
        setSuggestions(data);
        setActiveIdx(0);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };

    const insertMention = (user: MentionUser) => {
      if (mentionStart < 0 || !user.display_name) return;
      const caret = inputRef.current?.selectionStart ?? value.length;
      const before = value.slice(0, mentionStart);
      const after = value.slice(caret);
      // Use display_name without spaces for the mention token (matches DB trigger logic)
      const token = "@" + user.display_name.replace(/\s+/g, "");
      const newVal = before + token + " " + after;
      onChange(newVal);
      setShowSuggestions(false);
      setMentionStart(-1);
      // restore focus + position caret after the inserted mention
      setTimeout(() => {
        const el = inputRef.current;
        if (el) {
          const pos = (before + token + " ").length;
          el.focus();
          el.setSelectionRange(pos, pos);
        }
      }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIdx((i) => (i + 1) % suggestions.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(suggestions[activeIdx]);
          return;
        }
        if (e.key === "Escape") {
          setShowSuggestions(false);
          return;
        }
      }
      onKeyDown?.(e);
    };

    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as any}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            className={className}
          />
        ) : (
          <Input
            ref={inputRef as any}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
          />
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-[#1e1e3a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            {suggestions.map((u, idx) => (
              <button
                key={u.user_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  idx === activeIdx ? "bg-orange-500/20" : "hover:bg-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center overflow-hidden shrink-0">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-orange-400">
                      {u.display_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <span className="text-sm text-white truncate">{u.display_name || "Anônimo"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MentionTextarea.displayName = "MentionTextarea";
export default MentionTextarea;
