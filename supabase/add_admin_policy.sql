-- Add policy for organizers to view all users
CREATE POLICY "Organizers can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'organizer'
        )
    ); 