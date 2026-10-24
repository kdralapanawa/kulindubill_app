# Bill Management App

React (TanStack Start) + Bootstrap + Lovable Cloud (Supabase) + jsPDF. Free-plan compatible.

## Pages
- `/` — User panel: submit Bill Title, Name, Amount (LKR), Date, Bill Image. The image is resized and converted to Base64 (JPEG) and saved in the `bills` table.
- `/auth` — Admin login (email/password via Supabase Auth).
- `/dashboard` — Admin only: table of bills, image preview, totals, search, and "Download All Bills as PDF".

## Admin account
The admin user `admin123@gmail.com` was created in Supabase Auth (password is not stored anywhere in the code).
A database trigger gives that email the `admin` role in `user_roles`. Public sign-ups are disabled.
To change the password, use the backend Users panel.

## Security
- RLS on `bills`: anyone may INSERT; only users with the `admin` role may SELECT/DELETE.
- Roles live in a separate `user_roles` table checked by the `has_role()` security-definer function.
- Only the publishable (anon) key is used in the frontend. No service-role key or password in code.

## Supabase SQL setup
See `supabase/setup.sql` (same as the applied migration).

## Customize
Edit text/colors in `src/routes/*.tsx` (Bootstrap classes) and the PDF layout in `src/lib/bills.ts`.
