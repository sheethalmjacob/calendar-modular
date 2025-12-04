# GitHub Issues for Calendar Modular - Phase 1

Copy each section below and create a new issue on GitHub manually.

---

## Issue 1: Phase 1.1 - Project Initialization

**Title:** Phase 1.1: Project Initialization

**Body:**
```
**Goal:** Set up the basic React + TypeScript project structure with Vite.

## Terminal Commands
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

## What This Does
- Creates a new React project with TypeScript support
- Installs all necessary dependencies
- Starts a development server at http://localhost:5173

## Success Check
✅ Open browser to http://localhost:5173 and see Vite + React welcome page

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 30 mins
```

**Labels:** `setup`, `phase-1`

---

## Issue 2: Phase 1.2 - Install Core Dependencies

**Title:** Phase 1.2: Install Core Dependencies

**Body:**
```
**Goal:** Add all the libraries needed for routing, UI, calendar display, and drag-and-drop.

## Terminal Commands
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install react-router-dom
npm install react-big-calendar date-fns
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D @types/react-big-calendar
```

## What Each Library Does
- `react-router-dom` - Handles navigation between pages
- `react-big-calendar` - Pre-built calendar component with day/week/month views
- `date-fns` - Helps with date calculations and formatting
- `@dnd-kit/*` - Enables drag-and-drop functionality for time blocks
- `@types/react-big-calendar` - TypeScript type definitions

## Success Check
✅ Run `npm list` and verify all packages are installed without errors

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 15 mins
```

**Labels:** `dependencies`, `phase-1`

---

## Issue 3: Phase 1.3 - Set Up Shadcn/ui

**Title:** Phase 1.3: Set Up Shadcn/ui (UI Component Library)

**Body:**
```
**Goal:** Install a modern component library for buttons, forms, modals, etc.

## Terminal Commands
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npx shadcn-ui@latest init
```

## Interactive Prompts (Answer These)
- TypeScript? → **Yes**
- Style? → **Default**
- Base color? → **Slate**
- Global CSS file? → **src/index.css**
- CSS variables for colors? → **Yes**
- tailwind.config.js location? → **tailwind.config.js**
- Import alias for components? → **@/components**
- Import alias for utils? → **@/lib/utils**

## Then Install Common Components
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
```

## Success Check
✅ You should see a `src/components/ui/` folder with component files

---
**Phase:** 1 | **Priority:** High | **Estimate:** 20 mins
```

**Labels:** `ui`, `phase-1`

---

## Issue 4: Phase 1.4 - Create Supabase Project

**Title:** Phase 1.4: Create Supabase Project and Configure Authentication

**Body:**
```
**Goal:** Set up backend database and user authentication system.

## Browser Steps (Supabase Dashboard)
1. Go to https://supabase.com
2. Sign up or log in
3. Click "New Project"
4. Name: `calendar-modular`
5. Save database password somewhere safe!
6. Choose region closest to you
7. Click "Create new project" (wait 2-3 minutes)

