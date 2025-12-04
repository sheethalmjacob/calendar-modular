# Calendar Modular - Detailed Implementation Plan

## Overview

This plan breaks down the development of Calendar Modular into four phases, with each phase containing detailed, actionable steps. As a non-technical user working with AI assistance, each step includes exact commands, file locations, and explanations.

**What We're Building:** A schedule planning tool for college students that transforms PDF class schedules into interactive visual blocks. Students can experiment with different class combinations, add personal events, and export their perfect schedule to their real calendar.

**Core Workflow:**
1. Upload PDF class schedule → AI extracts all sections
2. Browse class catalog → Hide/unhide classes to test combinations
3. Add personal events → Drag study/work/gym time around fixed classes
4. Experiment freely → Try different layouts on a planning canvas
5. Export when satisfied → Send to Google Calendar/Outlook/Apple Calendar
6. Make changes anytime → Return and re-export as needed

---

## Phase 1: Core Schedule Planning (PDF-First)

**Goal:** Build a schedule planning application where students can upload PDF class schedules, browse extracted classes in a catalog, hide/unhide specific sections, add personal events with drag-and-drop, and export their finalized schedule to external calendars with a maintained connection for future edits.

### Step 1.1: Project Initialization

**What you're building:** The basic React + TypeScript project structure with Vite as the build tool.

**Terminal commands:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

