-- Add the 'dono' role to the user with email i.blamelust@gmail.com
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'i.blamelust@gmail.com';
  
  IF target_user_id IS NOT NULL THEN
    -- Add 'dono' role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'dono')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also ensure they have admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;