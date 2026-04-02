import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Community {
  id: string;
  name: string;
  description: string | null;
  sport: string;
  emoji: string;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export const useCommunities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: comms } = await supabase
      .from("communities")
      .select("*")
      .order("created_at", { ascending: false });

    if (!comms) { setLoading(false); return; }

    // Get member counts
    const { data: counts } = await supabase
      .from("community_members")
      .select("community_id");

    const countMap: Record<string, number> = {};
    (counts || []).forEach((m: any) => {
      countMap[m.community_id] = (countMap[m.community_id] || 0) + 1;
    });

    // Get user memberships
    let userMemberships: Set<string> = new Set();
    if (user) {
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      (memberships || []).forEach((m: any) => userMemberships.add(m.community_id));
    }

    setCommunities(
      comms.map((c: any) => ({
        ...c,
        member_count: countMap[c.id] || 0,
        is_member: userMemberships.has(c.id),
      }))
    );
    setLoading(false);
  };

  const join = async (communityId: string) => {
    if (!user) return;
    await supabase.from("community_members").insert({ community_id: communityId, user_id: user.id } as any);
    await load();
  };

  const leave = async (communityId: string) => {
    if (!user) return;
    await supabase.from("community_members").delete().eq("community_id", communityId).eq("user_id", user.id);
    await load();
  };

  const create = async (data: { name: string; description: string; sport: string; emoji: string }) => {
    if (!user) return;
    const { error } = await supabase.from("communities").insert({
      ...data,
      created_by: user.id,
    } as any);
    if (!error) {
      // Auto-join as admin
      const { data: newComm } = await supabase
        .from("communities")
        .select("id")
        .eq("created_by", user.id)
        .eq("name", data.name)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (newComm) {
        await supabase.from("community_members").insert({
          community_id: newComm.id,
          user_id: user.id,
          role: "admin",
        } as any);
      }
      await load();
    }
    return error;
  };

  useEffect(() => { load(); }, [user]);

  return { communities, loading, join, leave, create, reload: load };
};
