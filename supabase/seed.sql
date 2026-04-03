-- Promote the first signed-in user to admin after they exist in auth.users/profiles.
-- Replace the username in the WHERE clause with the desired initial admin.

UPDATE profiles
SET role = 'admin'
WHERE username = 'firekeeper';
