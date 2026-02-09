<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherSubject;
use App\Models\Semester;
use App\Models\StudyYear;

class AccountingTeacherSeeder extends Seeder
{
    public function run(): void
    {
        $department = Department::where('name', 'المحاسبة')->first();

        if (!$department) {
            $this->command->error('❌ Accounting department not found. Run DepartmentSubjectSeeder first.');
            return;
        }

        $subjects = Subject::where('department_id', $department->id)->get();

        if ($subjects->isEmpty()) {
            $this->command->error('❌ No subjects found for Accounting department. Run DepartmentSubjectSeeder first.');
            return;
        }

        $studyYear = StudyYear::where('is_current', true)->first();
        $semester = Semester::where('is_current', true)->first();

        if (!$studyYear || !$semester) {
            $this->command->error('❌ No current study year or semester found. Run DepartmentSubjectSeeder first.');
            return;
        }

        // 10 teachers for 10 accounting subjects
        $teachersData = [
            // Semester 1 subjects
            [
                'name' => 'د. عبدالله الزهراني',
                'name_en' => 'Dr. Abdullah Al-Zahrani',
                'email' => 'a.zahrani@university.edu',
                'phone' => '0501234567',
                'qualification' => 'محاضر',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الملك سعود',
                'credential_date' => '2015-06-15',
                'years_experience' => 10,
                'specialization' => 'المحاسبة المالية',
                'teaching_hours' => 12,
                'hourly_rate' => 150.00,
                'basic_salary' => 8000.00,
            ],
            [
                'name' => 'د. فاطمة العتيبي',
                'name_en' => 'Dr. Fatima Al-Otaibi',
                'email' => 'f.otaibi@university.edu',
                'phone' => '0502345678',
                'qualification' => 'محاضر',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الملك عبدالعزيز',
                'credential_date' => '2016-09-20',
                'years_experience' => 9,
                'specialization' => 'الاقتصاد الجزئي',
                'teaching_hours' => 10,
                'hourly_rate' => 140.00,
                'basic_salary' => 7500.00,
            ],
            [
                'name' => 'أ. محمد القحطاني',
                'name_en' => 'Mr. Mohammed Al-Qahtani',
                'email' => 'm.qahtani@university.edu',
                'phone' => '0503456789',
                'qualification' => 'محاضر',
                'education_level' => 'ماجستير',
                'credential_institution' => 'جامعة أم القرى',
                'credential_date' => '2018-01-10',
                'years_experience' => 7,
                'specialization' => 'الإدارة المالية',
                'teaching_hours' => 14,
                'hourly_rate' => 120.00,
                'basic_salary' => 6000.00,
            ],
            [
                'name' => 'د. سارة الشمري',
                'name_en' => 'Dr. Sarah Al-Shammari',
                'email' => 's.shammari@university.edu',
                'phone' => '0504567890',
                'qualification' => 'محاضر',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الإمام محمد بن سعود',
                'credential_date' => '2014-05-25',
                'years_experience' => 11,
                'specialization' => 'الرياضيات المالية',
                'teaching_hours' => 10,
                'hourly_rate' => 150.00,
                'basic_salary' => 8500.00,
            ],
            [
                'name' => 'أ. خالد الحربي',
                'name_en' => 'Mr. Khalid Al-Harbi',
                'email' => 'k.harbi@university.edu',
                'phone' => '0505678901',
                'qualification' => 'متعاون',
                'education_level' => 'ماجستير',
                'credential_institution' => 'جامعة الملك فهد للبترول والمعادن',
                'credential_date' => '2019-07-01',
                'years_experience' => 5,
                'specialization' => 'القانون التجاري',
                'teaching_hours' => 8,
                'hourly_rate' => 100.00,
                'basic_salary' => 4500.00,
            ],
            // Semester 2 subjects
            [
                'name' => 'د. نورة الدوسري',
                'name_en' => 'Dr. Noura Al-Dosari',
                'email' => 'n.dosari@university.edu',
                'phone' => '0506789012',
                'qualification' => 'رئيس قسم',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الملك سعود',
                'credential_date' => '2012-03-18',
                'years_experience' => 13,
                'specialization' => 'المحاسبة المتوسطة',
                'teaching_hours' => 8,
                'hourly_rate' => 180.00,
                'basic_salary' => 10000.00,
            ],
            [
                'name' => 'د. أحمد المالكي',
                'name_en' => 'Dr. Ahmed Al-Malki',
                'email' => 'a.malki@university.edu',
                'phone' => '0507890123',
                'qualification' => 'محاضر',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الملك عبدالعزيز',
                'credential_date' => '2013-11-05',
                'years_experience' => 12,
                'specialization' => 'محاسبة التكاليف',
                'teaching_hours' => 12,
                'hourly_rate' => 160.00,
                'basic_salary' => 9000.00,
            ],
            [
                'name' => 'أ. ريم السبيعي',
                'name_en' => 'Ms. Reem Al-Subaie',
                'email' => 'r.subaie@university.edu',
                'phone' => '0508901234',
                'qualification' => 'محاضر',
                'education_level' => 'ماجستير',
                'credential_institution' => 'جامعة الأميرة نورة',
                'credential_date' => '2017-08-22',
                'years_experience' => 8,
                'specialization' => 'المحاسبة الإدارية',
                'teaching_hours' => 14,
                'hourly_rate' => 130.00,
                'basic_salary' => 6500.00,
            ],
            [
                'name' => 'د. عمر الغامدي',
                'name_en' => 'Dr. Omar Al-Ghamdi',
                'email' => 'o.ghamdi@university.edu',
                'phone' => '0509012345',
                'qualification' => 'محاضر',
                'education_level' => 'دكتوراه',
                'credential_institution' => 'جامعة الملك فيصل',
                'credential_date' => '2015-02-14',
                'years_experience' => 10,
                'specialization' => 'نظم المعلومات المحاسبية',
                'teaching_hours' => 10,
                'hourly_rate' => 150.00,
                'basic_salary' => 8000.00,
            ],
            [
                'name' => 'أ. هند العنزي',
                'name_en' => 'Ms. Hind Al-Anazi',
                'email' => 'h.anazi@university.edu',
                'phone' => '0510123456',
                'qualification' => 'متعاون',
                'education_level' => 'ماجستير',
                'credential_institution' => 'جامعة تبوك',
                'credential_date' => '2020-04-30',
                'years_experience' => 4,
                'specialization' => 'الاقتصاد الكلي',
                'teaching_hours' => 8,
                'hourly_rate' => 100.00,
                'basic_salary' => 4000.00,
            ],
        ];

        $createdCount = 0;

        foreach ($subjects as $index => $subject) {
            $data = $teachersData[$index] ?? null;
            if (!$data) continue;

            // Create teacher
            $teacher = Teacher::firstOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'department_id' => $department->id,
                    'is_active' => true,
                ])
            );

            // Create teacher_subject assignment
            TeacherSubject::firstOrCreate(
                [
                    'teacher_id' => $teacher->id,
                    'subject_id' => $subject->id,
                    'semester_id' => $semester->id,
                    'department_id' => $department->id,
                ],
                [
                    'study_year_id' => $studyYear->id,
                    'academic_year' => '2025-2026',
                    'is_primary_teacher' => true,
                    'can_edit_grades' => true,
                    'can_take_attendance' => true,
                    'is_active' => true,
                    'start_date' => now()->toDateString(),
                ]
            );

            $createdCount++;
        }

        $this->command->info("✅ {$createdCount} Accounting teachers created with subject assignments!");
    }
}
