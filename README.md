# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3bb52a59-7ef7-40ef-a06a-f7f0f4f3aec5

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/3bb52a59-7ef7-40ef-a06a-f7f0f4f3aec5) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/3bb52a59-7ef7-40ef-a06a-f7f0f4f3aec5) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Blogger Dashboard Login Setup

Follow these steps to create a blogger account that can access the Blogger Dashboard:

- Prerequisites
  - Supabase is already configured in `src/integrations/supabase/client.ts` with your project URL and anon key.
  - The app expects a `profiles` row for each user with `role` set to `blogger`.

- Create a blogger user in Supabase
  1. Open your Supabase project and go to `Authentication` → `Users`.
  2. Click `Add user` (or `Invite user`).
  3. Set email to `blogger@example.com` and a password (e.g., `password`).
  4. After creation, copy the new user’s `id` (UUID).

- Set the user’s role to blogger
  1. Go to `SQL` → `New query` in Supabase.
  2. Run the following SQL, replacing `<USER_ID>` with the UUID from the previous step:

```sql
-- Create or update the profile entry for the blogger
insert into profiles (id, email, full_name, role, created_at, updated_at)
values ('<USER_ID>', 'blogger@example.com', 'Blogger', 'blogger', now(), now())
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  updated_at = now();
```

- Verify the login
  1. Run the app locally: `npm i && npm run dev`.
  2. Open the app and log in with your blogger credentials.
  3. On successful login, you should be redirected to `/blogger`.

- Notes
  - If inserting into `profiles` fails due to Row Level Security (RLS), ensure you run the SQL from the Supabase SQL editor (which uses elevated privileges), or add/adjust RLS policies to allow users to upsert their own profile.
  - Sample credentials shown on the sign-in page are `blogger@example.com / password` and `admin@example.com / password`. You can use your own values; just make sure the `profiles.role` is set to `blogger` for blogger access.
