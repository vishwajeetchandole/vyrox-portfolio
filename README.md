# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Editing team profiles

The `/admin` editor can save member details, strengths, experience, projects, achievements, certificates, and images. On the hosted site, profile updates are committed to `public/team-members.json` through the Vercel API. Each update triggers a Vercel deployment, and the site loads the shared profiles through that API.

### One-time hosted backend setup

1. Connect this GitHub repository to Vercel and enable automatic deployments for its production branch.
2. Create a GitHub token with **Contents: read and write** access limited to this repository.
3. Add these environment variables in Vercel (at least for Production):
   - `GITHUB_TOKEN`: the repository-scoped GitHub token. Keep it only in Vercel; never put it in frontend code.
   - `GITHUB_REPOSITORY`: the repository in `owner/name` format.
   - `GITHUB_BRANCH`: the branch Vercel uses for production deployments.
   - `TEAM_EDITOR_PASSWORD`: a shared editor password of at least 16 characters. Give it only to the two members who will edit profiles.
4. Redeploy once after setting the variables. Both members can then sign in at `/admin`, select their own profile, and save. A member save is merged with the latest profiles before the GitHub commit so separate members' edits do not overwrite one another.

The GitHub token stays server-side. Updates to different profiles are merged against the latest repository version. If the same profile changed after a member opened it, their save is rejected with a conflict message instead of silently replacing newer details. Large profile files that GitHub omits from the Contents API response are read through the Git blob API using the returned blob SHA, both when loading profiles and when saving changes. Changes are visible on the site after the resulting Vercel deployment finishes.

**Import backup** can import one member or replace the complete team. **Download backup** exports the current shared team. Uploaded images are compressed; the complete team JSON is limited to 3 MB. During local Vite development, the editor intentionally saves only in that browser because the Vercel API is not running.

If a hosted save fails, the editor displays GitHub's HTTP status and API message when available. Check that `GITHUB_REPOSITORY` names this repository, `GITHUB_BRANCH` is the branch receiving production deployments, the token has **Contents: read and write** access, and the branch permits API commits. After changing Vercel environment variables, redeploy the project.