## Get Supabase Credentials
1. In Supabase dashboard: Settings → API
2. Copy "Project URL" (https://xxxxx.supabase.co)
3. Copy "anon public" key (starts with "eyJ...")

## Terminal Commands
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install @supabase/supabase-js
```

## Create Environment File
Create `calendar-modular-app/.env.local`:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Create Supabase Client
Create file `src/lib/supabase.ts` (see PLAN.md for code)

## Enable Auth Providers
In Supabase dashboard: Authentication → Providers
- ✅ Enable "Email"
- ✅ Enable "Google"
- ✅ Enable "Microsoft Azure"
- ✅ Enable "Apple"

## Success Check
✅ File `src/lib/supabase.ts` exists and `npm run dev` starts without errors

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 30 mins
```

**Labels:** `backend`, `auth`, `phase-1`

---

## Issue 5: Phase 1.5 - Build Login and Signup Pages

**Title:** Phase 1.5: Build Login and Signup Pages

**Body:**
```
**Goal:** Create pages where users can create accounts and log in.

## Files to Create
1. `src/contexts/AuthContext.tsx` - Auth state management
2. `src/pages/Login.tsx` - Login form
3. `src/pages/Signup.tsx` - Signup form

See **PLAN.md Step 1.5** for complete code for all three files.

## What This Does
- Creates reusable authentication logic (AuthContext)
- Builds login and signup forms with email/password
- Adds Google sign-in button
- Handles errors and success messages

## Success Check
✅ Navigate to `/login` and `/signup` routes—forms should display properly

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 45 mins
```

**Labels:** `auth`, `frontend`, `phase-1`

---

## Issue 6: Phase 1.6 - Set Up Routing

**Title:** Phase 1.6: Set Up Routing and Protected Routes

**Body:**
```
**Goal:** Add navigation between pages and prevent access to calendar without logging in.

## Update Main App File
Update `src/App.tsx` with routing logic (see PLAN.md Step 1.6 for code)

## What This Does
- Sets up routes for /login, /signup, /calendar
- Redirects logged-out users to login
- Redirects logged-in users from "/" to calendar
- Shows loading state while checking auth

## Success Check
✅ Try accessing `/calendar` without logging in—should redirect to `/login`

---
**Phase:** 1 | **Priority:** High | **Estimate:** 20 mins
```

**Labels:** `frontend`, `routing`, `phase-1`

---

## Issue 7: Phase 1.7 - Create Database Schema

**Title:** Phase 1.7: Create Database Schema for Events and Classes

**Body:**
```
**Goal:** Create database tables to store calendar events AND extracted class information from PDFs.

## Tables to Create in Supabase

### Table 1: `events` (for personal events)
See PLAN.md Step 1.7 for complete column specifications.

Key columns:
- id, user_id, title, description
- start_time, end_time, location
- color, category, is_flexible
- created_at, updated_at

### Table 2: `class_catalog` (for PDF-extracted classes)
Key columns:
- id, user_id, course_name, course_code
- section, days (array), start_time, end_time
- location, instructor, color
- is_hidden, pdf_source
- created_at, updated_at

## Set Up Row Level Security (RLS)
Enable RLS on both tables with policies:
- Users can SELECT own events/classes
- Users can INSERT own events/classes
- Users can UPDATE own events/classes
- Users can DELETE own events/classes

## Success Check
✅ In Supabase dashboard, see both `events` and `class_catalog` tables with all columns

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 30 mins
```

**Labels:** `database`, `backend`, `phase-1`

---

## Issue 8: Phase 1.8 - Set Up Google Gemini

**Title:** Phase 1.8: Set Up Google Gemini for PDF Parsing (PRIMARY FEATURE)

**Body:**
```
**Goal:** Integrate with Google Gemini AI to extract class information from uploaded PDF schedules.

## Get Gemini API Key
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key (starts with "AI...")

## Add to Environment File
Update `calendar-modular-app/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Terminal Commands
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install @google/generative-ai
npm install pdf-parse
```

## What This Does
- Connects your app to Google's Gemini AI (free tier)
- Enables PDF text extraction and parsing
- Prepares for automated class schedule extraction

## Success Check
✅ File `.env.local` has VITE_GEMINI_API_KEY and packages are installed

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 15 mins
```

**Labels:** `ai`, `pdf`, `primary-feature`, `phase-1`

---

## Issue 9: Phase 1.9 - Build PDF Upload Component

**Title:** Phase 1.9: Build PDF Upload Component

**Body:**
```
**Goal:** Create file upload interface that sends PDFs to Gemini for class extraction.

## File to Create
`src/components/PDFUpload.tsx` - See PLAN.md Step 1.9 for complete code

## What This Does
- Creates file upload button for PDFs
- Sends PDF to Google Gemini AI
- Parses AI response for class information
- Saves extracted classes to `class_catalog` table
- Displays success message with count

## Success Check
✅ Component renders with upload button. Uploading a PDF should show "Extracting classes..." message

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 1 hour
```

**Labels:** `pdf`, `ai`, `frontend`, `primary-feature`, `phase-1`

---

## Issue 10: Phase 1.10 - Build Class Catalog Browser

**Title:** Phase 1.10: Build Class Catalog Browser

**Body:**
```
**Goal:** Create sidebar showing all extracted classes with hide/unhide toggles.

## File to Create
`src/components/ClassCatalog.tsx` - See PLAN.md Step 1.10 for complete code

## What This Does
- Displays all PDF-extracted classes in a searchable list
- Shows visibility toggle (eye icon) for each class
- Hidden classes appear faded with eye-off icon
- Search filters by course name or code
- Shows count of visible vs. total classes

## Additional Package Needed
```bash
npm install lucide-react
```

## Success Check
✅ Component shows list of classes with working search and hide/unhide toggles

---
**Phase:** 1 | **Priority:** High | **Estimate:** 45 mins
```

**Labels:** `frontend`, `catalog`, `primary-feature`, `phase-1`

---

## Issue 11: Phase 1.11 - Build Calendar View

**Title:** Phase 1.11: Build Calendar View with Fixed and Flexible Blocks

**Body:**
```
**Goal:** Create a calendar displaying two types of blocks—fixed (PDF classes) and flexible (personal events)—with different behaviors.

## File to Create
`src/pages/Calendar.tsx` - See PLAN.md Step 1.11 for complete code

## Update Styles
Add to `src/index.css`:
- Calendar custom styles (see PLAN.md)

## What This Does
- Displays events in a week view calendar
- Loads events from Supabase database
- Allows clicking empty slots to create events
- Allows clicking events to delete them
- Shows 15-minute time increments
- Includes sign-out button and user email

## Success Check
✅ Log in, navigate to calendar, click an empty time slot—should prompt for event title and create a new event

---
**Phase:** 1 | **Priority:** Critical | **Estimate:** 1.5 hours
```

**Labels:** `frontend`, `calendar`, `primary-feature`, `phase-1`

---

## Issue 12: Phase 1.12 - Add Drag-and-Drop

**Title:** Phase 1.12: Add Drag-and-Drop Event Manipulation

**Body:**
```
**Goal:** Enable dragging events to different times and resizing them.

## Update Calendar Component
Update `src/pages/Calendar.tsx` (see PLAN.md Step 1.12 for code):
- Add DndContext import
- Add onEventDrop handler
- Add onEventResize handler
- Enable resizable prop on BigCalendar

## What This Does
- Enables dragging events to new times
- Enables resizing events from top or bottom
- Automatically saves changes to database
- Snaps resize actions to 15-minute increments

## Success Check
✅ Drag an event to a different time—it should move and stay there after page refresh

---
**Phase:** 1 | **Priority:** High | **Estimate:** 30 mins
```

**Labels:** `frontend`, `drag-drop`, `phase-1`

---

## Issue 13: Phase 1.13 - Import from Google Calendar

**Title:** Phase 1.13: Add Calendar Import from Google Calendar

**Body:**
```
**Goal:** Let users import events from their Google Calendar as a one-time copy.

## Set Up Google Calendar API
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Google Calendar API"
4. Create OAuth 2.0 Client ID credentials
5. Add authorized origins: `http://localhost:5173`
6. Copy the Client ID

## Add Environment Variable
Update `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Terminal Commands
```bash
npm install @react-oauth/google gapi-script
```

## Files to Create/Update
1. `src/components/GoogleCalendarImport.tsx` - Import component
2. Update `src/pages/Calendar.tsx` - Add import button
3. Update `index.html` - Add Google API script

See PLAN.md Step 1.13 for complete code.

## Success Check
✅ Click import button, sign in with Google, see events appear in calendar

---
**Phase:** 1 | **Priority:** Medium | **Estimate:** 45 mins
```

**Labels:** `integration`, `google`, `import`, `phase-1`

---

## Issue 14: Phase 1.14 - Import from Outlook

**Title:** Phase 1.14: Add Calendar Import from Microsoft Outlook

**Body:**
```
**Goal:** Add import functionality for Outlook/Microsoft 365 calendars.

## Register App with Microsoft
1. Go to https://portal.azure.com
2. Navigate to Azure Active Directory → App registrations
3. Create new registration
4. Copy Application (client) ID

## Terminal Commands
```bash
npm install @azure/msal-browser @microsoft/microsoft-graph-client
```

## Files to Create/Update
1. `src/components/OutlookCalendarImport.tsx`
2. Update `src/pages/Calendar.tsx`

See PLAN.md Step 1.14 for complete code.

## Success Check
✅ Import button appears and opens Microsoft login popup

---
**Phase:** 1 | **Priority:** Medium | **Estimate:** 45 mins
```

**Labels:** `integration`, `outlook`, `import`, `phase-1`

---

## Issue 15: Phase 1.15 - Import from Apple Calendar

**Title:** Phase 1.15: Add Calendar Import from Apple Calendar (iCal)

**Body:**
```
**Goal:** Add file upload for .ics (iCalendar) files exported from Apple Calendar.

## Terminal Commands
```bash
npm install ical.js
npm install -D @types/ical.js
```

## Files to Create/Update
1. `src/components/AppleCalendarImport.tsx`
2. Update `src/pages/Calendar.tsx`

See PLAN.md Step 1.15 for complete code.

## Success Check
✅ Export a calendar from Apple Calendar as .ics, upload it, see events appear

---
**Phase:** 1 | **Priority:** Medium | **Estimate:** 30 mins
```

**Labels:** `integration`, `apple`, `import`, `phase-1`

---

## Issue 16: Phase 1.16 - Deploy to Vercel

**Title:** Phase 1.16: Deploy to Vercel

**Body:**
```
**Goal:** Make your app live on the internet.

## Terminal Commands
```bash
cd /workspaces/calendar-modular
git add .
git commit -m "feat: complete Phase 1 - core calendar with auth and imports"
git push origin main
```

## Deploy to Vercel (Browser)
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `calendar-modular` repository
5. Framework Preset: **Vite**
6. Root Directory: **calendar-modular-app**
7. Add Environment Variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_GOOGLE_CLIENT_ID
   - VITE_MICROSOFT_CLIENT_ID
   - VITE_GEMINI_API_KEY
8. Click "Deploy"

## Update OAuth Redirect URLs
- Google Cloud Console: Add Vercel URL
- Azure Portal: Add Vercel URL
- Supabase: Add Vercel URL to Site URL

## Success Check
✅ Visit your Vercel URL, sign up, log in, create events—everything should work live

---
**Phase:** 1 | **Priority:** High | **Estimate:** 30 mins
```

**Labels:** `deployment`, `vercel`, `phase-1`

---

## How to Create These Issues

1. Go to https://github.com/sheethalmjacob/calendar-modular/issues
2. Click "New issue"
3. Copy the **Title** from each section above
4. Copy the **Body** from each section above
5. Add the **Labels** (create them first if they don't exist)
6. Click "Submit new issue"
7. Repeat for all 16 issues

## Recommended Labels to Create First

- `setup`
- `dependencies`
- `ui`
- `backend`
- `auth`
- `frontend`
- `routing`
- `database`
- `ai`
- `pdf`
- `primary-feature`
- `catalog`
- `calendar`
- `drag-drop`
- `integration`
- `google`
- `outlook`
- `apple`
- `import`
- `deployment`
- `vercel`
- `phase-1`
