// ============================================
// ONE STOP LIFE TRACKER - Personal Dashboard
// ============================================

const { useState, useEffect, useMemo, useCallback } = React;

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateFull = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTime = (time) => {
  if (!time) return '';
  return time;
};

const getWeekNumber = (date, termStart) => {
  const d = new Date(date);
  const start = termStart ? new Date(termStart) : new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - start) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
};

const getTermWeekNumber = (date, termStart) => {
  if (!termStart) return getWeekNumber(date);
  const d = new Date(date);
  const start = new Date(termStart);
  const days = Math.floor((d - start) / (24 * 60 * 60 * 1000));
  return Math.max(1, Math.ceil((days + 1) / 7));
};

const isToday = (date) => {
  if (!date) return false;
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

const isThisWeek = (date) => {
  if (!date) return false;
  const today = new Date();
  const d = new Date(date);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return d >= weekStart && d < weekEnd;
};

const isNext7Days = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  const next7 = new Date(today);
  next7.setDate(today.getDate() + 7);
  return d >= today && d < next7;
};

const isPastDue = (date) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
};

const parseDate = (dateStr) => {
  // Parse various date formats: "Sep 12", "September 12", "9/12", "12 Sep", "2026-01-15"
  if (!dateStr) return null;

  const currentYear = new Date().getFullYear();

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }

  // Month Day format: "Sep 12", "September 12"
  const monthDayMatch = dateStr.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})/i);
  if (monthDayMatch) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const month = months[monthDayMatch[1].toLowerCase().substring(0, 3)];
    const day = monthDayMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  // MM/DD format: "9/12"
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, '0');
    const day = slashMatch[2].padStart(2, '0');
    return `${currentYear}-${month}-${day}`;
  }

  // Day Month format: "12 Sep"
  const dayMonthMatch = dateStr.match(/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
  if (dayMonthMatch) {
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const day = dayMonthMatch[1].padStart(2, '0');
    const month = months[dayMonthMatch[2].toLowerCase().substring(0, 3)];
    return `${currentYear}-${month}-${day}`;
  }

  return null;
};

const parseSyllabusText = (text, courseId) => {
  const lines = text.split('\n').filter(line => line.trim());
  const items = [];

  // Assignment keywords
  const assignmentKeywords = /\b(assignment|problem\s*set|ps\d*|homework|hw|quiz|midterm|final|exam|project|paper|essay|lab|reading|due|submit)\b/i;
  const datePattern = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
  const weekPattern = /Week\s*(\d+)/i;

  let currentWeek = null;

  lines.forEach((line, index) => {
    // Check for week header
    const weekMatch = line.match(weekPattern);
    if (weekMatch) {
      currentWeek = parseInt(weekMatch[1]);
      return;
    }

    // Check if line contains assignment keywords and dates
    if (assignmentKeywords.test(line)) {
      const dateMatch = line.match(datePattern);
      const parsedDate = dateMatch ? parseDate(dateMatch[0]) : null;

      // Extract title (try to get meaningful part)
      let title = line.trim();
      // Remove date from title
      if (dateMatch) {
        title = title.replace(dateMatch[0], '').trim();
      }
      // Clean up title
      title = title.replace(/^\W+|\W+$/g, '').trim();
      if (title.length > 100) title = title.substring(0, 100) + '...';

      if (title) {
        items.push({
          id: generateId(),
          title,
          type: 'Syllabus Assignment',
          courseId,
          category: 'Class',
          dueDate: parsedDate || '',
          dueTime: '23:59',
          status: 'Not started',
          completed: false,
          notes: '',
          source: 'Syllabus',
          weekNumber: currentWeek,
          confidence: parsedDate ? 'High' : 'Low',
          originalLine: line.trim(),
          approved: false
        });
      }
    }
  });

  return items;
};

// Default data
const defaultCourses = [
  { id: '1', name: 'Machine Learning', term: 'Spring 2026', color: '#6366f1', links: '' },
  { id: '2', name: 'AI Safety', term: 'Spring 2026', color: '#10b981', links: '' },
  { id: '3', name: 'Econometrics', term: 'Spring 2026', color: '#f59e0b', links: '' },
];

const defaultItems = [
  { id: '1', title: 'Problem Set 3', type: 'Syllabus Assignment', courseId: '1', category: 'Class', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], dueTime: '23:59', status: 'Not started', completed: false, notes: '', source: 'Syllabus' },
  { id: '2', title: 'Reading: Alignment Tax Paper', type: 'Reading', courseId: '2', category: 'Class', dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], dueTime: '14:00', status: 'In progress', completed: false, notes: '', source: 'Syllabus' },
  { id: '3', title: 'Weekly MATS Update', type: 'Manual Todo', courseId: null, category: 'MATS', dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], dueTime: '17:00', status: 'Not started', completed: false, notes: 'Update Steven and Girish on Fault Line progress', source: 'Manual' },
];

const defaultJobApplications = [
  { id: '1', company: 'Anthropic', status: 'Interviewing', role: 'Research Scientist', salary: '$180,000', dateSubmitted: '2026-01-10', link: 'https://anthropic.com/careers', referral: 'Internal contact', reachedOut: true, rejectionReason: '', notes: 'Great culture fit' },
  { id: '2', company: 'OpenAI', status: 'Submitted - Pending Response', role: 'AI Safety Researcher', salary: '$200,000', dateSubmitted: '2026-01-15', link: 'https://openai.com/careers', referral: '', reachedOut: false, rejectionReason: '', notes: '' },
];

const defaultReminders = [
  { id: '1', title: 'Change toothbrush', frequency: 'quarterly', lastCompleted: '2025-10-20', nextDue: '2026-01-20', notes: '' },
  { id: '2', title: 'Review investment portfolio', frequency: 'monthly', lastCompleted: '2025-12-20', nextDue: '2026-01-20', notes: '' },
];

const defaultCalendarEvents = [
  { id: '1', title: 'ML Lecture', calendar: 'Columbia', start: '10:00', end: '11:30', date: new Date().toISOString().split('T')[0] },
  { id: '2', title: 'MATS Sync', calendar: 'Personal', start: '14:00', end: '15:00', date: new Date().toISOString().split('T')[0] },
  { id: '3', title: 'Office Hours', calendar: 'Columbia', start: '16:00', end: '17:00', date: new Date().toISOString().split('T')[0] },
];

const defaultSettings = {
  termStart: '2026-01-13',
  termEnd: '2026-05-15',
  termName: 'Spring 2026',
  defaultDueTime: '23:59',
  googleCalendarPersonal: '',
  googleCalendarColumbia: '',
  calendarEmbedUrl: '',
  githubGistId: '',
  githubToken: '',
  lastSyncTime: null,
  autoSync: false,
};

