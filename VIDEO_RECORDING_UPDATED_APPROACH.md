# Video Recording - Updated Implementation Approach

## ✅ Changes Completed (2026-02-02)

Based on user feedback, the video recording feature has been restructured to use a **study-level interview mode** instead of per-question configuration.

---

## Architecture Change

### ❌ Previous Approach (Reverted)
- Per-question response mode: voice | text | screen | **video**
- Camera configuration at study flow level
- VideoConfigPanel in study flow step

### ✅ New Approach (Implemented)
- **Study-level interview mode**: "Voice Interview" or "Video Interview"
- Camera requirement only shown when "Video Interview" is selected
- Interview mode applies to **entire interview** (not per-question)
- Simple UI: Welcome Screen → Interview Mode Selection → Study Flow

---

## Database Schema

### New Migration Applied

**Migration:** `add_interview_mode`

```sql
ALTER TABLE studies
ADD COLUMN interview_mode TEXT DEFAULT 'voice'
  CHECK (interview_mode IN ('voice', 'video'));
```

**Fields in `studies` table:**
- `interview_mode`: 'voice' | 'video' (default: 'voice')
- `camera_required`: boolean (only applies when interview_mode = 'video')

**Constraint Reverted:**
```sql
-- flow_items.response_mode now excludes 'video'
CHECK (response_mode IN ('voice', 'text', 'screen'))
```

---

## TypeScript Type Updates

### ✅ Updated Types

**`src/lib/types/database.ts`:**
```typescript
export interface Study {
  // ...
  interview_mode: 'voice' | 'video';
  camera_required: boolean; // Only applies when interview_mode='video'
  // ...
}

export interface FlowItem {
  // ...
  response_mode: 'voice' | 'text' | 'screen' | null; // 'video' removed
  // ...
}
```

**`src/lib/types/study-flow.ts`:**
```typescript
// RESPONSE_MODES reverted to exclude 'video'
export const RESPONSE_MODES = ['voice', 'text', 'screen'] as const;

// All item response modes reverted:
OpenEndedItem: responseMode: 'voice' | 'text'
SingleSelectItem: responseMode: 'screen' | 'voice'
MultiSelectItem: responseMode: 'screen' | 'voice'
RatingScaleItem: responseMode: 'screen' | 'voice'
```

---

## UI Components

### ✅ New Component Created

**`src/components/features/study-flow-builder/interview-mode-selector.tsx`**

Two-choice card selector:

1. **Voice Interview**
   - Icon: Microphone
   - Description: "Participants respond by speaking. Audio is recorded and transcribed."

2. **Video Interview**
   - Icon: Video camera
   - Description: "Participants respond with video. Enables reel creation across responses."
   - **When selected** → Shows camera requirement toggle:
     - "Require camera to be always on"
     - Toggle: Required (interview pauses if off) vs Optional (can turn off)
     - Info: Video defaults to 720p, 30min max

### ✅ Modified Components

**`src/components/features/study-flow-builder/index.tsx`:**
- Added `InterviewModeSelector` import
- Added handlers:
  - `handleInterviewModeChange` → Updates `studies.interview_mode`
  - `handleCameraRequiredChange` → Updates `studies.camera_required`
- Rendered between Welcome Screen and Sections:
  ```tsx
  <WelcomeScreenEditor ... />
  <InterviewModeSelector ... />
  <DndContext> {/* Sections */}
  ```

**`src/components/features/study-wizard/steps/study-flow-step.tsx`:**
- **Removed** `VideoConfigPanel` import and render
- **Reverted** to original structure (no video config at this level)

**`src/components/features/study-flow-builder/question-editors/open-ended-editor.tsx`:**
- **Removed** `Video` icon import
- **Removed** video option from response mode popover
- **Reverted** to original two options: Voice and Text

---

## User Flow

### Study Creation Wizard - Step 2 (Study Flow)

1. **Welcome Screen**
   - "Welcome Screen" card
   - Textarea: Welcome message

2. **Interview Mode Selection** ⭐ NEW
   - "Interview Mode" card (required)
   - Two cards to choose from:
     - Voice Interview (mic icon)
     - Video Interview (camera icon)
   - **IF Video selected:**
     - Camera settings section appears below
     - Toggle: "Require camera to be always on"
     - Info alert about video quality and duration