**What this does:**
- Creates a new React project with TypeScript support
- Installs all necessary dependencies
- Starts a development server (you'll see it at http://localhost:5173)

**Files created:**
- `package.json` - Lists all your project dependencies
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `vite.config.ts` - Build tool configuration
- `tsconfig.json` - TypeScript configuration

**Success check:** Open browser to http://localhost:5173 and see the Vite + React welcome page.

---

### Step 1.2: Install Core Dependencies

**What you're building:** Adding all the libraries needed for routing, UI, calendar display, and drag-and-drop.

**Terminal commands:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install react-router-dom
npm install react-big-calendar date-fns
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D @types/react-big-calendar
```

**What each library does:**
- `react-router-dom` - Handles navigation between pages (login, calendar, settings)
- `react-big-calendar` - Pre-built calendar component with day/week/month views
- `date-fns` - Helps with date calculations and formatting
- `@dnd-kit/*` - Enables drag-and-drop functionality for time blocks
- `@types/react-big-calendar` - TypeScript type definitions for the calendar

**Success check:** Run `npm list` and verify all packages are installed without errors.

---

### Step 1.3: Set Up Shadcn/ui (UI Component Library)

**What you're building:** Installing a modern component library for buttons, forms, modals, etc.

**Terminal commands:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npx shadcn-ui@latest init
```

**Interactive prompts (answer these):**
- Would you like to use TypeScript? → Yes
- Which style would you like to use? → Default
- Which color would you like to use as base color? → Slate
- Where is your global CSS file? → src/index.css
- Would you like to use CSS variables for colors? → Yes
- Where is your tailwind.config.js located? → tailwind.config.js
- Configure the import alias for components? → @/components
- Configure the import alias for utils? → @/lib/utils

**Then install commonly used components:**
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add calendar
```

**What this does:**
- Sets up Tailwind CSS (styling framework)
- Creates reusable UI components in `src/components/ui/`
- Configures path aliases so you can import with `@/components/...`

**Files created:**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/card.tsx`
- `tailwind.config.js`
- `components.json`

**Success check:** You should see a `src/components/ui/` folder with component files.

---

### Step 1.4: Create Supabase Project and Configure Authentication

**What you're building:** Setting up your backend database and user authentication system.

**Steps:**

1. **Create Supabase project (in browser):**
   - Go to https://supabase.com
   - Sign up or log in
   - Click "New Project"
   - Name: `calendar-modular`
   - Database password: (save this somewhere safe!)
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup to complete

2. **Get your Supabase credentials:**
   - In Supabase dashboard, click "Settings" → "API"
   - Copy the "Project URL" (looks like: https://xxxxx.supabase.co)
   - Copy the "anon public" key (long string starting with "eyJ...")

3. **Install Supabase client library:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install @supabase/supabase-js
```

4. **Create environment file:**
Create a new file: `calendar-modular-app/.env.local`
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
(Replace with your actual values from step 2)

5. **Create Supabase client configuration:**
Create file: `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

6. **Enable authentication providers in Supabase:**
   - In Supabase dashboard: Authentication → Providers
   - Enable "Email" (already on by default)
   - Enable "Google" - follow their setup guide
   - Enable "Microsoft Azure" - follow their setup guide
   - Enable "Apple" - follow their setup guide

**What this does:**
- Creates your backend database and auth system
- Connects your React app to Supabase
- Enables email/password and social logins

**Success check:** The file `src/lib/supabase.ts` exists and `npm run dev` starts without errors.

---

### Step 1.5: Build Login and Signup Pages

**What you're building:** Pages where users can create accounts and log in.

**Files to create:**

1. **Create auth context for managing login state:**
File: `src/contexts/AuthContext.tsx`
```typescript
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/calendar'
      }
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

2. **Create Login page:**
File: `src/pages/Login.tsx`
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      navigate('/calendar')
    } catch (err) {
      setError('Failed to log in. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to Calendar Modular</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Log In</Button>
          </form>
          
          <div className="mt-4">
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full"
            >
              Sign in with Google
            </Button>
          </div>
          
          <p className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <a href="/signup" className="text-blue-500 hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

3. **Create Signup page:**
File: `src/pages/Signup.tsx`
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp(email, password)
      setSuccess(true)
      setError('')
    } catch (err) {
      setError('Failed to create account.')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Check your email for a confirmation link!</p>
            <Button className="w-full mt-4" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full">Sign Up</Button>
          </form>
          
          <p className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <a href="/login" className="text-blue-500 hover:underline">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

**What this does:**
- Creates reusable authentication logic (AuthContext)
- Builds login and signup forms with email/password
- Adds Google sign-in button (works after OAuth setup)
- Handles errors and success messages

**Success check:** Navigate to `/login` and `/signup` routes—forms should display properly.

---

### Step 1.6: Set Up Routing and Protected Routes

**What you're building:** Navigation between pages and preventing access to calendar without logging in.

**Update main App file:**
File: `src/App.tsx`
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Calendar } from './pages/Calendar'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/calendar" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
```

**What this does:**
- Sets up routes for /login, /signup, /calendar
- Redirects logged-out users to login
- Redirects logged-in users from "/" to calendar
- Shows loading state while checking auth

**Success check:** Try accessing `/calendar` without logging in—should redirect to `/login`.

---

### Step 1.7: Create Database Schema for Events and Classes

**What you're building:** Database tables to store calendar events AND extracted class information from PDFs.

**Steps:**

1. **In Supabase Dashboard:**
   - Go to "Table Editor"
   - Create two tables: `events` and `class_catalog`

2. **Create `events` table (for personal events):**

| Column Name | Type | Default Value | Extra Settings |
|------------|------|---------------|----------------|
| id | uuid | uuid_generate_v4() | Primary key, unique |
| user_id | uuid | auth.uid() | Foreign key to auth.users |
| title | text | - | Required (NOT NULL) |
| description | text | - | Optional |
| start_time | timestamptz | - | Required (NOT NULL) |
| end_time | timestamptz | - | Required (NOT NULL) |
| location | text | - | Optional |
| color | text | #3b82f6 | Optional |
| category | text | - | Optional |
| is_flexible | boolean | true | true = draggable, false = fixed |
| created_at | timestamptz | now() | Required |
| updated_at | timestamptz | now() | Required |

3. **Create `class_catalog` table (for PDF-extracted classes):**

| Column Name | Type | Default Value | Extra Settings |
|------------|------|---------------|----------------|
| id | uuid | uuid_generate_v4() | Primary key, unique |
| user_id | uuid | auth.uid() | Foreign key to auth.users |
| course_name | text | - | Required (NOT NULL) |
| course_code | text | - | Optional (e.g., "CS 101") |
| section | text | - | Optional (e.g., "Section A") |
| days | text[] | - | Array of days (e.g., ["Monday", "Wednesday"]) |
| start_time | time | - | Required (NOT NULL) |
| end_time | time | - | Required (NOT NULL) |
| location | text | - | Optional |
| instructor | text | - | Optional |
| color | text | #10b981 | Optional (green for classes) |
| is_hidden | boolean | false | false = visible on calendar |
| pdf_source | text | - | Optional (original PDF filename) |
| created_at | timestamptz | now() | Required |
| updated_at | timestamptz | now() | Required |

3. **Set up Row Level Security (RLS) for `events` table:**
   - Click on the `events` table
   - Click "RLS" tab
   - Enable RLS
   - Add policy: "Users can view their own events"
     - Policy name: `Users can select own events`
     - Allowed operation: SELECT
     - Target roles: authenticated
     - USING expression: `auth.uid() = user_id`
   - Add policy: "Users can insert their own events"
     - Policy name: `Users can insert own events`
     - Allowed operation: INSERT
     - Target roles: authenticated
     - WITH CHECK expression: `auth.uid() = user_id`
   - Add policy: "Users can update their own events"
     - Policy name: `Users can update own events`
     - Allowed operation: UPDATE
     - Target roles: authenticated
     - USING expression: `auth.uid() = user_id`
   - Add policy: "Users can delete their own events"
     - Policy name: `Users can delete own events`
     - Allowed operation: DELETE
     - Target roles: authenticated
     - USING expression: `auth.uid() = user_id`

4. **Set up Row Level Security (RLS) for `class_catalog` table:**
   - Click on the `class_catalog` table
   - Click "RLS" tab
   - Enable RLS
   - Add the same four policies (select, insert, update, delete) with `auth.uid() = user_id`

**What this does:**
- Creates tables for both personal events and PDF-extracted classes
- `events` table: Stores draggable personal commitments
**Success check:** In Supabase dashboard, go to Table Editor and see both `events` and `class_catalog` tables with all columns.

---

### Step 1.8: Set Up Google Gemini for PDF Parsing (PRIMARY FEATURE)

**What you're building:** Integration with Google Gemini AI to extract class information from uploaded PDF schedules.

**Steps:**

1. **Get Gemini API key:**
   - Go to https://aistudio.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy the key (starts with "AI...")

2. **Add to environment file:**
Update `calendar-modular-app/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

3. **Install Gemini SDK:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm install @google/generative-ai
```

4. **Install PDF processing library:**
```bash
npm install pdf-parse
```

**What this does:**
- Connects your app to Google's Gemini AI (free tier)
- Enables PDF text extraction and parsing
- Prepares for automated class schedule extraction

**Success check:** File `.env.local` has VITE_GEMINI_API_KEY and packages are installed.

---

### Step 1.9: Build PDF Upload Component

**What you're building:** File upload interface that sends PDFs to Gemini for class extraction.

**Create PDF upload component:**
File: `src/components/PDFUpload.tsx`
```typescript
import { useState, useRef } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export function PDFUpload() {
  const [uploading, setUploading] = useState(false)
  const [extractedClasses, setExtractedClasses] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    setUploading(true)

    try {
      // Convert PDF to base64
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      
      fileReader.onload = async () => {
        const base64Data = fileReader.result as string
        
        // Send to Gemini for extraction
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        
        const prompt = `
          Extract all class schedule information from this university schedule PDF.
          Return ONLY a valid JSON array of objects with this exact structure:
          [
            {
              "course_name": "Full course name",
              "course_code": "Course code (e.g., CS 101)",
              "section": "Section identifier",
              "days": ["Monday", "Wednesday", "Friday"],
              "start_time": "09:00",
              "end_time": "10:15",
              "location": "Building and room",
              "instructor": "Professor name"
            }
          ]
          
          Parse all time formats to 24-hour format (HH:MM).
          If any field is not available, use empty string.
          Do not include any markdown formatting or explanations, just the JSON array.
        `

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data.split(',')[1]
            }
          },
          { text: prompt }
        ])

        const response = await result.response
        const text = response.text()
        
        // Parse JSON response
        const cleanedText = text.replace(/```json\\n?|```/g, '').trim()
        const classes = JSON.parse(cleanedText)
        
        // Save to database
        const { data, error } = await supabase
          .from('class_catalog')
          .insert(
            classes.map((cls: any) => ({
              course_name: cls.course_name,
              course_code: cls.course_code,
              section: cls.section,
              days: cls.days,
              start_time: cls.start_time,
              end_time: cls.end_time,
              location: cls.location,
              instructor: cls.instructor,
              pdf_source: file.name,
              is_hidden: false,
              color: '#10b981'
            }))
          )
          .select()

        if (error) throw error

        setExtractedClasses(data)
        alert(`Successfully extracted ${data.length} classes from PDF!`)
      }
    } catch (error) {
      console.error('PDF extraction error:', error)
      alert('Failed to extract classes from PDF. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Class Schedule PDF</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Extracting classes...' : 'Upload PDF Schedule'}
        </Button>
        
        {extractedClasses.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-green-600">
              ✓ Extracted {extractedClasses.length} classes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

**What this does:**
- Creates file upload button for PDFs
- Sends PDF to Google Gemini AI
- Parses AI response for class information
- Saves extracted classes to `class_catalog` table
- Displays success message with count

**Success check:** Component renders with upload button. Uploading a PDF should show "Extracting classes..." message.

---

### Step 1.10: Build Class Catalog Browser

**What you're building:** Sidebar showing all extracted classes with hide/unhide toggles.

**Create class catalog component:**
File: `src/components/ClassCatalog.tsx`
```typescript
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

interface ClassItem {
  id: string
  course_name: string
  course_code: string
  section: string
  days: string[]
  start_time: string
  end_time: string
  location: string
  instructor: string
  is_hidden: boolean
}

export function ClassCatalog() {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('class_catalog')
      .select('*')
      .order('course_code', { ascending: true })

    if (error) {
      console.error('Error loading classes:', error)
      return
    }

    setClasses(data)
  }

  const toggleVisibility = async (classId: string, currentHidden: boolean) => {
    const { error } = await supabase
      .from('class_catalog')
      .update({ is_hidden: !currentHidden })
      .eq('id', classId)

    if (error) {
      alert('Error updating class visibility')
      return
    }

    loadClasses()
  }

  const filteredClasses = classes.filter(cls =>
    cls.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.course_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const visibleCount = classes.filter(cls => !cls.is_hidden).length

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          Class Catalog
          <span className="text-sm font-normal text-gray-600 ml-2">
            ({visibleCount} / {classes.length} selected)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className={`p-3 border rounded-lg ${
                cls.is_hidden ? 'bg-gray-50 opacity-60' : 'bg-white'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {cls.course_code}: {cls.course_name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Section {cls.section}
                  </p>
                  <p className="text-xs text-gray-600">
                    {cls.days.join(', ')} • {cls.start_time} - {cls.end_time}
                  </p>
                  {cls.location && (
                    <p className="text-xs text-gray-500">{cls.location}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleVisibility(cls.id, cls.is_hidden)}
                >
                  {cls.is_hidden ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**What this does:**
- Displays all PDF-extracted classes in a searchable list
- Shows visibility toggle (eye icon) for each class
- Hidden classes appear faded with eye-off icon
- Search filters by course name or code
- Shows count of visible vs. total classes

**Success check:** Component shows list of classes with working search and hide/unhide toggles.

---

### Step 1.11: Build Calendar View with Fixed and Flexible Blocks

**What you're building:** A calendar displaying two types of blocks—fixed (PDF classes) and flexible (personal events)—with different behaviors.

**Design Reference:** See `docs/design/FigmaCalendar.png` for visual layout mockup.

**Create the Calendar page:**
File: `src/pages/Calendar.tsx`
```typescript
import { useState, useEffect } from 'react'
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
  color?: string
  category?: string
}

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const { user, signOut } = useAuth()

  // Load events from database
  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error loading events:', error)
      return
    }

    const formattedEvents = data.map((event: any) => ({
      id: event.id,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      description: event.description,
      location: event.location,
      color: event.color,
      category: event.category,
    }))

    setEvents(formattedEvents)
  }

  const handleSelectSlot = async ({ start, end }: { start: Date; end: Date }) => {
    const title = window.prompt('New Event Title:')
    if (!title) return

    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          title,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          color: '#3b82f6',
        },
      ])
      .select()

    if (error) {
      alert('Error creating event')
      return
    }

    loadEvents()
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    const confirmDelete = window.confirm(`Delete "${event.title}"?`)
    if (!confirmDelete) return

    supabase
      .from('events')
      .delete()
      .eq('id', event.id)
      .then(() => loadEvents())
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Calendar Modular</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 p-6">
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          step={15}
          timeslots={4}
          defaultView="week"
          style={{ height: '100%' }}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: event.color || '#3b82f6',
            },
          })}
        />
      </div>
    </div>
  )
}
```

**Add calendar styles:**
File: `src/index.css` (add to existing file)
```css
/* Existing styles... */

/* Calendar custom styles */
.rbc-calendar {
  font-family: inherit;
}

.rbc-time-slot {
  min-height: 40px;
}

.rbc-event {
  border-radius: 4px;
  padding: 2px 5px;
}
```

**What this does:**
- Displays events in a week view calendar
- Loads events from Supabase database
- Allows clicking empty slots to create events
- Allows clicking events to delete them
- Shows 15-minute time increments
- Includes sign-out button and user email

**Success check:** Log in, navigate to calendar, click an empty time slot—should prompt for event title and create a new event.

---

### Step 1.9: Add Drag-and-Drop Event Manipulation

**What you're building:** Ability to drag events to different times and resize them.

**Update Calendar component:**
File: `src/pages/Calendar.tsx` (update the existing file)

Add this import at the top:
```typescript
import { DndContext, DragEndEvent } from '@dnd-kit/core'
```

Update the BigCalendar component to support drag and drop:
```typescript
// Inside the Calendar component, update the BigCalendar props:
<BigCalendar
  localizer={localizer}
  events={events}
  startAccessor="start"
  endAccessor="end"
  view={view}
  onView={setView}
  date={date}
  onNavigate={setDate}
  onSelectSlot={handleSelectSlot}
  onSelectEvent={handleSelectEvent}
  onEventDrop={handleEventDrop}  // NEW
  onEventResize={handleEventResize}  // NEW
  selectable
  resizable  // NEW
  step={15}
  timeslots={4}
  defaultView="week"
  style={{ height: '100%' }}
  eventPropGetter={(event) => ({
    style: {
      backgroundColor: event.color || '#3b82f6',
    },
  })}
/>
```

Add these handler functions before the return statement:
```typescript
const handleEventDrop = async ({ event, start, end }: any) => {
  const { error } = await supabase
    .from('events')
    .update({
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    })
    .eq('id', event.id)

  if (error) {
    alert('Error updating event')
    return
  }

  loadEvents()
}

const handleEventResize = async ({ event, start, end }: any) => {
  // Snap to 15-minute increments
  const roundToQuarterHour = (date: Date) => {
    const minutes = date.getMinutes()
    const rounded = Math.round(minutes / 15) * 15
    date.setMinutes(rounded)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return date
  }

  const snappedStart = roundToQuarterHour(new Date(start))
  const snappedEnd = roundToQuarterHour(new Date(end))

  const { error } = await supabase
    .from('events')
    .update({
      start_time: snappedStart.toISOString(),
      end_time: snappedEnd.toISOString(),
    })
    .eq('id', event.id)

  if (error) {
    alert('Error resizing event')
    return
  }

  loadEvents()
}
```

**What this does:**
- Enables dragging events to new times
- Enables resizing events from top or bottom
- Automatically saves changes to database
- Snaps resize actions to 15-minute increments

**Success check:** Drag an event to a different time—it should move and stay there after page refresh.

---

### Step 1.10: Add Calendar Import from Google Calendar

**What you're building:** A button that lets users import events from their Google Calendar as a one-time copy.

**Steps:**

1. **Set up Google Calendar API credentials:**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Enable "Google Calendar API"
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:5173`
   - Authorized redirect URIs: `http://localhost:5173`
   - Copy the Client ID

2. **Add environment variable:**
Update `calendar-modular-app/.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

3. **Install Google API client:**
```bash
npm install @react-oauth/google gapi-script
```

4. **Create Google Calendar import component:**
File: `src/components/GoogleCalendarImport.tsx`
```typescript
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

declare const gapi: any

export function GoogleCalendarImport() {
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)

    try {
      // Initialize Google API client
      await new Promise((resolve) => gapi.load('client:auth2', resolve))
      
      await gapi.client.init({
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      })

      // Sign in
      const authInstance = gapi.auth2.getAuthInstance()
      await authInstance.signIn()

      // Fetch events from primary calendar
      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
      })

      const events = response.result.items

      // Import events to Supabase
      const eventsToInsert = events.map((event: any) => ({
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        start_time: event.start.dateTime || event.start.date,
        end_time: event.end.dateTime || event.end.date,
        location: event.location || '',
        color: '#10b981', // Green color for imported events
        category: 'imported-google',
      }))

      const { error } = await supabase.from('events').insert(eventsToInsert)

      if (error) throw error

      alert(`Successfully imported ${events.length} events from Google Calendar!`)
      window.location.reload()
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import events from Google Calendar')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Button onClick={handleImport} disabled={importing} variant="outline">
      {importing ? 'Importing...' : 'Import from Google Calendar'}
    </Button>
  )
}
```

5. **Add import button to Calendar page:**
Update `src/pages/Calendar.tsx`:

Add import at top:
```typescript
import { GoogleCalendarImport } from '@/components/GoogleCalendarImport'
```

Add component in header section (after email):
```typescript
<div className="flex gap-4 items-center">
  <GoogleCalendarImport />  {/* NEW */}
  <span className="text-sm text-gray-600">{user?.email}</span>
  <Button variant="outline" onClick={signOut}>
    Sign Out
  </Button>
