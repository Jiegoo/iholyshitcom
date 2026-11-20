-- Run only in your OWN Supabase project's SQL editor after creating your own Auth user.
-- Replace the placeholder; this grants access to one existing identity, never creates a password.
DO $$ DECLARE target uuid; owner_email text := 'replace-with-your-email@example.invalid'; BEGIN
 IF owner_email LIKE 'replace-with-%' THEN RAISE EXCEPTION 'Set your own email before running this bootstrap'; END IF;
 SELECT id INTO STRICT target FROM auth.users WHERE lower(email)=lower(owner_email) AND deleted_at IS NULL;
 IF EXISTS(SELECT 1 FROM public.manual_editor_owners WHERE enabled AND user_id<>target) THEN RAISE EXCEPTION 'Primary owner already initialized; use an explicit owner transfer process'; END IF;
 INSERT INTO public.editors(user_id,active,can_review_sources,can_manage_ai_budget) VALUES(target,true,true,false) ON CONFLICT(user_id) DO UPDATE SET active=true;
 INSERT INTO public.manual_editor_owners(user_id,enabled) VALUES(target,true) ON CONFLICT(user_id) DO UPDATE SET enabled=true;
 UPDATE public.manual_public_rollout SET enabled=true WHERE singleton;
END $$;
