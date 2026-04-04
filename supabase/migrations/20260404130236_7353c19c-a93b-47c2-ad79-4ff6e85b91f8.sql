
-- Allow admins to delete profiles (for removing fake users)
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any user's follows
CREATE POLICY "Admins can delete any follow"
ON public.follows
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any like
CREATE POLICY "Admins can delete any like"
ON public.likes
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete community members
CREATE POLICY "Admins can delete any community member"
ON public.community_members
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