</div>
```

6. **Load Google API script:**
Update `index.html` in the `<head>` section:
```html
<script src="https://apis.google.com/js/api.js"></script>
```

**What this does:**
- Adds "Import from Google Calendar" button
- Opens Google sign-in popup
- Fetches upcoming events from user's primary calendar
- Copies them as new events in your database
- Marks them with green color and "imported-google" category

**Success check:** Click import button, sign in with Google, see events appear in your calendar.

---

### Step 1.11: Add Calendar Import from Microsoft Outlook

**What you're building:** Similar import functionality for Outlook/Microsoft 365 calendars.

**Steps:**

1. **Register app with Microsoft:**
   - Go to https://portal.azure.com
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: Calendar Modular
   - Supported account types: Personal Microsoft accounts only
   - Redirect URI: Web → `http://localhost:5173`
   - Copy the "Application (client) ID"

2. **Add environment variable:**
Update `.env.local`:
```env
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id
```

3. **Install Microsoft authentication library:**
```bash
npm install @azure/msal-browser @microsoft/microsoft-graph-client
```

4. **Create Outlook import component:**
File: `src/components/OutlookCalendarImport.tsx`
```typescript
import { useState } from 'react'
import { PublicClientApplication } from '@azure/msal-browser'
import { Client } from '@microsoft/microsoft-graph-client'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
}

const msalInstance = new PublicClientApplication(msalConfig)

export function OutlookCalendarImport() {
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)

    try {
      await msalInstance.initialize()
      
      const loginResponse = await msalInstance.loginPopup({
        scopes: ['Calendars.Read'],
      })

      const graphClient = Client.init({
        authProvider: (done) => {
          done(null, loginResponse.accessToken)
        },
      })

      const events = await graphClient
        .api('/me/calendar/events')
        .top(100)
        .orderby('start/dateTime')
        .get()

      const eventsToInsert = events.value.map((event: any) => ({
        title: event.subject || 'Untitled Event',
        description: event.bodyPreview || '',
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        location: event.location?.displayName || '',
        color: '#f59e0b', // Orange for Outlook events
        category: 'imported-outlook',
      }))

      const { error } = await supabase.from('events').insert(eventsToInsert)

      if (error) throw error

      alert(`Successfully imported ${events.value.length} events from Outlook!`)
      window.location.reload()
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import from Outlook')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Button onClick={handleImport} disabled={importing} variant="outline">
      {importing ? 'Importing...' : 'Import from Outlook'}
    </Button>
  )
}
```