3. **Study Flow Builder**
   - Sections and questions
   - Questions have voice/text response modes only
   - No per-question video option

---

## Behavior

### Interview Mode: Voice
- All questions use voice or text responses
- No camera permission requested
- Existing voice interview flow unchanged

### Interview Mode: Video
- **Camera Required = ON:**
  - Camera permission requested at interview start
  - Screen out participants who deny camera
  - Interview pauses if camera turned off during recording
  - Camera monitor actively watches for disconnection

- **Camera Required = OFF:**
  - Camera permission requested but optional
  - Allow interview to proceed if camera denied
  - Show warning: "Camera off - only audio recorded"
  - No camera monitoring during interview

### Recording Behavior (Video Mode)
- All questions record video (not just specific ones)
- Video chunks stream to backend every 3 seconds
- Timestamps tagged for reel creation (answer start/end)
- 30-minute max duration per response
- Quality: 720p default, adaptive fallback (480p/360p)

---

## Files Changed

### ✅ Database Migrations (2 new)
1. `add_interview_mode` - Added interview_mode column
2. `revert_video_response_mode` - Removed 'video' from constraint

### ✅ Created Files (1)
1. `src/components/features/study-flow-builder/interview-mode-selector.tsx`

### ✅ Modified Files (5)
1. `src/lib/types/database.ts` - Added interview_mode, reverted response_mode
2. `src/lib/types/study-flow.ts` - Reverted RESPONSE_MODES
3. `src/components/features/study-flow-builder/index.tsx` - Added interview mode selector
4. `src/components/features/study-wizard/steps/study-flow-step.tsx` - Removed VideoConfigPanel
5. `src/components/features/study-flow-builder/question-editors/open-ended-editor.tsx` - Removed video option

### ❌ Deleted Functionality
- `VideoConfigPanel` component (no longer used)
- Per-question video response mode option

---

## Database Status

### ✅ Migrations Applied

```bash
Migration: add_interview_mode ✅
Migration: revert_video_response_mode ✅
```

**Current Schema:**
- `studies.interview_mode` = 'voice' (default) | 'video' ✅
- `studies.camera_required` = false (default) ✅
- `flow_items.response_mode` constraint = ('voice', 'text', 'screen') ✅

---

## Testing Checklist

### Study Creation
- [ ] Open Study Wizard → Step 2 (Study Flow)
- [ ] See Welcome Screen editor
- [ ] See Interview Mode selector with Voice/Video cards
- [ ] Select "Voice Interview" → No camera settings shown
- [ ] Select "Video Interview" → Camera settings appear below
- [ ] Toggle camera requirement → Verify description updates
- [ ] Save study → Verify `interview_mode` and `camera_required` saved to database

### Question Editor
- [ ] Open question (open-ended, single-select, etc.)
- [ ] Check response mode options
- [ ] Verify "Video" option is NOT present
- [ ] Verify only Voice/Text (or Screen/Voice) options available

### Database Verification
```sql
-- Check interview_mode column exists
SELECT interview_mode, camera_required
FROM studies
LIMIT 5;

-- Check response_mode constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'flow_items_response_mode_check';
```

---

## Next Steps

### Priority 1: Test UI
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to study wizard
- [ ] Test interview mode selection
- [ ] Verify camera settings toggle

### Priority 2: Interview Flow Integration (Phase 6)
Now that the study-level interview mode is set, integrate the VideoRecorder component into the participant interview flow:

1. Check `interview_mode` at interview start
2. **IF interview_mode = 'voice':**
   - Use existing voice recorder
   - Request microphone only
3. **IF interview_mode = 'video':**
   - Use VideoRecorder component
   - Request camera + microphone
   - Check `camera_required` setting
   - Show/hide camera monitoring accordingly

### Priority 3: Complete Phase 8 (Edge Cases)
- Browser compatibility checks
- Offline handling
- Mobile constraints
- Error recovery

---

## Summary

✅ **Completed:**
- Study-level interview mode selection (Voice vs Video)
- Camera requirement toggle (only for video mode)
- Database schema updated
- TypeScript types updated
- UI components created and integrated
- Per-question video option removed

⏳ **Remaining:**
- Phase 6: Participant interview flow integration
- Phase 8: Edge case handling
- End-to-end testing

**Architecture:** Clean separation between study configuration (wizard) and interview execution (participant flow). Interview mode is now a top-level study setting that determines the entire interview experience.