// GitHub Gist API helpers
const GistSync = {
  async save(token, gistId, data) {
    const url = gistId
      ? `https://api.github.com/gists/${gistId}`
      : 'https://api.github.com/gists';

    const response = await fetch(url, {
      method: gistId ? 'PATCH' : 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: 'Life Tracker Data Backup',
        public: false,
        files: {
          'life-tracker-data.json': {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    return response.json();
  },

  async load(token, gistId) {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const gist = await response.json();
    const content = gist.files['life-tracker-data.json']?.content;

    if (!content) {
      throw new Error('No data file found in gist');
    }

    return JSON.parse(content);
  }
};

// Application Status Options
const APPLICATION_STATUSES = [
  'Have Not Applied',
  'Submitted - Pending Response',
  'Rejected',
  'Interviewing',
  'Offer Extended - In Progress',
  'Job Rec Removed/Deactivated',
  'Ghosted',
  'Offer Extended - Did Not Accept',
  'Re-Applied With Updated Resume',
  'Rescinded Application (Self)',
  'Not For Me',
  'Sent Follow Up Email',
  'N/A'
];

const STATUS_COLORS = {
  'Have Not Applied': '#6b7280',
  'Submitted - Pending Response': '#3b82f6',
  'Rejected': '#ef4444',
  'Interviewing': '#8b5cf6',
  'Offer Extended - In Progress': '#10b981',
  'Job Rec Removed/Deactivated': '#9ca3af',
  'Ghosted': '#f59e0b',
  'Offer Extended - Did Not Accept': '#6366f1',
  'Re-Applied With Updated Resume': '#06b6d4',
  'Rescinded Application (Self)': '#78716c',
  'Not For Me': '#d1d5db',
  'Sent Follow Up Email': '#14b8a6',
  'N/A': '#e5e7eb'
};

// CSS Styles
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg-primary: #0a0a0b;
    --bg-secondary: #121214;
    --bg-tertiary: #1a1a1d;
    --bg-hover: #222225;
    --border-color: #2a2a2e;
    --border-light: #3a3a3e;
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent-primary: #6366f1;
    --accent-green: #10b981;
    --accent-amber: #f59e0b;
    --accent-red: #ef4444;
    --accent-blue: #3b82f6;
    --accent-purple: #8b5cf6;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 24px rgba(0,0,0,0.5);
    --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
  }

  .app-container {
    display: flex;
    min-height: 100vh;
  }

  /* Sidebar */
  .sidebar {
    width: 240px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    z-index: 100;
  }

  .logo {
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .logo-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 32px;
  }

  .nav-section {
    margin-bottom: 24px;
  }

  .nav-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-bottom: 12px;
    padding-left: 12px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: var(--transition);
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--accent-primary);
    color: white;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    opacity: 0.8;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 240px;
    padding: 32px 40px;
    min-height: 100vh;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .page-subtitle {
    font-size: 14px;
    color: var(--text-muted);
  }

  /* Cards */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .card-subtitle {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  /* Grid Layouts */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  /* Calendar Events */
  .event-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    transition: var(--transition);
  }

  .event-item:hover {
    background: var(--bg-hover);
  }

  .event-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
    min-width: 100px;
  }

  .event-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    flex: 1;
  }

  .event-calendar {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 500;
  }

  .event-calendar.columbia {
    background: rgba(99, 102, 241, 0.15);
    color: var(--accent-primary);
  }

  .event-calendar.personal {
    background: rgba(16, 185, 129, 0.15);
    color: var(--accent-green);
  }

  /* Task Items */
  .task-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    transition: var(--transition);
    border-left: 3px solid transparent;
  }

  .task-item:hover {
    background: var(--bg-hover);
  }

  .task-item.completed {
    background: rgba(16, 185, 129, 0.1);
    border-left-color: var(--accent-green);
  }

  .task-item.completed .task-title {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .task-item.overdue {
    border-left-color: var(--accent-red);
  }

  .task-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-light);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition);
    flex-shrink: 0;
  }

  .task-checkbox:hover {
    border-color: var(--accent-primary);
  }

  .task-checkbox.checked {
    background: var(--accent-green);
    border-color: var(--accent-green);
  }

  .task-checkbox.checked::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  .task-content {
    flex: 1;
    min-width: 0;
  }

  .task-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .task-course {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .course-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .task-due {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
  }

  .task-due.overdue {
    color: var(--accent-red);
    font-weight: 500;
  }

  /* Category Tags */
  .category-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .category-tag.class { background: rgba(99, 102, 241, 0.15); color: var(--accent-primary); }
  .category-tag.mats { background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); }
  .category-tag.personal { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
  .category-tag.admin { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
  .category-tag.health { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); }

  /* Confidence Tags */
  .confidence-tag {
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .confidence-tag.high { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); }
  .confidence-tag.medium { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
  .confidence-tag.low { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); }

  /* Weekly View */
  .weekly-view {
    width: 100%;
  }

  .week-section {
    margin-bottom: 32px;
  }

  .week-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
  }

  .week-number {
    font-size: 14px;
    font-weight: 600;
    color: var(--accent-primary);
    background: rgba(99, 102, 241, 0.1);
    padding: 4px 12px;
    border-radius: 6px;
  }

  .week-dates {
    font-size: 13px;
    color: var(--text-muted);
  }

  .weekly-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 4px;
  }

  .weekly-table th {
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .weekly-table td {
    padding: 12px;
    background: var(--bg-tertiary);
    font-size: 14px;
  }

  .weekly-table tr:hover td {
    background: var(--bg-hover);
  }

  .weekly-table tr.completed td {
    background: rgba(16, 185, 129, 0.1);
  }

  .weekly-table tr.completed .assignment-title {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .weekly-table td:first-child {
    border-radius: 8px 0 0 8px;
  }

  .weekly-table td:last-child {
    border-radius: 0 8px 8px 0;
  }

  /* Job Applications Table */
  .job-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 4px;
  }

  .job-table th {
    text-align: left;
    padding: 12px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    border-bottom: 1px solid var(--border-color);
  }

  .job-table td {
    padding: 16px 12px;
    background: var(--bg-tertiary);
    font-size: 14px;
    vertical-align: middle;
  }

  .job-table tr:hover td {
    background: var(--bg-hover);
  }

  .job-table td:first-child {
    border-radius: 8px 0 0 8px;
  }

  .job-table td:last-child {
    border-radius: 0 8px 8px 0;
  }

  .company-name {
    font-weight: 600;
    color: var(--text-primary);
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
  }

  .job-link {
    color: var(--accent-primary);
    text-decoration: none;
    transition: var(--transition);
  }

  .job-link:hover {
    text-decoration: underline;
  }

  /* Reminders */
  .reminder-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-tertiary);
    border-radius: 8px;
    margin-bottom: 8px;
    transition: var(--transition);
  }

  .reminder-item:hover {
    background: var(--bg-hover);
  }

  .reminder-icon {
    width: 40px;
    height: 40px;
    background: rgba(245, 158, 11, 0.15);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .reminder-content {
    flex: 1;
  }

  .reminder-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .reminder-meta {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }

  .reminder-due {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
  }

  .reminder-due.today {
    color: var(--accent-amber);
    font-weight: 500;
  }

  .reminder-due.overdue {
    color: var(--accent-red);
    font-weight: 500;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    border: none;
    font-family: inherit;
  }

  .btn-primary {
    background: var(--accent-primary);
    color: white;
  }

  .btn-primary:hover {
    background: #5558e3;
  }

  .btn-secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--border-light);
  }

  .btn-success {
    background: var(--accent-green);
    color: white;
  }

  .btn-success:hover {
    background: #0ea570;
  }

  .btn-danger {
    background: var(--accent-red);
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-icon {
    padding: 8px;
    border-radius: 6px;
  }

  /* Forms */
  .form-group {
    margin-bottom: 16px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }

  .form-input, .form-select, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
    transition: var(--transition);
  }

  .form-input:focus, .form-select:focus, .form-textarea:focus {
    outline: none;
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-help {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 24px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  .modal.modal-large {
    max-width: 800px;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--bg-tertiary);
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: var(--transition);
  }

  .modal-close:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-muted);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 14px;
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: var(--transition);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
  }

  .filter-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .filter-btn.active {
    background: var(--accent-primary);
    color: white;
    border-color: var(--accent-primary);
  }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
    font-family: 'JetBrains Mono', monospace;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Quick Add */
  .quick-add {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
  }

  .quick-add-input {
    flex: 1;
    padding: 12px 16px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    color: var(--text-primary);
    font-size: 14px;
    font-family: inherit;
  }

  .quick-add-input:focus {
    outline: none;
    border-color: var(--accent-primary);
  }

  .quick-add-input::placeholder {
    color: var(--text-muted);
  }

  /* Course Cards */
  .course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .course-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
  }

  .course-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  .course-card:hover {
    border-color: var(--border-light);
    box-shadow: var(--shadow-md);
  }

  .course-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .course-term {
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }

  .course-stats {
    display: flex;
    gap: 16px;
  }

  .course-stat {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .course-stat strong {
    color: var(--text-primary);
  }

  /* Delete button */
  .delete-btn {
    color: var(--text-muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--transition);
    opacity: 0;
  }

  .task-item:hover .delete-btn,
  .reminder-item:hover .delete-btn,
  tr:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--accent-red);
    background: rgba(239, 68, 68, 0.1);
  }

  /* Settings Section */
  .settings-section {
    margin-bottom: 32px;
  }

  .settings-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .settings-title::before {
    content: '';
    width: 4px;
    height: 16px;
    background: var(--accent-primary);
    border-radius: 2px;
  }

  .settings-description {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
    line-height: 1.6;
  }

  /* Import Preview */
  .import-preview {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  .import-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
    transition: var(--transition);
  }

  .import-item:last-child {
    border-bottom: none;
  }

  .import-item:hover {
    background: var(--bg-hover);
  }

  .import-item.selected {
    background: rgba(99, 102, 241, 0.1);
  }

  .import-item-content {
    flex: 1;
  }

  .import-item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 4px;
  }

  .import-item-meta {
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .import-item-original {
    font-size: 11px;
    color: var(--text-muted);
    font-style: italic;
    margin-top: 4px;
  }

  /* Calendar Embed */
  .calendar-embed-container {
    width: 100%;
    height: 600px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    background: var(--bg-tertiary);
  }

  .calendar-embed-container iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .calendar-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-muted);
    text-align: center;
    padding: 40px;
  }

  .calendar-placeholder-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .calendar-placeholder-text {
    font-size: 14px;
    max-width: 400px;
    line-height: 1.6;
  }

  /* Tabs */
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 4px;
  }

  .tab {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px 8px 0 0;
    transition: var(--transition);
    position: relative;
  }

  .tab:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .tab.active {
    color: var(--accent-primary);
    background: var(--bg-tertiary);
  }

  .tab.active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--accent-primary);
  }

  /* Alert */
  .alert {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .alert-info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: var(--accent-blue);
  }

  .alert-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: var(--accent-green);
  }

  .alert-warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: var(--accent-amber);
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-primary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--border-light);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .stats-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .sidebar {
      width: 60px;
      padding: 16px 8px;
    }

    .logo, .logo-subtitle, .nav-label {
      display: none;
    }

    .nav-item {
      justify-content: center;
      padding: 12px;
    }

    .nav-item span:not(.nav-icon) {
      display: none;
    }

    .main-content {
      margin-left: 60px;
      padding: 20px;
    }
  }