5. **Add to Calendar page:**
Update `src/pages/Calendar.tsx`:
```typescript
import { OutlookCalendarImport } from '@/components/OutlookCalendarImport'

// In header:
<GoogleCalendarImport />
<OutlookCalendarImport />  {/* NEW */}
```

**Success check:** Import button appears and opens Microsoft login popup.

---

### Step 1.12: Add Calendar Import from Apple Calendar (iCal)

**What you're building:** File upload for .ics (iCalendar) files exported from Apple Calendar.

**Steps:**

1. **Install iCal parser:**
```bash
npm install ical.js
npm install -D @types/ical.js
```

2. **Create Apple Calendar import component:**
File: `src/components/AppleCalendarImport.tsx`
```typescript
import { useRef, useState } from 'react'
import ICAL from 'ical.js'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function AppleCalendarImport() {
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const text = await file.text()
      const jcalData = ICAL.parse(text)
      const comp = new ICAL.Component(jcalData)
      const vevents = comp.getAllSubcomponents('vevent')

      const eventsToInsert = vevents.map((vevent) => {
        const event = new ICAL.Event(vevent)
        return {
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          start_time: event.startDate.toJSDate().toISOString(),
          end_time: event.endDate.toJSDate().toISOString(),
          location: event.location || '',
          color: '#8b5cf6', // Purple for Apple events
          category: 'imported-apple',
        }
      })

      const { error } = await supabase.from('events').insert(eventsToInsert)

      if (error) throw error

      alert(`Successfully imported ${eventsToInsert.length} events from Apple Calendar!`)
      window.location.reload()
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import .ics file')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ics"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        variant="outline"
      >
        {importing ? 'Importing...' : 'Import .ics file'}
      </Button>
    </>
  )
}
```

