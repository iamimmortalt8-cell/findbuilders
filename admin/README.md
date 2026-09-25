# FindBuilders Admin Panel

The administrative dashboard for FindBuilders to review product submissions, manage published listings, and oversee platform users.

---

## Deploying Admin to Vercel

The Admin Panel is designed to deploy independently to Vercel as a standalone project within the monorepo.

### 1. Vercel Project Settings

When importing the project in Vercel:

- **Repository:** `https://github.com/iamimmortalt8-cell/findbuilders.git`
- **Root Directory:** `admin` *(Click "Edit" and set to `admin`)*
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

> **Note:** Do NOT deploy the repository root as a multi-service project. This Vercel project is dedicated strictly to `admin/`.

---

### 2. Environment Variables

Configure the following environment variables in the Vercel Project Settings (**Settings > Environment Variables**):

| Variable Name | Description | Example / Production Value |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xnlyxnffxmfsxlehsxps.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | *(Your Supabase publishable anon key)* |
| `VITE_API_URL` | Production Backend API URL | `https://findbuilders.onrender.com/api` |

> ⚠️ **Important Security Rule:**
> Only client-safe public keys (`VITE_*`) should be configured here. **Never** include `SUPABASE_SERVICE_ROLE_KEY` or any backend secrets in the client-facing Admin deployment.

---

### 3. Local Development

```bash
# From within the admin/ directory:
npm install
npm run dev
```

To run a production build and preview locally:

```bash
npm run build
npm run preview
```
