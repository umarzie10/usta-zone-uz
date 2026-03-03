
-- Fix the overly permissive INSERT policy
DROP POLICY "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications for others"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id OR sender_id IS NULL);