3. **Add to Calendar page:**
```typescript
import { AppleCalendarImport } from '@/components/AppleCalendarImport'

// In header:
<GoogleCalendarImport />
<OutlookCalendarImport />
<AppleCalendarImport />  {/* NEW */}
```

**What this does:**
- Adds file upload button for .ics files
- Parses iCalendar format (used by Apple, Google exports, etc.)
- Imports events with purple color coding

**Success check:** Export a calendar from Apple Calendar as .ics, upload it, see events appear.

---

### Step 1.13: Deploy to Vercel

**What you're building:** Making your app live on the internet.

**Steps:**

1. **Commit your code to GitHub:**
```bash
cd /workspaces/calendar-modular
git add .
git commit -m "feat: complete Phase 1 - core calendar with auth and imports"
git push origin main
```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your `calendar-modular` repository
   - Framework Preset: Vite
   - Root Directory: `calendar-modular-app`
   - Environment Variables: Add all from `.env.local`:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GOOGLE_CLIENT_ID`
     - `VITE_MICROSOFT_CLIENT_ID`
   - Click "Deploy"

3. **Update OAuth redirect URLs:**
   - Copy your Vercel URL (e.g., `https://calendar-modular.vercel.app`)
   - Update Google Cloud Console: Add Vercel URL to authorized origins and redirect URIs
   - Update Azure Portal: Add Vercel URL to redirect URIs
   - Update Supabase: Authentication → URL Configuration → Add Vercel URL to Site URL

