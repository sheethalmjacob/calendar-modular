# Calendar Modular

## What We're Building

**Calendar Modular is a schedule planning sandbox for college students.** Upload your class schedule PDF, experiment with different schedule layouts, and export the perfect combination to your real calendar.

### The Problem
You get a PDF of available class sections with dozens of time options. Building your ideal schedule means:
- Manually checking each time slot
- Trying to visualize how classes fit with your personal commitments
- Endless back-and-forth between the PDF and your calendar app
- No easy way to experiment with "what if" scenarios

### The Solution
Calendar Modular turns schedule planning into a visual, interactive experience:

1. **Upload your PDF class schedule** → AI extracts all class options as visual time blocks
2. **Browse the class catalog** → See every section with times displayed on a calendar
3. **Hide/unhide classes** → Pick which sections you want, hide the rest
4. **Add personal events** → Drag study time, work, gym, etc. around the fixed class blocks
5. **Experiment freely** → Try different combinations until your schedule feels right
6. **Export when ready** → Send your finalized schedule to Google Calendar, Outlook, or Apple Calendar
7. **Make changes anytime** → The app maintains a connection so you can come back and adjust

### Key Features

**📄 PDF-First Workflow**
- Upload class schedules from your university
- AI-powered extraction using Google Gemini
- Automatic parsing of class names, times, locations, and instructors

**🧩 Class Catalog Browser**
- See all extracted classes in a searchable catalog
- Hide/unhide specific sections to test different combinations
- Fixed time blocks (can't be moved—they're set by the university)
- Hidden classes are removed when you finalize your schedule

**✨ Schedule Planning Canvas**
- Week view showing your selected classes
- Drag-and-drop personal events around fixed class times
- Visual overlap warnings (won't let you double-book)
- 15-minute snap increments for precise scheduling
- Color-coded blocks (classes vs. personal events)

**🔄 Flexible Experimentation**
- One working canvas where you can adjust until satisfied
- Compare your existing calendar with new class options
- Import from Google Calendar, Outlook, or Apple Calendar to see current commitments
- Try different schedule layouts before committing

**📤 Smart Export**
- Export finalized schedule to your real calendar (Google/Outlook/Apple)
- Maintains connection for future edits
- Warns before overwriting existing events
- Only exports visible (unhidden) classes and personal events

**🤝 Collaboration Features** (Phase 2)
- Share your availability with study groups
- Find common free time with classmates
- Generate scheduling links for office hours or tutoring

Think of it as a **schedule design studio**—where you build and perfect your semester schedule before making it real.

## Core Requirements
- Desktop-optimized web application (mobile support in Phase 4)
- Laptop-friendly interface for students planning schedules

## Primary Workflow: PDF → Plan → Export

### 1. PDF Upload & Extraction
- Upload college class schedule PDFs
- AI-powered parsing with Google Gemini (free tier)
- Extracts: course names, section numbers, times, days, locations, instructors
- Creates visual time blocks on calendar
- Initial target: standardized university schedule formats

### 2. Class Catalog Management
- Searchable/filterable catalog of all extracted classes
- Hide/unhide individual class sections
- Hidden classes removed from view but available to re-add
- When finalized, hidden classes are permanently deleted
- Visible classes marked as "fixed" (time cannot be changed)

### 3. Schedule Planning Canvas
- **Fixed Blocks**: PDF-imported classes (locked at university-set times)
- **Flexible Blocks**: Personal events (draggable anywhere)
- Visual distinction between fixed and flexible events
- Drag-and-drop for personal commitments (study, work, gym, meals)
- Overlap detection with warnings before saving
- One working canvas (not multiple draft versions)

### 4. Calendar Import for Context
- Import existing events from Google Calendar, Outlook, or Apple Calendar
- Shows current commitments alongside new class options
- Helps visualize schedule conflicts
- Imported events are flexible (can be moved)

### 5. Export to Real Calendar
- Export finalized schedule to Google/Outlook/Apple Calendar
- Maintains connection for future edits (not one-time export)
- User can return to planning canvas and re-export updates
- Smart conflict detection during export

## Event Manipulation & UI

### Fixed Blocks (PDF-Imported Classes)
- Display at university-specified times
- Cannot be dragged to different times
- Can be hidden/unhidden from class catalog
- Visual styling indicates "locked" status
- Color-coded by department or category

### Flexible Blocks (Personal Events)
- Fully draggable and resizable
- Snap to 15-minute increments
- Can overlap with warnings (user decides)
- Create new events by clicking empty time slots
- Edit title, time, duration, description, location

### UI Features
- Week view as default (switchable to day/month)
- Clean, student-friendly interface
- Class catalog sidebar for browsing available sections
- Overlap warnings before finalizing
- Undo/redo for changes
- Quirky Ditto mascot character throughout

## Scheduling & Collaboration (Phase 2)
- Generate scheduling links for study groups
- Share availability with classmates (busy/free view only)
- Find common free time with multiple people
- Meeting request system for group projects

## Sharing & Privacy
- Shared calendars show only busy/free time blocks (no event details)
- Request-based calendar overlay (requires approval)
- Shareable links for scheduling (user pre-defines available times)

## Export & Integration
- Export to Google Calendar, Outlook, Apple Calendar
- Maintained connection (can re-export after changes)
- Duplicate detection (won't create duplicate events)
- Option to update existing events vs. create new ones

## UI Requirements
- Clean, minimalist design optimized for students
- Quirky Ditto (Pokémon) mascot as visual identity
- Desktop-first (mobile-responsive in Phase 4)
- Accessible and keyboard-navigable