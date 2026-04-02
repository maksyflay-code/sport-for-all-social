
-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sport TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏅',
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Communities are viewable by everyone"
ON public.communities FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create communities"
ON public.communities FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update community"
ON public.communities FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete community"
ON public.communities FOR DELETE
USING (auth.uid() = created_by);

-- Community members policies
CREATE POLICY "Members are viewable by everyone"
ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join communities"
ON public.community_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
ON public.community_members FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