**Success check:** Visit your Vercel URL, sign up, log in, create events—everything should work live.

---

## Phase 1 Complete! ✅

You now have:
- ✅ User authentication (email/password + social logins)
- ✅ Calendar view with week/day/month switching
- ✅ Create, edit, delete events
- ✅ Drag-and-drop event manipulation
- ✅ Resize events with 15-minute snapping
- ✅ Import from Google Calendar
- ✅ Import from Outlook Calendar
- ✅ Import from Apple Calendar (.ics files)
- ✅ Live deployment on Vercel

---

## Phase 2: Collaboration & Scheduling

**Goal:** Add scheduling links, calendar sharing, and meeting request functionality.

### Step 2.1: Create Database Schema for Scheduling Links

**What you're building:** Tables to store availability windows and booking requests.

**Create tables in Supabase:**

**Table 1: `availability_windows`**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `title` (text) - e.g., "Office Hours"
- `slug` (text, unique) - URL-friendly identifier
- `duration_minutes` (integer) - e.g., 30
- `available_days` (jsonb) - e.g., [1,2,3,4,5] for Mon-Fri
- `available_times` (jsonb) - e.g., [{start: "09:00", end: "17:00"}]
- `created_at` (timestamptz)

**Table 2: `booking_requests`**
- `id` (uuid, primary key)
- `availability_window_id` (uuid, references availability_windows)
- `requester_email` (text)
- `requester_name` (text)
- `requested_time` (timestamptz)
- `status` (text) - 'pending', 'accepted', 'declined'
- `created_at` (timestamptz)

**Enable RLS on both tables** with appropriate policies.

---

### Step 2.2: Build Scheduling Link Creation Interface

**What you're building:** Page where users define their availability and generate shareable links.

**Create new page:**
File: `src/pages/SchedulingLinks.tsx`

Features:
- Form to create new scheduling link
- Set title, duration, available days/times
- Generate shareable URL
- List existing scheduling links
- Toggle active/inactive

---

### Step 2.3: Build Public Booking Page

**What you're building:** Public page where anyone can book a time slot.

**Create public booking page:**
File: `src/pages/BookingPage.tsx`

Features:
- Shows available time slots based on owner's availability
- Compares against owner's existing events (checks for conflicts)
- Form to submit name, email, preferred time
- Creates pending booking request

---

### Step 2.4: Build Booking Request Management

**What you're building:** Dashboard for users to approve/decline booking requests.

Features:
- List all pending booking requests
- Accept → creates event on calendar
- Decline → notifies requester
- View accepted/declined history

---

### Step 2.5: Add Calendar Sharing (Busy/Free View)

**What you're building:** Generate a link that shows only busy/free time blocks without event details.

**Create new table in Supabase:**
`shared_calendars`
- `id` (uuid)
- `user_id` (uuid)
- `share_token` (text, unique) - random string for URL
- `expires_at` (timestamptz)
- `created_at` (timestamptz)

**Create sharing component:**
- Button to generate sharing link
- Set expiration date
- View who has access
- Revoke access

**Create public shared calendar view:**
- Shows time blocks as "Busy" without titles
- Color-coded by category (optional)
- No event details visible

---

### Step 2.6: Add Request-Based Calendar Overlay

**What you're building:** Users can request to view someone else's calendar; requires approval.

**Create new table:**
`calendar_access_requests`
- `id` (uuid)
- `requester_id` (uuid)
- `calendar_owner_id` (uuid)
- `status` (text) - 'pending', 'approved', 'denied'
- `message` (text)
- `created_at` (timestamptz)

**Features:**
- Search for users by email
- Send access request with message
- Owner receives notification (in-app)
- Owner approves/denies request
- Approved users can overlay calendar

---

### Step 2.7: Build Multi-Person Calendar Overlay

**What you're building:** View multiple calendars at once to find common free time.

**Features:**
- Select multiple shared calendars to view
- Show overlaid busy/free blocks
- Highlight time slots where ALL are free
- Show availability count (e.g., "3/4 people available")
- Suggest best meeting times

---

## Phase 2 Complete! ✅

You now have:
- ✅ Scheduling links with custom availability
- ✅ Public booking page
- ✅ Booking request management
- ✅ Calendar sharing (busy/free view)
- ✅ Request-based calendar access
- ✅ Multi-person calendar overlay
- ✅ Smart time suggestions

---

## Phase 3: Advanced Features

**Goal:** Add PDF parsing, export functionality, and intelligent scheduling suggestions.

### Step 3.1: Set Up Google Gemini for PDF Parsing

**What you're building:** Upload a PDF calendar and extract events automatically.

**Steps:**

1. **Get Gemini API key:**
   - Go to https://makersuite.google.com/app/apikey
   - Create API key
   - Add to `.env.local`: `VITE_GEMINI_API_KEY=your_key`

2. **Install Gemini SDK:**
```bash
npm install @google/generative-ai
```

3. **Create PDF upload component:**
File: `src/components/PDFCalendarImport.tsx`

Features:
- File upload for PDF
- Send PDF to Gemini API with prompt: "Extract all events from this calendar PDF. Return as JSON array with title, date, time, location."
- Parse JSON response
- Create events in database
- Show preview before importing

---

### Step 3.2: Add Smart Time Suggestions

**What you're building:** AI-powered suggestions for best meeting times based on patterns.

