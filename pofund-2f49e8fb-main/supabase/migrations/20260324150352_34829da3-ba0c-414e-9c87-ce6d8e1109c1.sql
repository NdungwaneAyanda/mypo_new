
CREATE TABLE IF NOT EXISTS public.application_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message_text text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their applications" ON public.application_messages
  FOR SELECT TO authenticated USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can insert messages in their applications" ON public.application_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid()
  );

CREATE INDEX idx_application_messages_application_id ON public.application_messages(application_id);
CREATE INDEX idx_application_messages_created_at ON public.application_messages(created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.application_messages;
