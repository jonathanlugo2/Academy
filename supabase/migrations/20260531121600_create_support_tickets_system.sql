-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Users can view their own tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Users can create their own tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id OR public.is_admin());

CREATE POLICY "Admins can update tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create ticket_messages table
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on ticket_messages
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ticket_messages
CREATE POLICY "Users can view messages of their tickets"
ON public.ticket_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (t.student_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Users can insert messages into their open tickets"
ON public.ticket_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (
      (t.student_id = auth.uid() AND t.status = 'open')
      OR public.is_admin()
    )
  )
);

-- Trigger to update updated_at in tickets when a message is added
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tickets
  SET updated_at = now()
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_ticket_timestamp_trigger
AFTER INSERT ON public.ticket_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_timestamp();