**Create suggestion algorithm:**
- Analyze user's event history
- Identify preferred meeting times (e.g., mornings, after lunch)
- Find longest free blocks
- Consider event categories (don't suggest during "Focus Time")
- Rank suggestions by quality score

**Display in UI:**
- Show top 3 suggested times when creating events
- Explain why each time is suggested
- One-click to accept suggestion

---

### Step 3.3: Build Export to External Calendars

**What you're building:** Export events back to Google/Outlook with duplicate detection.

**Features:**
- Select events to export
- Choose destination (Google/Outlook)
- Compare against existing events:
  - Match by title + start time + duration
  - Skip duplicates
  - Highlight new events to add
- Batch export with progress indicator

**Create export component:**
File: `src/components/CalendarExport.tsx`

Uses Google Calendar API / Microsoft Graph API to:
1. Fetch existing events
2. Compare with selected events
3. Insert only new/modified events

---

### Step 3.4: Add Recurring Event Patterns

**What you're building:** Create events that repeat (daily, weekly, monthly).

**Update database schema:**
Add to `events` table:
- `is_recurring` (boolean)
- `recurrence_rule` (text) - RRULE format
- `parent_event_id` (uuid) - references events table

**Create recurrence UI:**
- Checkbox: "Repeat this event"
- Options: Daily, Weekly, Monthly, Custom
- End condition: Never, After X times, On specific date
- Generate instances on save
- Edit single vs. all instances

---

### Step 3.5: Add Event Categories and Color Coding

**What you're building:** Predefined categories with custom colors.

**Create categories table:**
`event_categories`
- `id` (uuid)
- `user_id` (uuid)
- `name` (text) - e.g., "Work", "Personal", "Meetings"
- `color` (text) - hex code
- `is_default` (boolean)

**Features:**
- Create custom categories
- Assign category when creating event
- Filter calendar by category
- Category legend in sidebar

---

## Phase 3 Complete! ✅

You now have:
- ✅ PDF calendar parsing with Gemini AI
- ✅ Smart time suggestions based on patterns
- ✅ Export to Google/Outlook with duplicate detection
- ✅ Recurring events (daily, weekly, monthly)
- ✅ Custom event categories and colors

---

## Phase 4: Enhancements & Polish

**Goal:** Multi-timezone support, mobile optimization, performance improvements, and final UX polish.

### Step 4.1: Add Multi-Timezone Support

**What you're building:** Display and schedule events across different time zones.

**Features:**
- User timezone preference in settings
- Display events in selected timezone
- Timezone converter when creating events
- Show multiple timezone clocks in header
- Auto-detect user's current timezone

**Update database:**
Add to `events` table:
- `timezone` (text) - IANA timezone identifier

**Install timezone library:**
```bash
npm install date-fns-tz
```

---

### Step 4.2: Mobile Responsive Design

**What you're building:** Make the calendar work well on phones and tablets.

**Changes:**
- Responsive layout with Tailwind breakpoints
- Mobile-optimized calendar view (day view default on small screens)
- Touch-friendly drag and drop
- Hamburger menu for navigation
- Bottom sheet for event details

---

### Step 4.3: Performance Optimization

**What you're building:** Faster loading and smoother interactions.

**Optimizations:**
- Lazy load calendar events (only fetch visible date range)
- Implement virtual scrolling for large event lists
- Cache API responses
- Optimize Supabase queries with indexes
- Code splitting for faster initial load
- Image optimization for Ditto mascot

**Add database indexes:**
In Supabase SQL editor:
```sql
CREATE INDEX idx_events_user_time ON events(user_id, start_time);
CREATE INDEX idx_events_category ON events(category);
```

---

### Step 4.4: Add User Preferences & Settings

**What you're building:** Settings page for customization.

**Create settings page:**
File: `src/pages/Settings.tsx`

**Settings options:**
- Default calendar view (day/week/month)
- Week starts on (Sunday/Monday)
- Time format (12h/24h)
- Timezone preference
- Notification preferences
- Theme (light/dark mode)
- Delete account

**Create user_preferences table:**
- `user_id` (uuid, primary key)
- `default_view` (text)
- `week_starts_on` (integer)
- `time_format` (text)
- `timezone` (text)
- `theme` (text)

---

### Step 4.5: Add Ditto Mascot & Branding

**What you're building:** Visual identity with Ditto character.

**Assets to create:**
- Ditto logo for header
- Ditto loading animation
- Empty state illustrations (no events, no calendars shared)
- Ditto helper tooltips for first-time users

**Add to project:**
- Create `public/images/` folder
- Add Ditto PNG/SVG files
- Update header with logo
- Add animated Ditto on loading screens

---

### Step 4.6: User Onboarding Flow

**What you're building:** 3-5 step tutorial for new users.

**Create onboarding component:**
File: `src/components/Onboarding.tsx`

**Steps:**
1. Welcome screen with Ditto
2. "Create your first event"
3. "Import from your calendar"
4. "Share your availability"
5. "You're all set!"

**Implementation:**
- Show on first login only
- Store completion in user_preferences
- Skip button option
- Progress indicator

---

### Step 4.7: Error Handling & User Feedback

**What you're building:** Better error messages and loading states.

**Improvements:**
- Toast notifications for success/error
- Loading skeletons instead of blank screens
- Retry logic for failed API calls
- Offline detection with message
- Form validation with helpful errors
- Confirmation dialogs for destructive actions

**Install toast library:**
```bash
npx shadcn-ui@latest add toast
```

---

### Step 4.8: Accessibility (A11y) Improvements

**What you're building:** Making the app usable for everyone.

**Improvements:**
- Keyboard navigation for all features
- Screen reader labels (aria-labels)
- Focus indicators
- Color contrast compliance (WCAG AA)
- Skip to content link
- Descriptive button text (not just icons)

**Testing:**
- Use browser accessibility checker
- Test with screen reader (NVDA/VoiceOver)
- Tab through entire app with keyboard only

---

### Step 4.9: Security Enhancements

**What you're building:** Additional security measures.

**Implementations:**
- Rate limiting on API endpoints
- CSRF protection
- Secure cookie settings
- Content Security Policy headers
- SQL injection prevention (Supabase handles this)
- XSS prevention (React handles most of this)

**Add to Vercel:**
File: `vercel.json`
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

### Step 4.10: Analytics & Monitoring

**What you're building:** Understanding how users interact with your app.

**Add analytics:**
```bash
npm install @vercel/analytics
```

Update `src/main.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

// Add to render:
<Analytics />
```

**Track important events:**
- User signups
- Event creations
- Calendar imports
- Booking requests
- Errors

---

### Step 4.11: Final Testing & Bug Fixes

**What you're building:** Ensuring everything works smoothly.

**Testing checklist:**
- [ ] Sign up and log in work
- [ ] Create, edit, delete events
- [ ] Drag and drop works on desktop
- [ ] Drag and drop works on mobile/tablet
- [ ] Import from all three calendar sources
- [ ] Export to external calendars
- [ ] Scheduling links generate correctly
- [ ] Booking requests can be accepted/declined
- [ ] Calendar sharing shows only busy/free
- [ ] Multi-person overlay works
- [ ] PDF parsing extracts events
- [ ] Recurring events create properly
- [ ] Timezone conversion is accurate
- [ ] Settings save correctly
- [ ] App works offline (graceful degradation)
- [ ] All buttons have hover states
- [ ] No console errors
- [ ] Mobile layout looks good

---

### Step 4.12: Documentation & Help Center

**What you're building:** User guides and FAQs.

**Create help pages:**
- Getting Started Guide
- How to Import Calendars
- How to Create Scheduling Links
- How to Share Your Calendar
- Keyboard Shortcuts
- FAQ
- Privacy Policy
- Terms of Service

**Add help button:**
- In app header
- Links to help modal/page
- Search functionality
- Video tutorials (optional)

---

## Phase 4 Complete! ✅

You now have:
- ✅ Multi-timezone support
- ✅ Mobile-responsive design
- ✅ Performance optimizations
- ✅ User settings and preferences
- ✅ Ditto mascot branding
- ✅ User onboarding flow
- ✅ Error handling and feedback
- ✅ Accessibility improvements
- ✅ Security enhancements
- ✅ Analytics and monitoring
- ✅ Comprehensive testing
- ✅ Documentation and help center

---

## 🎉 Project Complete!

You've built a fully-functional, production-ready calendar management tool with:

**Core Features:**
- Beautiful, interactive calendar interface
- Drag-and-drop event manipulation
- Import from Google, Outlook, and Apple Calendar
- Export back to external calendars
- PDF calendar parsing with AI

**Collaboration:**
- Scheduling links with custom availability
- Calendar sharing (privacy-focused)
- Multi-person availability overlay
- Meeting request system

**Advanced Features:**
- Recurring events
- Smart time suggestions
- Multi-timezone support
- Custom categories and colors

**Polish:**
- Mobile-optimized
- Accessible
- Secure
- Fast and performant
- Comprehensive onboarding
- Helpful documentation

---

## Next Steps

**Ongoing maintenance:**
1. Monitor analytics for usage patterns
2. Fix bugs as they're reported
3. Gather user feedback
4. Prioritize feature requests
5. Keep dependencies updated
6. Regular security audits

**Potential future enhancements:**
- Team workspaces
- Calendar templates
- Integration with Zoom/Teams for video calls
- Calendar widgets for websites
- Mobile native apps (iOS/Android)
- Browser extension
- Email reminders (opt-in)
- Calendar insights and reports

---

## Development Commands Reference

**Start development server:**
```bash
cd /workspaces/calendar-modular/calendar-modular-app
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Install new package:**
```bash
npm install package-name
```

**Update all packages:**
```bash
npm update
```

**Git workflow:**
```bash
git add .
git commit -m "feat: description of change"
git push origin main
```

---

## Troubleshooting Common Issues

**Issue: "Cannot find module" errors**
- Solution: Run `npm install` to reinstall dependencies

**Issue: Supabase connection fails**
- Solution: Check `.env.local` has correct URL and key
- Verify Supabase project is running in dashboard

**Issue: Google/Outlook import not working**
- Solution: Verify OAuth credentials are correct
- Check redirect URLs match exactly
- Ensure APIs are enabled in respective consoles

**Issue: Events not saving**
- Solution: Check Supabase RLS policies are correct
- Verify user is authenticated
- Check browser console for errors

**Issue: Drag and drop not working**
- Solution: Ensure `@dnd-kit` is installed
- Check that event handlers are properly attached
- Verify calendar has `resizable` prop

**Issue: Vercel deployment fails**
- Solution: Check build logs for specific errors
- Verify environment variables are set
- Ensure `vercel.json` is configured correctly

---

## Resources

**Documentation:**
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [React Big Calendar](https://jquense.github.io/react-big-calendar/examples/index.html)
- [DND Kit](https://dndkit.com)

**APIs:**
- [Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
- [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/resources/calendar)
- [Google Gemini API](https://ai.google.dev/docs)

**Community:**
- [Supabase Discord](https://discord.supabase.com)
- [React Discord](https://discord.gg/react)
- [GitHub Discussions](https://github.com/sheethalmjacob/calendar-modular/discussions)
