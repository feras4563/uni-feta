<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\StudyYear;
use App\Models\Semester;
use App\Models\DepartmentSemesterSubject;
use Illuminate\Support\Str;

class DepartmentSubjectSeeder extends Seeder
{
    public function run(): void
    {
        // Create Study Year if not exists
        $studyYear = StudyYear::firstOrCreate(
            ['name' => 'العام الدراسي 2025-2026'],
            [
                'name_en' => 'Academic Year 2025-2026',
                'start_date' => '2025-09-01',
                'end_date' => '2026-06-30',
                'is_current' => true,
                'is_active' => true,
            ]
        );

        // Create 2 Semesters if not exists
        $semester1 = Semester::firstOrCreate(
            ['code' => 'S1-2025'],
            [
                'name' => 'الفصل الأول',
                'name_en' => 'First Semester',
                'study_year_id' => $studyYear->id,
                'start_date' => '2025-09-01',
                'end_date' => '2026-01-15',
                'is_current' => true,
                'is_active' => true,
            ]
        );

        $semester2 = Semester::firstOrCreate(
            ['code' => 'S2-2026'],
            [
                'name' => 'الفصل الثاني',
                'name_en' => 'Second Semester',
                'study_year_id' => $studyYear->id,
                'start_date' => '2026-02-01',
                'end_date' => '2026-06-30',
                'is_current' => false,
                'is_active' => true,
            ]
        );

        // ─── Departments ───────────────────────────────────────────────
        $departmentsData = [
            [
                'name' => 'هندسة العمارة',
                'name_en' => 'Architecture Engineering',
                'description' => 'قسم هندسة العمارة والتصميم المعماري',
                'semester_count' => 8,
            ],
            [
                'name' => 'التصميم الداخلي',
                'name_en' => 'Interior Design',
                'description' => 'قسم التصميم الداخلي والديكور',
                'semester_count' => 8,
            ],
            [
                'name' => 'قسم الفنون البصرية والإعلام الرقمي',
                'name_en' => 'Department of Visual Arts and Digital Media',
                'description' => 'قسم الفنون البصرية والإعلام الرقمي',
                'location' => 'Janzur Campus',
                'structure' => '1+1+2 (Foundation + Core + Specialization)',
                'semester_count' => 8,
            ],
            [
                'name' => 'تقنية المعلومات',
                'name_en' => 'Information Technology',
                'description' => 'قسم تقنية المعلومات وعلوم الحاسوب',
                'semester_count' => 8,
            ],
            [
                'name' => 'الإدارة',
                'name_en' => 'Management',
                'description' => 'قسم الإدارة وإدارة الأعمال',
                'semester_count' => 8,
            ],
            [
                'name' => 'المحاسبة',
                'name_en' => 'Accounting',
                'description' => 'قسم المحاسبة والعلوم المالية',
                'semester_count' => 8,
            ],
        ];

        $departments = [];
        foreach ($departmentsData as $deptData) {
            $departments[] = Department::updateOrCreate(
                ['name' => $deptData['name']],
                $deptData
            );
        }

        // ─── Subjects per Department ───────────────────────────────────
        // Baseline subjects for departments that still use this compact seeder.
        // Visual Arts & Digital Media has its own dedicated 8-semester seeder.
        $subjectsByDepartment = [
            // هندسة العمارة
            'هندسة العمارة' => [
                // Semester 1
                ['name' => 'مبادئ التصميم المعماري', 'name_en' => 'Principles of Architectural Design', 'code' => 'ARCH101', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرسم الهندسي', 'name_en' => 'Engineering Drawing', 'code' => 'ARCH102', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'تاريخ العمارة', 'name_en' => 'History of Architecture', 'code' => 'ARCH103', 'credits' => 2, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرياضيات للمعماريين', 'name_en' => 'Mathematics for Architects', 'code' => 'ARCH104', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مواد البناء', 'name_en' => 'Building Materials', 'code' => 'ARCH105', 'credits' => 2, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 1],
                // Semester 2
                ['name' => 'التصميم المعماري 1', 'name_en' => 'Architectural Design 1', 'code' => 'ARCH201', 'credits' => 4, 'cost_per_credit' => 220.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'الإنشاءات المعمارية', 'name_en' => 'Architectural Structures', 'code' => 'ARCH202', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'تقنيات النمذجة ثلاثية الأبعاد', 'name_en' => '3D Modeling Techniques', 'code' => 'ARCH203', 'credits' => 3, 'cost_per_credit' => 210.00, 'is_required' => false, 'semester_number' => 2],
                ['name' => 'الفيزياء الإنشائية', 'name_en' => 'Structural Physics', 'code' => 'ARCH204', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'التخطيط الحضري', 'name_en' => 'Urban Planning', 'code' => 'ARCH205', 'credits' => 2, 'cost_per_credit' => 200.00, 'is_required' => false, 'semester_number' => 2],
            ],

            // التصميم الداخلي
            'التصميم الداخلي' => [
                // Semester 1
                ['name' => 'أسس التصميم الداخلي', 'name_en' => 'Fundamentals of Interior Design', 'code' => 'INTD101', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'نظرية الألوان', 'name_en' => 'Color Theory', 'code' => 'INTD102', 'credits' => 2, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرسم الحر والتعبير', 'name_en' => 'Freehand Drawing & Expression', 'code' => 'INTD103', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'تاريخ الفنون والتصميم', 'name_en' => 'History of Arts & Design', 'code' => 'INTD104', 'credits' => 2, 'cost_per_credit' => 170.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مبادئ الإضاءة', 'name_en' => 'Principles of Lighting', 'code' => 'INTD105', 'credits' => 2, 'cost_per_credit' => 180.00, 'is_required' => false, 'semester_number' => 1],
                // Semester 2
                ['name' => 'التصميم الداخلي السكني', 'name_en' => 'Residential Interior Design', 'code' => 'INTD201', 'credits' => 4, 'cost_per_credit' => 220.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'المواد والتشطيبات', 'name_en' => 'Materials & Finishes', 'code' => 'INTD202', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'التصميم بالحاسوب (AutoCAD)', 'name_en' => 'Computer-Aided Design (AutoCAD)', 'code' => 'INTD203', 'credits' => 3, 'cost_per_credit' => 210.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'تصميم الأثاث', 'name_en' => 'Furniture Design', 'code' => 'INTD204', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => false, 'semester_number' => 2],
                ['name' => 'بيئة العمل والتصميم', 'name_en' => 'Ergonomics & Design', 'code' => 'INTD205', 'credits' => 2, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 2],
            ],

            // تقنية المعلومات
            'تقنية المعلومات' => [
                // Semester 1
                ['name' => 'مقدمة في البرمجة', 'name_en' => 'Introduction to Programming', 'code' => 'IT101', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'أساسيات الحاسوب', 'name_en' => 'Computer Fundamentals', 'code' => 'IT102', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرياضيات المتقطعة', 'name_en' => 'Discrete Mathematics', 'code' => 'IT103', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'أنظمة التشغيل', 'name_en' => 'Operating Systems', 'code' => 'IT104', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مهارات الاتصال التقني', 'name_en' => 'Technical Communication Skills', 'code' => 'IT105', 'credits' => 2, 'cost_per_credit' => 160.00, 'is_required' => false, 'semester_number' => 1],
                // Semester 2
                ['name' => 'البرمجة الكائنية', 'name_en' => 'Object-Oriented Programming', 'code' => 'IT201', 'credits' => 3, 'cost_per_credit' => 210.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'قواعد البيانات', 'name_en' => 'Database Systems', 'code' => 'IT202', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'شبكات الحاسوب', 'name_en' => 'Computer Networks', 'code' => 'IT203', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'تطوير تطبيقات الويب', 'name_en' => 'Web Application Development', 'code' => 'IT204', 'credits' => 3, 'cost_per_credit' => 210.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'أمن المعلومات', 'name_en' => 'Information Security', 'code' => 'IT205', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => false, 'semester_number' => 2],
            ],

            // الإدارة
            'الإدارة' => [
                // Semester 1
                ['name' => 'مبادئ الإدارة', 'name_en' => 'Principles of Management', 'code' => 'MGT101', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مبادئ الاقتصاد', 'name_en' => 'Principles of Economics', 'code' => 'MGT102', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مبادئ المحاسبة', 'name_en' => 'Principles of Accounting', 'code' => 'MGT103', 'credits' => 3, 'cost_per_credit' => 170.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرياضيات للأعمال', 'name_en' => 'Business Mathematics', 'code' => 'MGT104', 'credits' => 3, 'cost_per_credit' => 170.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مهارات التواصل في الأعمال', 'name_en' => 'Business Communication Skills', 'code' => 'MGT105', 'credits' => 2, 'cost_per_credit' => 160.00, 'is_required' => false, 'semester_number' => 1],
                // Semester 2
                ['name' => 'إدارة الموارد البشرية', 'name_en' => 'Human Resource Management', 'code' => 'MGT201', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'التسويق', 'name_en' => 'Marketing', 'code' => 'MGT202', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'إدارة العمليات', 'name_en' => 'Operations Management', 'code' => 'MGT203', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'السلوك التنظيمي', 'name_en' => 'Organizational Behavior', 'code' => 'MGT204', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => false, 'semester_number' => 2],
                ['name' => 'الإحصاء للأعمال', 'name_en' => 'Business Statistics', 'code' => 'MGT205', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 2],
            ],

            // المحاسبة
            'المحاسبة' => [
                // Semester 1
                ['name' => 'مبادئ المحاسبة المالية', 'name_en' => 'Principles of Financial Accounting', 'code' => 'ACC101', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الاقتصاد الجزئي', 'name_en' => 'Microeconomics', 'code' => 'ACC102', 'credits' => 3, 'cost_per_credit' => 170.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مبادئ الإدارة المالية', 'name_en' => 'Principles of Financial Management', 'code' => 'ACC103', 'credits' => 3, 'cost_per_credit' => 180.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'الرياضيات المالية', 'name_en' => 'Financial Mathematics', 'code' => 'ACC104', 'credits' => 3, 'cost_per_credit' => 170.00, 'is_required' => true, 'semester_number' => 1],
                ['name' => 'مقدمة في القانون التجاري', 'name_en' => 'Introduction to Commercial Law', 'code' => 'ACC105', 'credits' => 2, 'cost_per_credit' => 160.00, 'is_required' => false, 'semester_number' => 1],
                // Semester 2
                ['name' => 'المحاسبة المتوسطة', 'name_en' => 'Intermediate Accounting', 'code' => 'ACC201', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'محاسبة التكاليف', 'name_en' => 'Cost Accounting', 'code' => 'ACC202', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'المحاسبة الإدارية', 'name_en' => 'Managerial Accounting', 'code' => 'ACC203', 'credits' => 3, 'cost_per_credit' => 200.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'نظم المعلومات المحاسبية', 'name_en' => 'Accounting Information Systems', 'code' => 'ACC204', 'credits' => 3, 'cost_per_credit' => 190.00, 'is_required' => true, 'semester_number' => 2],
                ['name' => 'الاقتصاد الكلي', 'name_en' => 'Macroeconomics', 'code' => 'ACC205', 'credits' => 3, 'cost_per_credit' => 170.00, 'is_required' => false, 'semester_number' => 2],
            ],
        ];

        $subjectsSeeded = 0;

        foreach ($departments as $department) {
            $subjects = $subjectsByDepartment[$department->name] ?? [];

            foreach ($subjects as $subjectData) {
                $semesterNumber = $subjectData['semester_number'];
                $semester = $semesterNumber === 1 ? $semester1 : $semester2;

                // Create subject
                $subject = Subject::firstOrCreate(
                    ['code' => $subjectData['code']],
                    array_merge($subjectData, [
                        'department_id' => $department->id,
                        'semester' => $semester->name,
                        'max_students' => 30,
                        'is_active' => true,
                    ])
                );
                $subjectsSeeded++;

                // Create subject_departments pivot
                SubjectDepartment::firstOrCreate(
                    [
                        'subject_id' => $subject->id,
                        'department_id' => $department->id,
                    ],
                    [
                        'is_primary_department' => true,
                        'is_active' => true,
                    ]
                );

                // Create department_semester_subjects pivot
                DepartmentSemesterSubject::firstOrCreate(
                    [
                        'department_id' => $department->id,
                        'semester_id' => $semester->id,
                        'subject_id' => $subject->id,
                    ],
                    [
                        'is_active' => true,
                    ]
                );
            }
        }

        $this->command->info('✅ 6 Departments created successfully!');
        $this->command->info("✅ {$subjectsSeeded} baseline subjects seeded");
        $this->command->info('ℹ️ Run VisualArtsDigitalMediaSeeder for full 8-semester branching curriculum');
        $this->command->info('✅ Subject-Department and Department-Semester-Subject relationships created');
    }
}
