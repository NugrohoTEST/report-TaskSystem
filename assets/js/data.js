    const DEFAULT_ITEMS = [
      {
        id: 'cmd-1',
        title: 'Lab 4: Photosynthesis Inquiry Reports',
        subtitle: '5 ungraded submissions remaining across 2 section',
        category: 'Grade',
        priority: 'Medium',
        gradeLevel: '7th Grade',
        source: 'PowerSchool',
        timeSaved: 20,
        actionLabel: 'Grade Submission',
        icon: 'flask-conical',
        iconBg: 'bg-brand-50 text-brand-600',
        completed: false
      },
      {
        id: 'cmd-2',
        title: 'Parent Inquiry: Linear Equation Remedial Plan',
        subtitle: 'Mrs. Ratna Hartono requested progress update for Arka (8B)',
        category: 'Needs Reply',
        priority: 'High',
        gradeLevel: '8th Grade',
        source: 'ParentSquare',
        timeSaved: 15,
        actionLabel: 'Draft Reply',
        icon: 'message-square',
        iconBg: 'bg-emerald-50 text-emerald-600',
        completed: false
      },
      {
        id: 'cmd-3',
        title: 'Attendance & Quiz Drop Alert: Maya Putri',
        subtitle: '2 consecutive missed homework checkpoints in Higher Math',
        category: 'Student Flags',
        priority: 'High',
        gradeLevel: '10th Grade',
        source: 'Canvas LMS',
        timeSaved: 18,
        actionLabel: 'Review Flag',
        icon: 'flag',
        iconBg: 'bg-rose-50 text-rose-500',
        completed: false
      },
      {
        id: 'cmd-4',
        title: 'Algebra Basic — Formative Exit Tickets',
        subtitle: '14 auto-scored responses ready for final teacher sign-off',
        category: 'Grade',
        priority: 'Medium',
        gradeLevel: '8th Grade',
        source: 'Google Classroom',
        timeSaved: 22,
        actionLabel: 'Grade Submission',
        icon: 'file-check-2',
        iconBg: 'bg-amber-50 text-amber-600',
        completed: false
      },
      {
        id: 'cmd-5',
        title: 'IEP Accommodation Confirmation — Kevin Tan',
        subtitle: 'Counselor office awaiting extended-time approval for Period 3',
        category: 'Needs Reply',
        priority: 'High',
        gradeLevel: '10th Grade',
        source: 'PowerSchool',
        timeSaved: 12,
        actionLabel: 'Send Approval',
        icon: 'mail',
        iconBg: 'bg-brand-50 text-brand-600',
        completed: false
      },
      {
        id: 'cmd-6',
        title: 'Science Fair Proposal Feedback Thread',
        subtitle: '3 student lab groups asked clarifying questions on rubric',
        category: 'Needs Reply',
        priority: 'Low',
        gradeLevel: '8th Grade',
        source: 'Canvas LMS',
        timeSaved: 11,
        actionLabel: 'Reply Thread',
        icon: 'messages-square',
        iconBg: 'bg-emerald-50 text-emerald-600',
        completed: false
      },
      {
        id: 'cmd-7',
        title: 'Co-Teacher Lesson Sync: Photosynthesis Lab',
        subtitle: 'Mr. Dimas shared updated microscope station assignments',
        category: 'Needs Reply',
        priority: 'Low',
        gradeLevel: '8th Grade',
        source: 'LuminaAI',
        timeSaved: 10,
        actionLabel: 'Confirm Sync',
        icon: 'users',
        iconBg: 'bg-sky-50 text-sky-600',
        completed: false
      },
      {
        id: 'cmd-8',
        title: 'Parent Conference Slot Confirmation',
        subtitle: '1 parent message awaits a reply for Thursday afternoon slot',
        category: 'Needs Reply',
        priority: 'High',
        gradeLevel: '7th Grade',
        source: 'ParentSquare',
        timeSaved: 10,
        actionLabel: 'Confirm Slot',
        icon: 'calendar-check',
        iconBg: 'bg-amber-50 text-amber-600',
        completed: false
      }
    ];

    const TEACHING_SCHEDULE = [
      {
        id: 'per-1',
        period: 'Period 1',
        time: '10:00 AM - 11:00 AM',
        course: 'Grade 8B: Mathematic',
        topic: 'Topic: Algebra Basic - Linear equation',
        room: '3B (D building)',
        status: 'Ongoing',
        accentBorder: 'border-brand-600',
        periodColor: 'text-brand-600'
      },
      {
        id: 'per-2',
        period: 'Period 2',
        time: '11:30 AM - 12:30 PM',
        course: 'Grade 8C: Science',
        topic: 'Topic: Photosynthesis',
        room: '4A (D building)',
        status: 'Upcoming',
        accentBorder: 'border-amber-500',
        periodColor: 'text-amber-600'
      },
      {
        id: 'per-3',
        period: 'Period 3',
        time: '1:00 PM - 2:00 PM',
        course: 'Grade 10A: Higher Math',
        topic: 'Topic: Calculus Derivatives',
        room: '3B (A building)',
        status: 'Upcoming',
        accentBorder: 'border-emerald-500',
        periodColor: 'text-emerald-600'
      },
      {
        id: 'per-4',
        period: 'Period 4',
        time: '2:10 PM - 3:00 PM',
        course: 'Grade 7B: General Science',
        topic: 'Topic: Quiz on chapter 4',
        room: '2A (D building)',
        status: 'Upcoming',
        accentBorder: 'border-sky-500',
        periodColor: 'text-sky-600'
      }
    ];

    const CLASS_ROSTER_DATA = [
      { name: 'Arka Pratama', grade: 'Grade 8B', avg: '88%', attendance: '98%', status: 'On Track', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
      { name: 'Maya Putri', grade: 'Grade 10A', avg: '71%', attendance: '84%', status: 'Needs Review', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80' },
      { name: 'Kevin Tan', grade: 'Grade 10A', avg: '82%', attendance: '95%', status: 'IEP Active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80' },
      { name: 'Salsabila Azzahra', grade: 'Grade 8C', avg: '94%', attendance: '100%', status: 'Excelling', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
      { name: 'Rafael Gunawan', grade: 'Grade 7B', avg: '79%', attendance: '92%', status: 'On Track', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' }
    ];

    const EDTECH_TOOLS = [
      { name: 'PowerSchool SIS', role: 'Grades & Attendance Sync', status: 'Connected', lastSync: '2 mins ago', saved: '1.6h/wk' },
      { name: 'Canvas LMS', role: 'Assignments & Rubrics', status: 'Connected', lastSync: '5 mins ago', saved: '1.2h/wk' },
      { name: 'ParentSquare', role: 'Family Messaging Hub', status: 'Connected', lastSync: '8 mins ago', saved: '0.9h/wk' },
      { name: 'Google Classroom', role: 'Exit Tickets & Worksheets', status: 'Connected', lastSync: '14 mins ago', saved: '0.7h/wk' },
      { name: 'LuminaAI Co-Pilot', role: 'Auto-Triage & Briefs', status: 'Active', lastSync: 'Live', saved: '0.4h/wk' }
    ];