`;

// Icons as simple SVG components
const Icons = {
  Dashboard: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Calendar: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Book: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  Check: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  Briefcase: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Bell: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Settings: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Upload: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  External: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Cloud: () => (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  GitHub: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children, large }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${large ? 'modal-large' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Dashboard Page
const DashboardPage = ({ items, courses, reminders, calendarEvents, settings, toggleComplete, onAddItem }) => {
  const todayItems = items.filter(item => isToday(item.dueDate) && !item.completed);
  const thisWeekItems = items.filter(item => isThisWeek(item.dueDate) && !item.completed);
  const next7DaysItems = items.filter(item => isNext7Days(item.dueDate) && !item.completed);
  const overdueItems = items.filter(item => isPastDue(item.dueDate) && !item.completed);
  const todayReminders = reminders.filter(r => isToday(r.nextDue) || isPastDue(r.nextDue));

  const getCourse = (courseId) => courses.find(c => c.id === courseId);

  const todayEvents = calendarEvents.filter(e => e.date === new Date().toISOString().split('T')[0]).sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{formatDateFull(new Date())}</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{overdueItems.length}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{todayItems.length}</div>
          <div className="stat-label">Due Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{next7DaysItems.length}</div>
          <div className="stat-label">Next 7 Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{items.filter(i => i.completed).length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Today's Schedule</h3>
              <p className="card-subtitle">{todayEvents.length} events</p>
            </div>
          </div>
          <div className="event-list">
            {todayEvents.map(event => (
              <div key={event.id} className="event-item">
                <span className="event-time">{event.start} - {event.end}</span>
                <span className="event-title">{event.title}</span>
                <span className={`event-calendar ${event.calendar.toLowerCase()}`}>{event.calendar}</span>
              </div>
            ))}
            {todayEvents.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <p className="empty-text">No events scheduled for today</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Due Today</h3>
              <p className="card-subtitle">{todayItems.length + overdueItems.length + todayReminders.length} items</p>
            </div>
            <button className="btn btn-sm btn-secondary" onClick={onAddItem}>
              <Icons.Plus /> Add
            </button>
          </div>
          <div className="task-list">
            {[...overdueItems, ...todayItems].map(item => {
              const course = getCourse(item.courseId);
              return (
                <div key={item.id} className={`task-item ${item.completed ? 'completed' : ''} ${isPastDue(item.dueDate) ? 'overdue' : ''}`}>
                  <div
                    className={`task-checkbox ${item.completed ? 'checked' : ''}`}
                    onClick={() => toggleComplete(item.id)}
                  />
                  <div className="task-content">
                    <div className="task-title">{item.title}</div>
                    <div className="task-meta">
                      {course && (
                        <span className="task-course">
                          <span className="course-dot" style={{ background: course.color }} />
                          {course.name}
                        </span>
                      )}
                      <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                      <span className={`task-due ${isPastDue(item.dueDate) ? 'overdue' : ''}`}>
                        {isPastDue(item.dueDate) ? 'OVERDUE' : item.dueTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {todayReminders.map(reminder => (
              <div key={reminder.id} className="task-item">
                <div className="task-checkbox" />
                <div className="task-content">
                  <div className="task-title">🔔 {reminder.title}</div>
                  <div className="task-meta">
                    <span className="category-tag health">Reminder</span>
                    <span className={`task-due ${isPastDue(reminder.nextDue) ? 'overdue' : 'today'}`}>
                      {isPastDue(reminder.nextDue) ? 'OVERDUE' : 'Today'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {todayItems.length === 0 && overdueItems.length === 0 && todayReminders.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <p className="empty-text">All caught up!</p>
              </div>
            )}
          </div>
        </div>

        <div className="card full-width">
          <div className="card-header">
            <div>
              <h3 className="card-title">Next 7 Days</h3>
              <p className="card-subtitle">{next7DaysItems.length} items due</p>
            </div>
          </div>
          <div className="task-list">
            {next7DaysItems.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 10).map(item => {
              const course = getCourse(item.courseId);
              return (
                <div key={item.id} className={`task-item ${item.completed ? 'completed' : ''}`}>
                  <div
                    className={`task-checkbox ${item.completed ? 'checked' : ''}`}
                    onClick={() => toggleComplete(item.id)}
                  />
                  <div className="task-content">
                    <div className="task-title">{item.title}</div>
                    <div className="task-meta">
                      {course && (
                        <span className="task-course">
                          <span className="course-dot" style={{ background: course.color }} />
                          {course.name}
                        </span>
                      )}
                      <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                      <span className="task-due">{formatDate(item.dueDate)} at {item.dueTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {next7DaysItems.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p className="empty-text">Nothing due in the next 7 days!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Weekly View Page
const WeeklyViewPage = ({ items, courses, settings, toggleComplete, onAddItem, onDeleteItem }) => {
  const getCourse = (courseId) => courses.find(c => c.id === courseId);

  // Group items by week
  const groupedByWeek = useMemo(() => {
    const groups = {};
    items.filter(item => item.dueDate).forEach(item => {
      const weekNum = getTermWeekNumber(item.dueDate, settings.termStart);
      if (!groups[weekNum]) {
        groups[weekNum] = [];
      }
      groups[weekNum].push(item);
    });
    return groups;
  }, [items, settings.termStart]);

  const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => Number(a) - Number(b));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Weekly Assignments</h1>
          <p className="page-subtitle">All assignments organized by week • {settings.termName}</p>
        </div>
        <button className="btn btn-primary" onClick={onAddItem}>
          <Icons.Plus /> Add Assignment
        </button>
      </div>

      <div className="weekly-view">
        {sortedWeeks.map(weekNum => (
          <div key={weekNum} className="week-section">
            <div className="week-header">
              <span className="week-number">Week {weekNum}</span>
            </div>
            <table className="weekly-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Done</th>
                  <th style={{ width: '150px' }}>Subject</th>
                  <th>Assignment</th>
                  <th style={{ width: '100px' }}>Due Date</th>
                  <th style={{ width: '80px' }}>Time</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {groupedByWeek[weekNum].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).map(item => {
                  const course = getCourse(item.courseId);
                  return (
                    <tr key={item.id} className={item.completed ? 'completed' : ''}>
                      <td>
                        <div
                          className={`task-checkbox ${item.completed ? 'checked' : ''}`}
                          onClick={() => toggleComplete(item.id)}
                        />
                      </td>
                      <td>
                        {course ? (
                          <span className="task-course">
                            <span className="course-dot" style={{ background: course.color }} />
                            {course.name}
                          </span>
                        ) : (
                          <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                        )}
                      </td>
                      <td className="assignment-title">{item.title}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{formatDate(item.dueDate)}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: 'var(--text-muted)' }}>{item.dueTime || '-'}</td>
                      <td>
                        <button className="delete-btn" onClick={() => onDeleteItem(item.id)}>
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {sortedWeeks.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p className="empty-text">No assignments yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Classes Page
const ClassesPage = ({ courses, items, onAddCourse, onDeleteCourse }) => {
  const getCourseTasks = (courseId) => items.filter(i => i.courseId === courseId);
  const getCompletedCount = (courseId) => getCourseTasks(courseId).filter(i => i.completed).length;
  const getPendingCount = (courseId) => getCourseTasks(courseId).filter(i => !i.completed).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">{courses.length} courses this term</p>
        </div>
        <button className="btn btn-primary" onClick={onAddCourse}>
          <Icons.Plus /> Add Course
        </button>
      </div>

      <div className="course-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card" style={{ '--course-color': course.color }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: course.color }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className="course-name">{course.name}</h3>
                <p className="course-term">{course.term}</p>
              </div>
              <button className="delete-btn" style={{ opacity: 1 }} onClick={() => onDeleteCourse(course.id)}>
                <Icons.Trash />
              </button>
            </div>
            <div className="course-stats">
              <span className="course-stat"><strong>{getPendingCount(course.id)}</strong> pending</span>
              <span className="course-stat"><strong>{getCompletedCount(course.id)}</strong> completed</span>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <p className="empty-text">No courses added yet</p>
        </div>
      )}
    </div>
  );
};

// Todos Page
const TodosPage = ({ items, courses, toggleComplete, onAddItem, onDeleteItem }) => {
  const [filter, setFilter] = useState('All');
  const getCourse = (courseId) => courses.find(c => c.id === courseId);

  const categories = ['All', 'Class', 'MATS', 'Personal', 'Admin', 'Health'];

  const filteredItems = filter === 'All'
    ? items.filter(i => i.source === 'Manual')
    : items.filter(i => i.category === filter && i.source === 'Manual');

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Todos</h1>
          <p className="page-subtitle">Non-syllabus tasks and todos</p>
        </div>
        <button className="btn btn-primary" onClick={onAddItem}>
          <Icons.Plus /> Add Todo
        </button>
      </div>

      <div className="filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="task-list">
          {filteredItems.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
          }).map(item => {
            const course = getCourse(item.courseId);
            return (
              <div key={item.id} className={`task-item ${item.completed ? 'completed' : ''} ${isPastDue(item.dueDate) && !item.completed ? 'overdue' : ''}`}>
                <div
                  className={`task-checkbox ${item.completed ? 'checked' : ''}`}
                  onClick={() => toggleComplete(item.id)}
                />
                <div className="task-content">
                  <div className="task-title">{item.title}</div>
                  <div className="task-meta">
                    {course && (
                      <span className="task-course">
                        <span className="course-dot" style={{ background: course.color }} />
                        {course.name}
                      </span>
                    )}
                    <span className={`category-tag ${item.category.toLowerCase()}`}>{item.category}</span>
                    {item.dueDate && (
                      <span className={`task-due ${isPastDue(item.dueDate) && !item.completed ? 'overdue' : ''}`}>
                        {formatDate(item.dueDate)} {item.dueTime && `at ${item.dueTime}`}
                      </span>
                    )}
                  </div>
                </div>
                <button className="delete-btn" onClick={() => onDeleteItem(item.id)}>
                  <Icons.Trash />
                </button>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p className="empty-text">No todos in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Job Applications Page
const JobApplicationsPage = ({ applications, onAdd, onUpdate, onDelete }) => {
  const [filter, setFilter] = useState('All');

  const filters = ['All', 'Active Pipeline', 'Needs Outreach', 'Interviewing', 'Pending'];

  const filteredApps = useMemo(() => {
    if (filter === 'All') return applications;
    if (filter === 'Active Pipeline') return applications.filter(a =>
      ['Submitted - Pending Response', 'Interviewing', 'Offer Extended - In Progress'].includes(a.status)
    );
    if (filter === 'Needs Outreach') return applications.filter(a =>
      !a.reachedOut && ['Submitted - Pending Response', 'Interviewing'].includes(a.status)
    );
    if (filter === 'Interviewing') return applications.filter(a => a.status === 'Interviewing');
    if (filter === 'Pending') return applications.filter(a => a.status === 'Submitted - Pending Response');
    return applications;
  }, [applications, filter]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Job Applications</h1>
          <p className="page-subtitle">{applications.length} total applications</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <Icons.Plus /> Add Application
        </button>
      </div>

      <div className="filters">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="job-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Salary</th>
                <th>Submitted</th>
                <th>Referral</th>
                <th>Reached Out</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map(app => (
                <tr key={app.id}>
                  <td className="company-name">{app.company}</td>
                  <td>{app.role}</td>
                  <td>
                    <select
                      value={app.status}
                      onChange={(e) => onUpdate(app.id, { status: e.target.value })}
                      className="form-select"
                      style={{
                        width: 'auto',
                        padding: '4px 8px',
                        background: STATUS_COLORS[app.status] + '22',
                        borderColor: STATUS_COLORS[app.status],
                        color: STATUS_COLORS[app.status],
                        fontWeight: 500,
                        fontSize: '12px'
                      }}
                    >
                      {APPLICATION_STATUSES.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{app.salary || '-'}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{formatDate(app.dateSubmitted)}</td>
                  <td>{app.referral || '-'}</td>
                  <td>
                    <div
                      className={`task-checkbox ${app.reachedOut ? 'checked' : ''}`}
                      onClick={() => onUpdate(app.id, { reachedOut: !app.reachedOut })}
                    />
                  </td>
                  <td>
                    {app.link && (
                      <a href={app.link} target="_blank" rel="noopener noreferrer" className="job-link">
                        <Icons.External /> View
                      </a>
                    )}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => onDelete(app.id)}>
                      <Icons.Trash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredApps.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <p className="empty-text">No applications match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Reminders Page
const RemindersPage = ({ reminders, onAdd, onComplete, onDelete }) => {
  const frequencyLabels = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Every 3 months',
    yearly: 'Yearly'
  };

  const sortedReminders = [...reminders].sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue));

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">{reminders.length} recurring reminders</p>
        </div>
        <button className="btn btn-primary" onClick={onAdd}>
          <Icons.Plus /> Add Reminder
        </button>
      </div>

      <div className="card">
        {sortedReminders.map(reminder => (
          <div key={reminder.id} className="reminder-item">
            <div className="reminder-icon">🔔</div>
            <div className="reminder-content">
              <div className="reminder-title">{reminder.title}</div>
              <div className="reminder-meta">{frequencyLabels[reminder.frequency]}</div>
            </div>
            <div className={`reminder-due ${isToday(reminder.nextDue) ? 'today' : ''} ${isPastDue(reminder.nextDue) ? 'overdue' : ''}`}>
              {isPastDue(reminder.nextDue) ? 'Overdue' : isToday(reminder.nextDue) ? 'Today' : formatDate(reminder.nextDue)}
            </div>
            <button className="btn btn-sm btn-secondary" onClick={() => onComplete(reminder.id)}>
              Complete
            </button>
            <button className="delete-btn" style={{ opacity: 1 }} onClick={() => onDelete(reminder.id)}>
              <Icons.Trash />
            </button>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <p className="empty-text">No reminders set</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Page
const SettingsPage = ({ settings, onUpdateSettings, courses, onImportSyllabus, allData, onRestoreData }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [syllabusText, setSyllabusText] = useState('');
  const [syllabusUrl, setSyllabusUrl] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [importedItems, setImportedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [syncStatus, setSyncStatus] = useState('');
  const [syncError, setSyncError] = useState('');

  const handleParseSyllabus = () => {
    if (!syllabusText.trim() || !selectedCourse) return;
    const items = parseSyllabusText(syllabusText, selectedCourse);
    setImportedItems(items);
    setSelectedItems(new Set(items.map(i => i.id)));
  };

  const handleApproveImport = () => {
    const itemsToImport = importedItems.filter(item => selectedItems.has(item.id));
    onImportSyllabus(itemsToImport);
    setSyllabusText('');
    setImportedItems([]);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Export data as JSON file
  const handleExportData = () => {
    const exportData = {
      ...allData,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.courses && data.items && data.applications && data.reminders) {
          if (confirm('This will replace all your current data. Are you sure?')) {
            onRestoreData(data);
            setSyncStatus('Data imported successfully!');
            setTimeout(() => setSyncStatus(''), 3000);
          }
        } else {
          setSyncError('Invalid backup file format');
          setTimeout(() => setSyncError(''), 3000);
        }
      } catch (err) {
        setSyncError('Failed to parse backup file');
        setTimeout(() => setSyncError(''), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // GitHub Gist sync
  const handleSyncToGist = async () => {
    if (!settings.githubToken) {
      setSyncError('Please enter your GitHub Personal Access Token');
      return;
    }

    setSyncStatus('Syncing to GitHub...');
    setSyncError('');

    try {
      const result = await GistSync.save(settings.githubToken, settings.githubGistId, allData);
      if (!settings.githubGistId) {
        onUpdateSettings({ githubGistId: result.id });
      }
      onUpdateSettings({ lastSyncTime: new Date().toISOString() });
      setSyncStatus('Synced successfully!');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err) {
      setSyncError(`Sync failed: ${err.message}`);
    }
  };

  const handleLoadFromGist = async () => {
    if (!settings.githubToken || !settings.githubGistId) {
      setSyncError('Please enter your GitHub token and Gist ID');
      return;
    }

    setSyncStatus('Loading from GitHub...');
    setSyncError('');

    try {
      const data = await GistSync.load(settings.githubToken, settings.githubGistId);
      if (confirm('This will replace all your current data. Are you sure?')) {
        onRestoreData(data);
        setSyncStatus('Data loaded successfully!');
        setTimeout(() => setSyncStatus(''), 3000);
      } else {
        setSyncStatus('');
      }
    } catch (err) {
      setSyncError(`Load failed: ${err.message}`);
    }
  };

  // Convert Google Drive share link to direct view/download
  const getGoogleDriveViewUrl = (url) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings & Imports</h1>
        <p className="page-subtitle">Configure your dashboard, sync data, and import syllabi</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General</button>
        <button className={`tab ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</button>
        <button className={`tab ${activeTab === 'sync' ? 'active' : ''}`} onClick={() => setActiveTab('sync')}>Data Sync</button>
        <button className={`tab ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => setActiveTab('syllabus')}>Syllabus Import</button>
      </div>

      {activeTab === 'general' && (
        <div className="card">
          <div className="settings-section">
            <h3 className="settings-title">Term Configuration</h3>
            <p className="settings-description">
              Set your term dates to enable proper week numbering in the weekly view.
            </p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Term Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.termName}
                  onChange={e => onUpdateSettings({ termName: e.target.value })}
                  placeholder="e.g., Spring 2026"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Default Due Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={settings.defaultDueTime}
                  onChange={e => onUpdateSettings({ defaultDueTime: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Term Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={settings.termStart}
                  onChange={e => onUpdateSettings({ termStart: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Term End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={settings.termEnd}
                  onChange={e => onUpdateSettings({ termEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="card">
          <div className="settings-section">
            <h3 className="settings-title">Google Calendar Integration</h3>
            <p className="settings-description">
              To embed your Google Calendar, you need to get the embed URL from Google Calendar settings.
              Go to Google Calendar → Settings → Settings for your calendar → Integrate calendar → Copy the public URL or embed code.
            </p>

            <div className="alert alert-info">
              <strong>Note:</strong> For private calendars, you'll need to use the "Secret address in iCal format" or make your calendar public.
              Alternatively, create a combined calendar that subscribes to both your Personal and Columbia calendars.
            </div>

            <div className="form-group">
              <label className="form-label">Google Calendar Embed URL</label>
              <input
                type="url"
                className="form-input"
                value={settings.calendarEmbedUrl}
                onChange={e => onUpdateSettings({ calendarEmbedUrl: e.target.value })}
                placeholder="https://calendar.google.com/calendar/embed?src=..."
              />
              <p className="form-help">Paste the full embed URL from Google Calendar. Supports both single and multi-calendar embeds.</p>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>Preview</h4>
              <div className="calendar-embed-container">
                {settings.calendarEmbedUrl ? (
                  <iframe
                    src={settings.calendarEmbedUrl.replace('http://', 'https://')}
                    style={{ border: 0 }}
                    frameBorder="0"
                    scrolling="no"
                    title="Google Calendar"
                  />
                ) : (
                  <div className="calendar-placeholder">
                    <div className="calendar-placeholder-icon">📅</div>
                    <p className="calendar-placeholder-text">
                      Add your Google Calendar embed URL above to see your schedule here.
                      <br /><br />
                      This will consolidate your Personal and Columbia calendars in one view.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sync' && (
        <div>
          {syncStatus && <div className="alert alert-success">{syncStatus}</div>}
          {syncError && <div className="alert alert-warning">{syncError}</div>}

          <div className="card">
            <div className="settings-section">
              <h3 className="settings-title">Export / Import Data</h3>
              <p className="settings-description">
                Download your data as a JSON file to back up or transfer to another device.
                You can also import a previously exported backup file.
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleExportData}>
                  <Icons.Download /> Export Data
                </button>
                <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                  <Icons.Upload /> Import Data
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="settings-section">
              <h3 className="settings-title">GitHub Gist Sync</h3>
              <p className="settings-description">
                Sync your data across devices using a private GitHub Gist. Your data is stored securely
                in your GitHub account and can be accessed from any device.
              </p>

              <div className="alert alert-info">
                <strong>Setup:</strong> Create a Personal Access Token at{' '}
                <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                  github.com/settings/tokens
                </a>{' '}
                with the <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>gist</code> scope.
              </p>
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Personal Access Token</label>
                <input
                  type="password"
                  className="form-input"
                  value={settings.githubToken}
                  onChange={e => onUpdateSettings({ githubToken: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <p className="form-help">Your token is stored locally and never sent anywhere except GitHub's API.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Gist ID (auto-generated on first sync)</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.githubGistId}
                  onChange={e => onUpdateSettings({ githubGistId: e.target.value })}
                  placeholder="Will be created automatically"
                />
                <p className="form-help">Leave blank for first sync. A new private gist will be created.</p>
              </div>

              {settings.lastSyncTime && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Last synced: {new Date(settings.lastSyncTime).toLocaleString()}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleSyncToGist} disabled={!settings.githubToken}>
                  <Icons.Cloud /> Push to GitHub
                </button>
                <button className="btn btn-secondary" onClick={handleLoadFromGist} disabled={!settings.githubToken || !settings.githubGistId}>
                  <Icons.Refresh /> Pull from GitHub
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="settings-section">
              <h3 className="settings-title">Deployment Info</h3>
              <p className="settings-description">
                This app runs entirely in your browser. Your data is stored in localStorage by default.
                To access from multiple devices, use the GitHub Gist sync above or export/import your data.
              </p>

              <div className="alert alert-info">
                <strong>GitHub Pages:</strong> This app can be deployed to GitHub Pages for free.
                Just push to your repo and enable Pages in repository settings.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'syllabus' && (
        <div className="card">
          <div className="settings-section">
            <h3 className="settings-title">Import Syllabus</h3>
            <p className="settings-description">
              Paste your syllabus text below, or provide a Google Drive link to view it.
              The system will attempt to extract assignments with dates.
            </p>

            <div className="alert alert-warning">
              <strong>Tip:</strong> For best results, copy the assignment schedule section of your syllabus.
              The parser looks for date patterns (Sep 12, 9/12) near assignment keywords (Problem Set, Quiz, Midterm, etc.).
            </div>

            <div className="form-group">
              <label className="form-label">Google Drive Syllabus Link (optional)</label>
              <input
                type="url"
                className="form-input"
                value={syllabusUrl}
                onChange={e => setSyllabusUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />
              <p className="form-help">Paste a Google Drive share link to view your syllabus PDF. Make sure sharing is enabled.</p>
            </div>

            {syllabusUrl && (
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>Syllabus Preview</h4>
                <div className="calendar-embed-container" style={{ height: '400px' }}>
                  <iframe
                    src={getGoogleDriveViewUrl(syllabusUrl)}
                    style={{ border: 0, width: '100%', height: '100%' }}
                    allow="autoplay"
                    title="Syllabus Preview"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Select Course</label>
              <select
                className="form-select"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
              >
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Syllabus Text (copy from PDF or type manually)</label>
              <textarea
                className="form-textarea"
                value={syllabusText}
                onChange={e => setSyllabusText(e.target.value)}
                placeholder="Paste your syllabus text here...

Example:
Week 2
Problem Set 1 - Due Sep 15
Reading: Chapter 3 - Due Sep 17

Week 3
Quiz 1 - Sep 20
Problem Set 2 - Due Sep 22"
                style={{ minHeight: '200px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}
              />
            </div>

            <button className="btn btn-primary" onClick={handleParseSyllabus} disabled={!syllabusText.trim() || !selectedCourse}>
              <Icons.Upload /> Parse Syllabus
            </button>

            {importedItems.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Extracted Items ({selectedItems.size} of {importedItems.length} selected)
                </h4>
                <div className="import-preview">
                  {importedItems.map(item => (
                    <div
                      key={item.id}
                      className={`import-item ${selectedItems.has(item.id) ? 'selected' : ''}`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div
                        className={`task-checkbox ${selectedItems.has(item.id) ? 'checked' : ''}`}
                      />
                      <div className="import-item-content">
                        <div className="import-item-title">{item.title}</div>
                        <div className="import-item-meta">
                          <span>{item.dueDate ? formatDate(item.dueDate) : 'No date'}</span>
                          <span className={`confidence-tag ${item.confidence.toLowerCase()}`}>{item.confidence} confidence</span>
                          {item.weekNumber && <span>Week {item.weekNumber}</span>}
                        </div>
                        <div className="import-item-original">Original: "{item.originalLine}"</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                  <button className="btn btn-success" onClick={handleApproveImport} disabled={selectedItems.size === 0}>
                    Import {selectedItems.size} Items
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setImportedItems([]); setSelectedItems(new Set()); }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function LifeTracker() {
  // State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('lifetracker_courses');
    return saved ? JSON.parse(saved) : defaultCourses;
  });
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('lifetracker_items');
    return saved ? JSON.parse(saved) : defaultItems;
  });
  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('lifetracker_applications');
    return saved ? JSON.parse(saved) : defaultJobApplications;
  });
  const [reminders, setReminders] = useState(() => {
    const saved = localStorage.getItem('lifetracker_reminders');
    return saved ? JSON.parse(saved) : defaultReminders;
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('lifetracker_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [calendarEvents, setCalendarEvents] = useState(() => {
    const saved = localStorage.getItem('lifetracker_events');
    return saved ? JSON.parse(saved) : defaultCalendarEvents;
  });

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Form states
  const [newItem, setNewItem] = useState({ title: '', type: 'Manual Todo', courseId: '', category: 'Class', dueDate: '', dueTime: settings.defaultDueTime, status: 'Not started', notes: '' });
  const [newCourse, setNewCourse] = useState({ name: '', term: settings.termName, color: '#6366f1', links: '' });
  const [newApp, setNewApp] = useState({ company: '', role: '', status: 'Submitted - Pending Response', salary: '', dateSubmitted: new Date().toISOString().split('T')[0], link: '', referral: '', reachedOut: false, notes: '' });
  const [newReminder, setNewReminder] = useState({ title: '', frequency: 'monthly', nextDue: '', notes: '' });
  const [newEvent, setNewEvent] = useState({ title: '', calendar: 'Personal', start: '09:00', end: '10:00', date: new Date().toISOString().split('T')[0] });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('lifetracker_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('lifetracker_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('lifetracker_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('lifetracker_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('lifetracker_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('lifetracker_events', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  // Handlers
  const toggleComplete = useCallback((id) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed, status: !item.completed ? 'Done' : 'Not started' } : item
    ));
  }, []);

  const addItem = () => {
    if (!newItem.title.trim()) return;
    setItems([...items, { ...newItem, id: generateId(), completed: false, source: 'Manual' }]);
    setNewItem({ title: '', type: 'Manual Todo', courseId: '', category: 'Class', dueDate: '', dueTime: settings.defaultDueTime, status: 'Not started', notes: '' });
    setShowItemModal(false);
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addCourse = () => {
    if (!newCourse.name.trim()) return;
    setCourses([...courses, { ...newCourse, id: generateId() }]);
    setNewCourse({ name: '', term: settings.termName, color: '#6366f1', links: '' });
    setShowCourseModal(false);
  };

  const deleteCourse = (id) => {
    setCourses(courses.filter(c => c.id !== id));
  };

  const addApplication = () => {
    if (!newApp.company.trim()) return;
    setApplications([...applications, { ...newApp, id: generateId() }]);
    setNewApp({ company: '', role: '', status: 'Submitted - Pending Response', salary: '', dateSubmitted: new Date().toISOString().split('T')[0], link: '', referral: '', reachedOut: false, notes: '' });
    setShowAppModal(false);
  };

  const updateApplication = (id, updates) => {
    setApplications(applications.map(app => app.id === id ? { ...app, ...updates } : app));
  };

  const deleteApplication = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const addReminder = () => {
    if (!newReminder.title.trim() || !newReminder.nextDue) return;
    setReminders([...reminders, { ...newReminder, id: generateId(), lastCompleted: null }]);
    setNewReminder({ title: '', frequency: 'monthly', nextDue: '', notes: '' });
    setShowReminderModal(false);
  };

  const completeReminder = (id) => {
    setReminders(reminders.map(r => {
      if (r.id !== id) return r;
      const today = new Date();
      let nextDue = new Date(r.nextDue);
      switch (r.frequency) {
        case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
        case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
        case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
        case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
      }
      return { ...r, lastCompleted: today.toISOString().split('T')[0], nextDue: nextDue.toISOString().split('T')[0] };
    }));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const importSyllabus = (importedItems) => {
    const itemsToAdd = importedItems.map(item => ({
      ...item,
      approved: true,
      dueTime: item.dueTime || settings.defaultDueTime
    }));
    setItems(prev => [...prev, ...itemsToAdd]);
  };

  // Get all data for export/sync
  const getAllData = () => ({
    courses,
    items,
    applications,
    reminders,
    calendarEvents,
    settings
  });

  // Restore data from backup/sync
  const restoreData = (data) => {
    if (data.courses) setCourses(data.courses);
    if (data.items) setItems(data.items);
    if (data.applications) setApplications(data.applications);
    if (data.reminders) setReminders(data.reminders);
    if (data.calendarEvents) setCalendarEvents(data.calendarEvents);
    if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
  };

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    setCalendarEvents([...calendarEvents, { ...newEvent, id: generateId() }]);
    setNewEvent({ title: '', calendar: 'Personal', start: '09:00', end: '10:00', date: new Date().toISOString().split('T')[0] });
    setShowEventModal(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'weekly', label: 'Weekly View', icon: Icons.Calendar },
    { id: 'classes', label: 'Classes', icon: Icons.Book },
    { id: 'todos', label: 'Todos', icon: Icons.Check },
    { id: 'jobs', label: 'Job Applications', icon: Icons.Briefcase },
    { id: 'reminders', label: 'Reminders', icon: Icons.Bell },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="logo">Life Tracker</div>
          <div className="logo-subtitle">Personal Dashboard</div>

          <div className="nav-section">
            <div className="nav-label">Navigation</div>
            {navItems.map(item => (
              <div
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <item.icon />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <DashboardPage
              items={items}
              courses={courses}
              reminders={reminders}
              calendarEvents={calendarEvents}
              settings={settings}
              toggleComplete={toggleComplete}
              onAddItem={() => setShowItemModal(true)}
            />
          )}
          {currentPage === 'weekly' && (
            <WeeklyViewPage
              items={items}
              courses={courses}
              settings={settings}
              toggleComplete={toggleComplete}
              onAddItem={() => setShowItemModal(true)}
              onDeleteItem={deleteItem}
            />
          )}
          {currentPage === 'classes' && (
            <ClassesPage
              courses={courses}
              items={items}
              onAddCourse={() => setShowCourseModal(true)}
              onDeleteCourse={deleteCourse}
            />
          )}
          {currentPage === 'todos' && (
            <TodosPage
              items={items}
              courses={courses}
              toggleComplete={toggleComplete}
              onAddItem={() => setShowItemModal(true)}
              onDeleteItem={deleteItem}
            />
          )}
          {currentPage === 'jobs' && (
            <JobApplicationsPage
              applications={applications}
              onAdd={() => setShowAppModal(true)}
              onUpdate={updateApplication}
              onDelete={deleteApplication}
            />
          )}
          {currentPage === 'reminders' && (
            <RemindersPage
              reminders={reminders}
              onAdd={() => setShowReminderModal(true)}
              onComplete={completeReminder}
              onDelete={deleteReminder}
            />
          )}
          {currentPage === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={updateSettings}
              allData={getAllData()}
              onRestoreData={restoreData}
              courses={courses}
              onImportSyllabus={importSyllabus}
            />
          )}
        </main>

        {/* Add Item Modal */}
        <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Add Item">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={newItem.title}
              onChange={e => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="Enter item title..."
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={newItem.category}
                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
              >
                <option value="Class">Class</option>
                <option value="MATS">MATS</option>
                <option value="Personal">Personal</option>
                <option value="Admin">Admin</option>
                <option value="Health">Health</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Course (if applicable)</label>
              <select
                className="form-select"
                value={newItem.courseId}
                onChange={e => setNewItem({ ...newItem, courseId: e.target.value })}
              >
                <option value="">None</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={newItem.dueDate}
                onChange={e => setNewItem({ ...newItem, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Time</label>
              <input
                type="time"
                className="form-input"
                value={newItem.dueTime}
                onChange={e => setNewItem({ ...newItem, dueTime: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={newItem.notes}
              onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addItem}>Add Item</button>
          </div>
        </Modal>

        {/* Add Course Modal */}
        <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Add Course">
          <div className="form-group">
            <label className="form-label">Course Name</label>
            <input
              className="form-input"
              value={newCourse.name}
              onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
              placeholder="e.g., Machine Learning"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Term</label>
              <input
                className="form-input"
                value={newCourse.term}
                onChange={e => setNewCourse({ ...newCourse, term: e.target.value })}
                placeholder="e.g., Spring 2026"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input
                type="color"
                className="form-input"
                value={newCourse.color}
                onChange={e => setNewCourse({ ...newCourse, color: e.target.value })}
                style={{ height: '42px', padding: '4px' }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Links (Courseworks, Zoom, etc.)</label>
            <input
              className="form-input"
              value={newCourse.links}
              onChange={e => setNewCourse({ ...newCourse, links: e.target.value })}
              placeholder="Add relevant links..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addCourse}>Add Course</button>
          </div>
        </Modal>

        {/* Add Application Modal */}
        <Modal isOpen={showAppModal} onClose={() => setShowAppModal(false)} title="Add Job Application">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                className="form-input"
                value={newApp.company}
                onChange={e => setNewApp({ ...newApp, company: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input
                className="form-input"
                value={newApp.role}
                onChange={e => setNewApp({ ...newApp, role: e.target.value })}
                placeholder="Position title"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={newApp.status}
                onChange={e => setNewApp({ ...newApp, status: e.target.value })}
              >
                {APPLICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Salary</label>
              <input
                className="form-input"
                value={newApp.salary}
                onChange={e => setNewApp({ ...newApp, salary: e.target.value })}
                placeholder="e.g., $150,000"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date Submitted</label>
              <input
                type="date"
                className="form-input"
                value={newApp.dateSubmitted}
                onChange={e => setNewApp({ ...newApp, dateSubmitted: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Potential Referral</label>
              <input
                className="form-input"
                value={newApp.referral}
                onChange={e => setNewApp({ ...newApp, referral: e.target.value })}
                placeholder="Contact name"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Job Posting Link</label>
            <input
              className="form-input"
              value={newApp.link}
              onChange={e => setNewApp({ ...newApp, link: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={newApp.notes}
              onChange={e => setNewApp({ ...newApp, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowAppModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addApplication}>Add Application</button>
          </div>
        </Modal>

        {/* Add Reminder Modal */}
        <Modal isOpen={showReminderModal} onClose={() => setShowReminderModal(false)} title="Add Reminder">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={newReminder.title}
              onChange={e => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="e.g., Change toothbrush"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Frequency</label>
              <select
                className="form-select"
                value={newReminder.frequency}
                onChange={e => setNewReminder({ ...newReminder, frequency: e.target.value })}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Every 3 months</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Next Due Date</label>
              <input
                type="date"
                className="form-input"
                value={newReminder.nextDue}
                onChange={e => setNewReminder({ ...newReminder, nextDue: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={newReminder.notes}
              onChange={e => setNewReminder({ ...newReminder, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowReminderModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addReminder}>Add Reminder</button>
          </div>
        </Modal>
      </div>
    </>
  );
}
