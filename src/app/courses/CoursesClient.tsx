'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar/Navbar'
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import './courses.css'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase'

// Define the course interface
interface Course {
  course_code: string
  course_name: string
  course_description: string
  faculty?: {
    name: string
  }
  instructor?: string
  credits?: number
  prerequisites?: string
}

// Define semester structure
interface Semester {
  id: string
  name: string
  totalCredits: number
  courses: Course[]
}

interface CoursesClientProps {
  courses: Course[]
  error: string | null
}

export default function CoursesClient({ courses, error }: CoursesClientProps) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [viewMode, setViewMode] = useState<'all' | 'my'>('my')
  const [myCourses, setMyCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [activeProgram, setActiveProgram] = useState<'it' | 'cs' | 'is'>('it')

  // Sample semester data for IT program
  const semesters: Semester[] = [
    {
      id: 'third',
      name: 'Third Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPIT-201',
          course_name: 'Introduction to Computing',
          course_description: 'مقدمة حوسبية',
          credits: 3
        },
        {
          course_code: 'STAT-210',
          course_name: 'Introduction to Computing Statistics',
          course_description: 'مقدمة احصائيات',
          credits: 3,
          prerequisites: 'STAT-110'
        },
        {
          course_code: 'CPIT-221',
          course_name: 'Technical Writing',
          course_description: 'اساليب كتابة',
          credits: 2
        },
        {
          course_code: 'CPCS-202',
          course_name: 'Programming (I)',
          course_description: 'برمجة-1',
          credits: 3
        },
        {
          course_code: 'ISLS-101',
          course_name: 'Islamic Culture (I)',
          course_description: 'ثقافة اسلامية-1',
          credits: 2
        },
      ]
    },
    {
      id: 'fourth',
      name: 'Fourth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPCS-203',
          course_name: 'Programming (II)',
          course_description: 'برمجة-2',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: 'CPCS-222',
          course_name: 'Discrete Structures (I)',
          course_description: 'تراكيب متقطعة-1',
          credits: 3
        },
        {
          course_code: 'CPIT-220',
          course_name: 'Introduction to IT',
          course_description: 'مبادئ تقنية',
          credits: 3,
          prerequisites: 'CPIT-201'
        },
        {
          course_code: 'ARAB-101',
          course_name: 'Language Skills',
          course_description: 'مهارات لغوية',
          credits: 3
        },
        {
          course_code: 'ISLS-201',
          course_name: 'Islamic Culture (II)',
          course_description: 'ثقافة اسلامية-2',
          credits: 2,
          prerequisites: 'ISLS-101'
        },
      ]
    },
    {
      id: 'fifth',
      name: 'Fifth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPCS-204',
          course_name: 'Data Structures (I)',
          course_description: 'تراكيب بيانات-1',
          credits: 3,
          prerequisites: 'CPCS-203'
        },
        {
          course_code: 'ISLS-301',
          course_name: 'Islamic Culture (III)',
          course_description: 'ثقافة اسلامية-3',
          credits: 2,
          prerequisites: 'ISLS-201'
        },
        {
          course_code: 'CPIT-210',
          course_name: 'Computer Organization and Architecture',
          course_description: 'تنظيم وبنيان الحاسب',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: '',
          course_name: 'College Free (I)',
          course_description: 'مادة حرة-1',
          credits: 3
        },
        {
          course_code: 'ARAB-201',
          course_name: 'Writing Skills',
          course_description: 'مهارات التحرير الكتابي',
          credits: 3,
          prerequisites: 'ARAB-101'
        },
      ]
    },
    {
      id: 'sixth',
      name: 'Sixth Semester',
      totalCredits: 15,
      courses: [
        {
          course_code: 'CPIT-240',
          course_name: 'Database (I)',
          course_description: 'قواعد بيانات-1',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPIT-250',
          course_name: 'System Analysis & Design',
          course_description: 'تحليل و تصميم النظام',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPIT-260',
          course_name: 'Operating Systems',
          course_description: 'نظم تشغيل',
          credits: 3,
          prerequisites: 'CPCS-204 CPIT-210'
        },
        {
          course_code: 'CPIT-285',
          course_name: 'Computer Graphics',
          course_description: 'رسوم حاسب',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: '',
          course_name: 'College Free (II)',
          course_description: 'مادة حرة-2',
          credits: 3
        },
      ]
    },
    {
      id: 'seventh',
      name: 'Seventh Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPIT-251',
          course_name: 'Software Engineering (I)',
          course_description: 'هندسة برمجيات-1',
          credits: 3,
          prerequisites: 'CPIT-250'
        },
        {
          course_code: 'CPIT-280',
          course_name: 'Human Computer Interaction',
          course_description: 'تفاعل الإنسان والحاسب',
          credits: 3,
          prerequisites: 'CPIT-250'
        },
        {
          course_code: 'CPIT-370',
          course_name: 'Computer Networks',
          course_description: 'شبكات',
          credits: 3,
          prerequisites: 'CPIT-201'
        },
        {
          course_code: '',
          course_name: 'Department Elective(I)',
          course_description: 'مادة مسار-1',
          credits: 3
        },
      ]
    },
    {
      id: 'eighth',
      name: 'Eighth Semester',
      totalCredits: 17,
      courses: [
        {
          course_code: 'CPIS-334',
          course_name: 'Software Project Management',
          course_description: 'إدارة مشاريع برمجية',
          credits: 2
        },
        {
          course_code: 'CPIT-252',
          course_name: 'Software Design Patterns',
          course_description: 'نماذج تصميم البرمجيات',
          credits: 3,
          prerequisites: 'CPIT-251'
        },
        {
          course_code: 'CPIT-330',
          course_name: 'IT Issues & Management',
          course_description: 'تقنية المعلومات و الإدارة',
          credits: 3,
          prerequisites: 'CPIT-220 CPIT-250'
        },
        {
          course_code: 'CPIT-380',
          course_name: 'Multimedia Technologies',
          course_description: 'استخدامات تقنية المتعددة',
          credits: 3,
          prerequisites: 'CPIT-285'
        },
        {
          course_code: 'CPIT-305',
          course_name: 'Advanced Programming',
          course_description: 'برمجة متقدمة',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPIT-425',
          course_name: 'Information Security',
          course_description: 'أمن المعلومات',
          credits: 3,
          prerequisites: 'CPIT-370'
        },
      ]
    },
    {
      id: 'ninth',
      name: 'Ninth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPIT-405',
          course_name: 'Internet Applications',
          course_description: 'تطبيقات الإنترنت',
          credits: 3,
          prerequisites: 'CPIT-252 CPIT-370'
        },
        {
          course_code: 'CPIT-498',
          course_name: 'Senior Project (1)',
          course_description: 'مشروع تخرج-1',
          credits: 1,
          prerequisites: 'Senior Level'
        },
        {
          course_code: 'CPIT-345',
          course_name: 'Database Administration',
          course_description: 'إدارة قواعد البيانات',
          credits: 3,
          prerequisites: 'CPIT-240'
        },
        {
          course_code: '',
          course_name: 'Department Elective (II)',
          course_description: 'مادة مسار-2',
          credits: 3
        },
        {
          course_code: '',
          course_name: 'Department Elective (III)',
          course_description: 'مادة مسار-3',
          credits: 3
        },
      ]
    },
    {
      id: 'tenth',
      name: 'Tenth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPIT-435',
          course_name: 'Needs Assessment & Technology Evaluation',
          course_description: 'تقييم الاحتياجات والتكنولوجيا',
          credits: 2,
          prerequisites: 'CPIT-220 CPIT-250'
        },
        {
          course_code: 'CPIT-499',
          course_name: 'Senior Project (2)',
          course_description: 'مشروع تخرج-2',
          credits: 3,
          prerequisites: 'CPIT-498'
        },
        {
          course_code: 'CPIT-470',
          course_name: 'Networks Administration',
          course_description: 'إدارة الشبكات',
          credits: 3,
          prerequisites: 'CPIT-370'
        },
        {
          course_code: 'CPIS-428',
          course_name: 'Professional Computing Issues',
          course_description: 'قضايا الحوسبة المهنية',
          credits: 2,
          prerequisites: 'CPIT-323'
        },
        {
          course_code: '',
          course_name: 'College Free (III)',
          course_description: 'مادة حرة-3',
          credits: 3
        },
      ]
    }
  ]

  // Sample semester data for IS program
  const isSemesters: Semester[] = [
    {
      id: 'third',
      name: 'Third Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPIT-201',
          course_name: 'Introduction to Computing',
          course_description: 'مقدمة حوسبية',
          credits: 3
        },
        {
          course_code: 'STAT-210',
          course_name: 'Introduction to Computing Statistics',
          course_description: 'نظرية احصائيات',
          credits: 3,
          prerequisites: 'STAT-110'
        },
        {
          course_code: 'CPIT-221',
          course_name: 'Technical Writing',
          course_description: 'اساليب كتابة',
          credits: 2
        },
        {
          course_code: 'CPCS-202',
          course_name: 'Programming (I)',
          course_description: 'برمجة-1',
          credits: 3
        },
        {
          course_code: 'ISLS-101',
          course_name: 'Islamic Culture (I)',
          course_description: 'ثقافة اسلامية-1',
          credits: 2
        },
      ]
    },
    {
      id: 'fourth',
      name: 'Fourth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPCS-203',
          course_name: 'Programming (II)',
          course_description: 'برمجة-2',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: 'CPIS-220',
          course_name: 'Principles of Information Systems',
          course_description: 'مبادئ نظم المعلومات',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: 'ARAB-101',
          course_name: 'Language Skills',
          course_description: 'مهارات لغوية',
          credits: 3
        },
        {
          course_code: 'ISLS-201',
          course_name: 'Islamic Culture (II)',
          course_description: 'ثقافة اسلامية-2',
          credits: 2,
          prerequisites: 'ISLS-101'
        },
      ]
    },
    {
      id: 'fifth',
      name: 'Fifth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPCS-204',
          course_name: 'Data Structures (I)',
          course_description: 'تراكيب بيانات-1',
          credits: 3,
          prerequisites: 'CPCS-203'
        },
        {
          course_code: 'CPCS-222',
          course_name: 'Discrete Structures (I)',
          course_description: 'تراكيب متقطعة-1',
          credits: 3
        },
        {
          course_code: 'CPIS-210',
          course_name: 'Computer Architecture & Organization',
          course_description: 'تنظيم و بنيان الحاسب',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: 'BUS-232',
          course_name: 'Modern Business Models',
          course_description: 'إدارة منظمات',
          credits: 2
        },
        {
          course_code: '',
          course_name: 'College Free (I)',
          course_description: 'مادة حرة-1',
          credits: 3
        },
      ]
    },
    {
      id: 'sixth',
      name: 'Sixth Semester',
      totalCredits: 16,
      courses: [
        {
          course_code: 'CPIS-222',
          course_name: 'Principles of Operating Systems',
          course_description: 'مبادئ نظم التشغيل',
          credits: 3,
          prerequisites: 'CPIS-210 CPCS-204'
        },
        {
          course_code: 'CPIS-240',
          course_name: 'Database Managements Systems',
          course_description: 'إدارة أنظمة قواعد البيانات',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPIS-334',
          course_name: 'Software Project Management',
          course_description: 'إدارة مشاريع برمجية',
          credits: 2
        },
        {
          course_code: 'MRKT-260',
          course_name: 'Principals of Marketing',
          course_description: 'مبادئ التسويق',
          credits: 2,
          prerequisites: 'BUS-232'
        },
        {
          course_code: 'CPIS-250',
          course_name: 'Software Engineering',
          course_description: 'هندسة برمجيات',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPIS-370',
          course_name: 'Fundamentals of Data Networks',
          course_description: 'مبادئ شبكات البيانات',
          credits: 3,
          prerequisites: 'CPIS-210 CPCS-204'
        },
      ]
    },
    {
      id: 'seventh',
      name: 'Seventh Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPIS-351',
          course_name: 'Analysis & Design',
          course_description: 'تحليل و تصميم نظم معلومات',
          credits: 3,
          prerequisites: 'CPIS-250 BUS-232'
        },
        {
          course_code: 'CPIS-354',
          course_name: 'Principle of Human Computer Interaction',
          course_description: 'مبادئ الاتصال بين الإنسان و الحاسب',
          credits: 3,
          prerequisites: 'CPIS-250'
        },
        {
          course_code: 'CPIS-358',
          course_name: 'Internet Application & Web Programming',
          course_description: 'تطوير تطبيقات الانترنت و برمجيات الويب',
          credits: 3,
          prerequisites: 'CPIS-250'
        },
        {
          course_code: 'ACCT-333',
          course_name: 'Principles of Corporate Accounting',
          course_description: 'محاسبة تجارية تطبيقية',
          credits: 2,
          prerequisites: 'BUS-232'
        },
        {
          course_code: 'CPIS-357',
          course_name: 'Software Quality and Testing',
          course_description: 'مقدمة في جودة البرمجيات و اختبارها',
          credits: 3,
          prerequisites: 'CPIS-250 CPIS-334'
        },
      ]
    },
    {
      id: 'eighth',
      name: 'Eighth Semester',
      totalCredits: 15,
      courses: [
        {
          course_code: 'CPIS-312',
          course_name: 'Information & Computer Security',
          course_description: 'أمن المعلومات و الحاسبات',
          credits: 3,
          prerequisites: 'CPIS-370'
        },
        {
          course_code: 'CPIS-352',
          course_name: 'IS Applications Design & Development',
          course_description: 'تطوير تطبيقات نظم المعلومات',
          credits: 3,
          prerequisites: 'CPIS-351'
        },
        {
          course_code: 'CPIS-380',
          course_name: 'Introduction to E-Business Systems',
          course_description: 'مقدمة في نظم الأعمال الإلكترونية',
          credits: 3,
          prerequisites: 'CPIS-351 CPIS-358'
        },
        {
          course_code: 'ARAB-201',
          course_name: 'Writing Skills',
          course_description: 'مهارات التحرير الكتابي',
          credits: 3,
          prerequisites: 'ARAB-101'
        },
        {
          course_code: '',
          course_name: 'Department Elective(I)',
          course_description: 'مادة مسار-1',
          credits: 3
        },
      ]
    },
    {
      id: 'ninth',
      name: 'Ninth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'ISLS-301',
          course_name: 'Islamic Culture (IV)',
          course_description: 'ثقافة اسلامية-3',
          credits: 2,
          prerequisites: 'ISLS-201'
        },
        {
          course_code: 'CPIS-498',
          course_name: 'Senior Project (1)',
          course_description: 'مشروع تخرج-1',
          credits: 1,
          prerequisites: 'Senior Level'
        },
        {
          course_code: 'CPIS-428',
          course_name: 'Professional Computing Issues',
          course_description: 'قضايا الحوسبة المهنية',
          credits: 2,
          prerequisites: 'CPIS-323'
        },
        {
          course_code: '',
          course_name: 'Department Elective (II)',
          course_description: 'مادة مسار-2',
          credits: 3
        },
        {
          course_code: '',
          course_name: 'College Free (II)',
          course_description: 'مادة حرة-2',
          credits: 3
        },
        {
          course_code: 'CPIS-342',
          course_name: 'Data Mining & Warehousing',
          course_description: 'مستودعات البيانات و التنقيب',
          credits: 3,
          prerequisites: 'CPIS-240'
        },
      ]
    },
    {
      id: 'tenth',
      name: 'Tenth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'ISLS-401',
          course_name: 'Islamic Culture (IV)',
          course_description: 'ثقافة اسلامية-4',
          credits: 2,
          prerequisites: 'ISLS-301'
        },
        {
          course_code: 'CPIS-499',
          course_name: 'Senior Project (2)',
          course_description: 'مشروع تخرج-2',
          credits: 3,
          prerequisites: 'CPIS-498'
        },
        {
          course_code: 'CPIS-434',
          course_name: 'IS Strategies and Policies',
          course_description: 'استراتيجيات و سياسات نظم المعلومات',
          credits: 3,
          prerequisites: 'CPIS-220'
        },
        {
          course_code: '',
          course_name: 'College Free (III)',
          course_description: 'مادة حرة-3',
          credits: 3
        },
        {
          course_code: '',
          course_name: 'Department Elective (III)',
          course_description: 'مادة مسار-3',
          credits: 3
        },
      ]
    }
  ]

  // Sample semester data for CS program
  const csSemesters: Semester[] = [
    {
      id: 'third',
      name: 'Third Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPIT-201',
          course_name: 'Introduction to Computing',
          course_description: 'مقدمة حوسبية',
          credits: 3
        },
        {
          course_code: 'STAT-210',
          course_name: 'Introduction to Computing Statistics',
          course_description: 'نظرية احصائيات',
          credits: 3,
          prerequisites: 'STAT-110'
        },
        {
          course_code: 'CPIT-221',
          course_name: 'Technical Writing',
          course_description: 'اساليب كتابة',
          credits: 2
        },
        {
          course_code: 'CPCS-202',
          course_name: 'Programming (I)',
          course_description: 'برمجة-1',
          credits: 3
        },
        {
          course_code: 'ISLS-101',
          course_name: 'Islamic Culture (I)',
          course_description: 'ثقافة اسلامية-1',
          credits: 2
        },
      ]
    },
    {
      id: 'fourth',
      name: 'Fourth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPCS-203',
          course_name: 'Programming (II)',
          course_description: 'برمجة-2',
          credits: 3,
          prerequisites: 'CPCS-202'
        },
        {
          course_code: 'CPCS-222',
          course_name: 'Discrete Structures (I)',
          course_description: 'تراكيب متقطعة-1',
          credits: 3
        },
        {
          course_code: 'MATH-202',
          course_name: 'Calculus (II)',
          course_description: 'تفاضل و تكامل-2',
          credits: 3,
          prerequisites: 'MATH-110'
        },
        {
          course_code: 'ARAB-101',
          course_name: 'Language Skills',
          course_description: 'مهارات لغوية',
          credits: 3
        },
        {
          course_code: 'ISLS-201',
          course_name: 'Islamic Culture (II)',
          course_description: 'ثقافة اسلامية-2',
          credits: 2,
          prerequisites: 'ISLS-101'
        },
      ]
    },
    {
      id: 'fifth',
      name: 'Fifth Semester',
      totalCredits: 14,
      courses: [
        {
          course_code: 'CPCS-204',
          course_name: 'Data Structures (I)',
          course_description: 'تراكيب بيانات-1',
          credits: 3,
          prerequisites: 'CPCS-203'
        },
        {
          course_code: 'CPCS-211',
          course_name: 'Digital Logic Design',
          course_description: 'تصميم المنطق الرقمي',
          credits: 3,
          prerequisites: 'CPIT-201'
        },
        {
          course_code: 'CPCS-212',
          course_name: 'Applied Math for Computing (I)',
          course_description: 'رياضيات تطبيقية للحوسبة-1',
          credits: 4,
          prerequisites: 'MATH-202'
        },
        {
          course_code: '',
          course_name: 'Science Lab',
          course_description: 'معمل علوم (احياء او فيزياء او كيمياء او كيمياء حيوية)',
          credits: 4
        },
      ]
    },
    {
      id: 'sixth',
      name: 'Sixth Semester',
      totalCredits: 15,
      courses: [
        {
          course_code: 'CPCS-214',
          course_name: 'Computer Organization and Architecture (I)',
          course_description: 'تنظيم و بنيان الحاسب-1',
          credits: 3,
          prerequisites: 'CPCS-211'
        },
        {
          course_code: 'CPCS-223',
          course_name: 'Analysis & Design of Algorithms',
          course_description: 'تحليل و تصميم الخوارزميات',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPCS-241',
          course_name: 'Database (I)',
          course_description: 'قواعد بيانات-1',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'STAT-352',
          course_name: 'Applied Probability & Random Processes',
          course_description: 'الإحتمالات التطبيقية و العمليات العشوائية',
          credits: 3,
          prerequisites: 'STAT-210'
        },
        {
          course_code: 'CPCS-301',
          course_name: 'Programming Languages',
          course_description: 'لغات برمجة',
          credits: 3,
          prerequisites: 'CPCS-204 CPCS-222'
        },
      ]
    },
    {
      id: 'seventh',
      name: 'Seventh Semester',
      totalCredits: 17,
      courses: [
        {
          course_code: 'CPIS-334',
          course_name: 'Software Project Management',
          course_description: 'إدارة مشاريع برمجية',
          credits: 2
        },
        {
          course_code: 'CPCS-324',
          course_name: 'Algorithms & Data Structures (II)',
          course_description: 'خوارزميات و تراكيب بيانات-2',
          credits: 3,
          prerequisites: 'CPCS-222 CPCS-223'
        },
        {
          course_code: 'CPCS-351',
          course_name: 'Software Engineering (I)',
          course_description: 'هندسة برمجيات-1',
          credits: 3,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'CPCS-331',
          course_name: 'Artificial Intelligence (I)',
          course_description: 'ذكاء اصطناعي-1',
          credits: 3,
          prerequisites: 'CPCS-204 CPCS-223'
        },
        {
          course_code: 'CPCS-361',
          course_name: 'Operating Systems (I)',
          course_description: 'نظم التشغيل-1',
          credits: 3,
          prerequisites: 'CPCS-204 CPCS-214'
        },
        {
          course_code: 'CPCS-371',
          course_name: 'Computer Networks (I)',
          course_description: 'شبكات-1',
          credits: 3,
          prerequisites: 'CPCS-214'
        },
      ]
    },
    {
      id: 'eighth',
      name: 'Eighth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'CPCS-302',
          course_name: 'Compiler Construction',
          course_description: 'بناء المترجمات',
          credits: 3,
          prerequisites: 'CPCS-301'
        },
        {
          course_code: 'CPCS-381',
          course_name: 'Human-Computer Interaction (I)',
          course_description: 'تفاعل الإنسان و الحاسب-1',
          credits: 2,
          prerequisites: 'CPCS-204'
        },
        {
          course_code: 'ISLS-301',
          course_name: 'Islamic Culture (III)',
          course_description: 'ثقافة اسلامية-3',
          credits: 2,
          prerequisites: 'ISLS-201'
        },
        {
          course_code: 'CPCS-391',
          course_name: 'Computer Graphics (I)',
          course_description: 'رسوم حاسب-1',
          credits: 3,
          prerequisites: 'CPCS-204 CPCS-212'
        },
        {
          course_code: '',
          course_name: 'College Free (I)',
          course_description: 'مادة حرة-1',
          credits: 3
        },
      ]
    },
    {
      id: 'ninth',
      name: 'Ninth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'ARAB-201',
          course_name: 'Writing Skills',
          course_description: 'مهارات التحرير الكتابي',
          credits: 3,
          prerequisites: 'ARAB-101'
        },
        {
          course_code: 'CPCS-498',
          course_name: 'Senior Project (I)',
          course_description: 'مشروع تخرج-1',
          credits: 1,
          prerequisites: 'Senior Level'
        },
        {
          course_code: '',
          course_name: 'Department Elective(I)',
          course_description: 'مادة مسار-1',
          credits: 3
        },
        {
          course_code: '',
          course_name: 'College Free (II)',
          course_description: 'مادة حرة-2',
          credits: 3
        },
        {
          course_code: '',
          course_name: 'College Free (III)',
          course_description: 'مادة حرة-3',
          credits: 3
        },
      ]
    },
    {
      id: 'tenth',
      name: 'Tenth Semester',
      totalCredits: 13,
      courses: [
        {
          course_code: 'ISLS-401',
          course_name: 'Islamic Culture (IV)',
          course_description: 'ثقافة اسلامية-4',
          credits: 2,
          prerequisites: 'ISLS-301'
        },
        {
          course_code: 'CPCS-499',
          course_name: 'Senior Project (2)',
          course_description: 'مشروع تخرج-2',
          credits: 3,
          prerequisites: 'CPCS-498'
        },
        {
          course_code: '',
          course_name: 'Department Elective (II)',
          course_description: 'مادة مسار-2',
          credits: 3
        },
        {
          course_code: 'CPIS-428',
          course_name: 'Professional Computing Issues',
          course_description: 'قضايا الحوسبة المهنية',
          credits: 3,
          prerequisites: 'CPCS-323'
        },
        {
          course_code: '',
          course_name: 'Department Elective (III)',
          course_description: 'مادة مسار-3',
          credits: 2
        },
      ]
    }
  ]

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])
  
  // Fetch user's courses when component mounts
  useEffect(() => {
    // Skip fetching if auth is still loading or if user is not logged in
    if (authLoading || !user) return;
    
    const fetchUserCourses = async () => {
      setCoursesLoading(true)
      try {
        const response = await fetch('/api/user/courses', {
          headers: {
            'x-user-id': user.id
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error fetching courses:', errorData)
          
          if (response.status === 401) {
            setFetchError('You need to be logged in to view your courses')
          } else {
            setFetchError(errorData.error || 'Failed to fetch your courses')
          }
          setCoursesLoading(false)
          setInitialLoadComplete(true)
          return
        }
        
        const data = await response.json()

        if (data.courses) {
          setMyCourses(data.courses)
        } else {
          setMyCourses([])
        }
      } catch (error) {
        console.error('An error occurred while fetching your courses:', error)
        setFetchError('An error occurred while fetching your courses')
      } finally {
        setCoursesLoading(false)
        setInitialLoadComplete(true)
      }
    }

    fetchUserCourses()
  }, [user, authLoading])

  // Handle removing a course from user's selection
  const handleRemoveCourse = async (courseCode: string, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent navigating to course page when removing
    
    if (!user) return

    try {
      setCoursesLoading(true)
      const response = await fetch(`/api/user/courses?courseCode=${courseCode}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      })
      
      if (response.ok) {
        // Remove course from state
        setMyCourses(prevCourses => prevCourses.filter(
          course => course.course_code !== courseCode
        ))
      } else {
        const errorData = await response.json()
        console.error('Failed to remove course:', errorData)
      }
    } catch (error) {
      console.error('Failed to remove course:', error)
    } finally {
      setCoursesLoading(false)
    }
  }

  if (error) {
    return (
      <div className="courses-container">
        <Navbar />
        <main className="courses-content">
          <div className="courses-section">
            <h1 className="courses-title">Error</h1>
            <p className="error-message">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  // Show loading when authentication is loading, waiting for user data
  const isLoading = authLoading || (viewMode === 'my' && coursesLoading);

  if (isLoading) {
    return (
      <div className="courses-container">
        <Navbar />
        <main className="courses-content">
          <div className="courses-section loading-section">
            <div className="loading-animation">
              <LoadingSpinner />
              <h2 className="loading-text">Loading your courses...</h2>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Don't render the main content if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="courses-container">
      <Navbar />
      <main className="courses-content">
          <div className="courses-header">
            <h1 className="courses-title">{viewMode === 'all' ? 'All Courses' : 'My Courses'}</h1>
            
            <div className="view-toggle">
              <button 
                className={`toggle-button ${viewMode === 'my' ? 'active' : ''}`}
                onClick={() => setViewMode('my')}
                disabled={coursesLoading}
              >
                My Courses
              </button>
              <button 
                className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
                onClick={() => setViewMode('all')}
                disabled={coursesLoading}
              >
                All Courses
              </button>
            </div>
          </div>

          {/* Show a compact loading indicator when toggling between views */}
          {coursesLoading && initialLoadComplete && (
            <div className="inline-loading">
              <LoadingSpinner />
              <span>Updating...</span>
            </div>
          )}

          {fetchError && viewMode === 'my' && !coursesLoading && (
            <p className="error-message">{fetchError}</p>
          )}

          {viewMode === 'my' && !user && !coursesLoading && (
            <div className="login-prompt">
              <p>Please log in to view your courses</p>
              <button 
                className="login-button"
                onClick={() => router.push('/login')}
              tabIndex={0}
              aria-label="Log in to view your courses"
              >
                Log In
              </button>
            </div>
          )}

          {viewMode === 'my' && user && myCourses.length === 0 && !coursesLoading && !fetchError && (
            <div className="empty-courses-container">
              <p className="empty-courses">You haven&apos;t added any courses yet.</p>
              <button 
                className="browse-button"
                onClick={() => setViewMode('all')}
              tabIndex={0}
              aria-label="Browse all available courses"
              >
                Browse All Courses
              </button>
            </div>
          )}

        {!coursesLoading && viewMode === 'all' && (
          <div className="programs-container">
            <div className="programs-toggle">
              <button
                className={`program-button ${activeProgram === 'it' ? 'active' : ''}`}
                onClick={() => setActiveProgram('it')}
                tabIndex={0}
                aria-label="View Information Technology program"
              >
                Information Technology
              </button>
              <button
                className={`program-button ${activeProgram === 'cs' ? 'active' : ''}`}
                onClick={() => setActiveProgram('cs')}
                tabIndex={0}
                aria-label="View Computer Science program"
              >
                Computer Science
              </button>
              <button
                className={`program-button ${activeProgram === 'is' ? 'active' : ''}`}
                onClick={() => setActiveProgram('is')}
                tabIndex={0}
                aria-label="View Information Systems program"
              >
                Information Systems
              </button>
            </div>

            {activeProgram === 'it' && (
              <div className="program-content">
                <div className="program-header">
                  <h2 className="program-title">Information Technology Program</h2>
                  <p className="program-description">Bachelor of Science in Information Technology</p>
                </div>
                
                <div className="semesters-container">
                  {semesters.map((semester) => (
                    <div key={semester.id} className="semester-section">
                      <div className="semester-header">
                        <h2 className="semester-title">{semester.name}</h2>
                        <span className="total-credits">Total {semester.totalCredits}</span>
                      </div>
                      <div className="semester-table">
                        <div className="semester-table-header">
                          <div className="table-header-code">Code</div>
                          <div className="table-header-title">Title</div>
                          <div className="table-header-cr">Cr</div>
                          <div className="table-header-pre">Pre</div>
                        </div>
                        <div className="semester-table-body">
                          {semester.courses.map((course) => (
                            <div 
                              key={course.course_code || course.course_name} 
                              className="semester-table-row"
                              onClick={() => course.course_code && router.push(`/courses/${course.course_code}`)}
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && course.course_code && router.push(`/courses/${course.course_code}`)}
                              aria-label={`${course.course_name} course, code: ${course.course_code || 'No code'}`}
                            >
                              <div className="table-cell-code">{course.course_code}</div>
                              <div className="table-cell-title">
                                <span className="course-title-en">{course.course_name}</span>
                                <span className="course-title-ar">{course.course_description}</span>
                              </div>
                              <div className="table-cell-cr">{course.credits}</div>
                              <div className="table-cell-pre">{course.prerequisites || '---'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="course-footnotes">
                    <p className="footnote-item">* Subject to approval by department and academic advisor</p>
                    <p className="footnote-item">+ General ethics</p>
                    <p className="footnote-item">Summer Semester: CPIT-323 Summer (Workplace) Training (I) - Credit: 0 Training: 200 Hours Pre. (Department Approval)</p>
                  </div>
                </div>
              </div>
            )}

            {activeProgram === 'cs' && (
              <div className="program-content">
                <div className="program-header">
                  <h2 className="program-title">Computer Science Program</h2>
                  <p className="program-description">Bachelor of Science in Computer Science</p>
                </div>
                
                <div className="semesters-container">
                  {csSemesters.map((semester) => (
                    <div key={semester.id} className="semester-section">
                      <div className="semester-header">
                        <h2 className="semester-title">{semester.name}</h2>
                        <span className="total-credits">Total {semester.totalCredits}</span>
                      </div>
                      <div className="semester-table">
                        <div className="semester-table-header">
                          <div className="table-header-code">Code</div>
                          <div className="table-header-title">Title</div>
                          <div className="table-header-cr">Cr</div>
                          <div className="table-header-pre">Pre</div>
                        </div>
                        <div className="semester-table-body">
                          {semester.courses.map((course) => (
                            <div 
                              key={course.course_code || course.course_name} 
                              className="semester-table-row"
                              onClick={() => course.course_code && router.push(`/courses/${course.course_code}`)}
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && course.course_code && router.push(`/courses/${course.course_code}`)}
                              aria-label={`${course.course_name} course, code: ${course.course_code || 'No code'}`}
                            >
                              <div className="table-cell-code">{course.course_code}</div>
                              <div className="table-cell-title">
                                <span className="course-title-en">{course.course_name}</span>
                                <span className="course-title-ar">{course.course_description}</span>
                              </div>
                              <div className="table-cell-cr">{course.credits}</div>
                              <div className="table-cell-pre">{course.prerequisites || '---'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="course-footnotes">
                    <p className="footnote-item">* Subject to approval by department and academic advisor</p>
                    <p className="footnote-item">+ General ethics</p>
                    <p className="footnote-item">CS program focuses on theoretical and mathematical foundations of computing</p>
                  </div>
                </div>
              </div>
            )}

            {activeProgram === 'is' && (
              <div className="program-content">
                <div className="program-header">
                  <h2 className="program-title">Information Systems Program</h2>
                  <p className="program-description">Bachelor of Science in Information Systems</p>
                </div>
                
                <div className="semesters-container">
                  {isSemesters.map((semester) => (
                    <div key={semester.id} className="semester-section">
                      <div className="semester-header">
                        <h2 className="semester-title">{semester.name}</h2>
                        <span className="total-credits">Total {semester.totalCredits}</span>
                      </div>
                      <div className="semester-table">
                        <div className="semester-table-header">
                          <div className="table-header-code">Code</div>
                          <div className="table-header-title">Title</div>
                          <div className="table-header-cr">Cr</div>
                          <div className="table-header-pre">Pre</div>
                        </div>
                        <div className="semester-table-body">
                          {semester.courses.map((course) => (
                            <div 
                              key={course.course_code || course.course_name} 
                              className="semester-table-row"
                              onClick={() => course.course_code && router.push(`/courses/${course.course_code}`)}
                              tabIndex={0}
                              onKeyDown={(e) => e.key === 'Enter' && course.course_code && router.push(`/courses/${course.course_code}`)}
                              aria-label={`${course.course_name} course, code: ${course.course_code || 'No code'}`}
                            >
                              <div className="table-cell-code">{course.course_code}</div>
                              <div className="table-cell-title">
                                <span className="course-title-en">{course.course_name}</span>
                                <span className="course-title-ar">{course.course_description}</span>
                              </div>
                              <div className="table-cell-cr">{course.credits}</div>
                              <div className="table-cell-pre">{course.prerequisites || '---'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="course-footnotes">
                    <p className="footnote-item">* Subject to approval by department and academic advisor</p>
                    <p className="footnote-item">+ General ethics</p>
                    <p className="footnote-item">IS program includes specialized courses in business information systems and database management</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!coursesLoading && viewMode === 'my' && myCourses.length > 0 && (
            <div className="courses-grid">
            {myCourses.map((course) => (
                <div 
                  key={course.course_code}
                  className="course-card"
                  onClick={() => router.push(`/courses/${course.course_code}`)}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && router.push(`/courses/${course.course_code}`)}
                aria-label={`${course.course_name} course`}
                >
                  <h2 className="course-card-code">{course.course_code}</h2>
                  <p className="course-card-name">{course.course_name}</p>
                  <p className="course-card-faculty">
                    <AcademicCapIcon className="h-3 w-3 mr-1" />
                    {course.faculty?.name || 'Faculty of Computing'}
                  </p>
                  
                    <button 
                      className="remove-course-button"
                      onClick={(e) => handleRemoveCourse(course.course_code, e)}
                      aria-label={`Remove ${course.course_code} from your courses`}
                  tabIndex={0}
                      disabled={coursesLoading}
                    >
                      Remove
                    </button>
                </div>
              ))}
            </div>
          )}
      </main>
    </div>
  )
} 