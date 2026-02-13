<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\SubjectPrerequisite;
use Illuminate\Support\Str;

class ArchitectureEngineeringSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🏗️  Seeding Architecture Engineering Department...');

        // ─── Find or create the department ────────────────────────────────
        $department = Department::where('name', 'هندسة العمارة')->first();

        if (!$department) {
            $department = Department::create([
                'name' => 'هندسة العمارة',
                'name_en' => 'Architecture Engineering',
                'description' => 'قسم هندسة العمارة والتصميم المعماري - جامعة الخليل الأهلية',
                'semester_count' => 10,
                'is_active' => true,
            ]);
        } else {
            $department->update(['semester_count' => 10]);
        }

        // ─── Delete old subjects for this department (clean slate) ────────
        $oldSubjectIds = Subject::where('department_id', $department->id)->pluck('id');
        if ($oldSubjectIds->isNotEmpty()) {
            SubjectPrerequisite::whereIn('subject_id', $oldSubjectIds)
                ->orWhereIn('prerequisite_id', $oldSubjectIds)
                ->delete();
            SubjectDepartment::whereIn('subject_id', $oldSubjectIds)->delete();
            Subject::whereIn('id', $oldSubjectIds)->delete();
            $this->command->info('   Cleaned old Architecture subjects.');
        }

        // ─── Define all courses across 10 semesters ──────────────────────
        // hours_t_p format: "theoretical/practical"
        $curriculum = [
            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 1
            // ═══════════════════════════════════════════════════════════════
            1 => [
                ['code' => 'GS101',   'name' => 'رياضيات 1',                    'name_en' => 'Mathematics 1',                          'credits' => 3, 't' => 3, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'GS111',   'name' => 'فيزياء معمارية (بيئة)',         'name_en' => 'Architectural Physics (Environment)',     'credits' => 3, 't' => 2, 'p' => 2, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'ARCH101', 'name' => 'أسس التصميم المعماري',          'name_en' => 'Principles of Architectural Design',     'credits' => 3, 't' => 0, 'p' => 6, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ARCH121', 'name' => 'الرسم المعماري والظل',          'name_en' => 'Architectural Drawing and Shade',         'credits' => 2, 't' => 1, 'p' => 3, 'prereq' => null,       'type' => 'required'],
                ['code' => 'GE125',   'name' => 'الهندسة الوصفية',              'name_en' => 'Descriptive Geometry',                    'credits' => 2, 't' => 1, 'p' => 3, 'prereq' => null,       'type' => 'department_requirement'],
                ['code' => 'GH141',   'name' => 'لغة إنجليزية 1',               'name_en' => 'English Language 1',                      'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 2
            // ═══════════════════════════════════════════════════════════════
            2 => [
                ['code' => 'GS102',   'name' => 'رياضيات 2',                    'name_en' => 'Mathematics 2',                          'credits' => 3, 't' => 3, 'p' => 0, 'prereq' => ['GS101'],   'type' => 'university_requirement'],
                ['code' => 'ARCH102', 'name' => 'تصميم معماري (1)',              'name_en' => 'Architectural Design (1)',                'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ARCH101'], 'type' => 'required'],
                ['code' => 'ARCH133', 'name' => 'تكنولوجيا وخواص المواد',        'name_en' => 'Technology and Properties of Materials', 'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ARCH241', 'name' => 'الرسم الحر والتشكيل',          'name_en' => 'Freehand Drawing and Formation',         'credits' => 2, 't' => 0, 'p' => 4, 'prereq' => ['ARCH121'], 'type' => 'required'],
                ['code' => 'GE121',   'name' => 'ميكانيكا هندسية',              'name_en' => 'Engineering Mechanics',                   'credits' => 3, 't' => 3, 'p' => 0, 'prereq' => null,       'type' => 'department_requirement'],
                ['code' => 'GH150',   'name' => 'لغة عربية',                    'name_en' => 'Arabic Language',                         'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 3
            // ═══════════════════════════════════════════════════════════════
            3 => [
                ['code' => 'ARCH201', 'name' => 'تصميم معماري (2)',              'name_en' => 'Architectural Design (2)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH102'], 'type' => 'required'],
                ['code' => 'ARCH221', 'name' => 'إنشاء مباني (1)',              'name_en' => 'Building Construction (1)',               'credits' => 3, 't' => 2, 'p' => 2,  'prereq' => ['ARCH133'], 'type' => 'required'],
                ['code' => 'ARCH233', 'name' => 'تاريخ العمارة (1)',             'name_en' => 'History of Architecture (1)',             'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,        'type' => 'required'],
                ['code' => 'ARCH244', 'name' => 'التصميم الرقمي 1 (AutoCAD)',    'name_en' => 'Digital Design 1 (AutoCAD)',              'credits' => 3, 't' => 1, 'p' => 3,  'prereq' => null,        'type' => 'required'],
                ['code' => 'CE203AR', 'name' => 'التحليل الإنشائي للمعماريين',   'name_en' => 'Structural Analysis for Architects',     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['GE121'],   'type' => 'department_requirement'],
                ['code' => 'GH142',   'name' => 'لغة إنجليزية 2',               'name_en' => 'English Language 2',                      'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['GH141'],   'type' => 'university_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 4
            // ═══════════════════════════════════════════════════════════════
            4 => [
                ['code' => 'ARCH202', 'name' => 'تصميم معماري (3)',              'name_en' => 'Architectural Design (3)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH201'], 'type' => 'required'],
                ['code' => 'ARCH222', 'name' => 'إنشاء مباني (2)',              'name_en' => 'Building Construction (2)',               'credits' => 3, 't' => 2, 'p' => 2,  'prereq' => ['ARCH221'], 'type' => 'required'],
                ['code' => 'ARCH234', 'name' => 'تاريخ العمارة (2)',             'name_en' => 'History of Architecture (2)',             'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['ARCH233'], 'type' => 'required'],
                ['code' => 'ARCH245', 'name' => 'النمذجة ثلاثية الأبعاد (3D)',   'name_en' => '3D Modeling',                             'credits' => 3, 't' => 1, 'p' => 3,  'prereq' => ['ARCH244'], 'type' => 'required'],
                ['code' => 'CE301AR', 'name' => 'ميكانيكا الجوامد',             'name_en' => 'Mechanics of Solids',                     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['CE203AR'], 'type' => 'department_requirement'],
                ['code' => 'CE233AR', 'name' => 'مساحة هندسية',                 'name_en' => 'Engineering Surveying',                   'credits' => 2, 't' => 1, 'p' => 2,  'prereq' => null,        'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 5
            // ═══════════════════════════════════════════════════════════════
            5 => [
                ['code' => 'ARCH301', 'name' => 'تصميم معماري (4)',              'name_en' => 'Architectural Design (4)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH202'], 'type' => 'required'],
                ['code' => 'ARCH344', 'name' => 'النظم الإنشائية الحديثة',       'name_en' => 'Modern Structural Systems',              'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['CE301AR'], 'type' => 'required'],
                ['code' => 'ARCH333', 'name' => 'العمارة الإسلامية',             'name_en' => 'Islamic Architecture',                    'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['ARCH234'], 'type' => 'required'],
                ['code' => 'ARCH391', 'name' => 'التحكم البيئي والاستدامة',      'name_en' => 'Environmental Control and Sustainability','credits' => 3, 't' => 3, 'p' => 0,  'prereq' => ['GS111'],   'type' => 'required'],
                ['code' => 'CE305AR', 'name' => 'تصميم الخرسانة المسلحة',       'name_en' => 'Reinforced Concrete Design',              'credits' => 2, 't' => 2, 'p' => 2,  'prereq' => ['CE301AR'], 'type' => 'department_requirement'],
                ['code' => 'ARCH381', 'name' => 'نمذجة معلومات المباني (BIM)',   'name_en' => 'Building Information Modeling (BIM)',     'credits' => 2, 't' => 1, 'p' => 3,  'prereq' => ['ARCH245'], 'type' => 'required'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 6
            // ═══════════════════════════════════════════════════════════════
            6 => [
                ['code' => 'ARCH302', 'name' => 'تصميم معماري (5)',              'name_en' => 'Architectural Design (5)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH301'], 'type' => 'required'],
                ['code' => 'ARCH324', 'name' => 'التفاصيل المعمارية المعاصرة',   'name_en' => 'Contemporary Architectural Details',     'credits' => 3, 't' => 1, 'p' => 3,  'prereq' => ['ARCH222'], 'type' => 'required'],
                ['code' => 'ARCH371', 'name' => 'تخطيط المدن',                   'name_en' => 'Town Planning',                           'credits' => 3, 't' => 3, 'p' => 0,  'prereq' => null,        'type' => 'required'],
                ['code' => 'CE307AR', 'name' => 'تصميم المنشآت المعدنية',       'name_en' => 'Steel Structures Design',                 'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['CE301AR'], 'type' => 'department_requirement'],
                ['code' => 'ARCH361', 'name' => 'عمارة البيئة (Landscape)',      'name_en' => 'Landscape Architecture',                  'credits' => 2, 't' => 1, 'p' => 2,  'prereq' => null,        'type' => 'required'],
                ['code' => 'ARCH433', 'name' => 'نظريات العمارة الحديثة',        'name_en' => 'Modern Architecture Theories',            'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['ARCH233'], 'type' => 'required'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 7
            // ═══════════════════════════════════════════════════════════════
            7 => [
                ['code' => 'ARCH401', 'name' => 'تصميم معماري (6)',              'name_en' => 'Architectural Design (6)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH302'], 'type' => 'required'],
                ['code' => 'ARCH424', 'name' => 'الرسومات التنفيذية (1)',        'name_en' => 'Working Drawings (1)',                    'credits' => 3, 't' => 1, 'p' => 4,  'prereq' => ['ARCH324'], 'type' => 'required'],
                ['code' => 'ARCH462', 'name' => 'التخطيط الحضري والإقليمي',      'name_en' => 'Urban and Regional Planning',             'credits' => 3, 't' => 2, 'p' => 2,  'prereq' => ['ARCH371'], 'type' => 'required'],
                ['code' => 'ARCH399', 'name' => 'برمجة المشاريع المعمارية',      'name_en' => 'Architectural Programming',               'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,        'type' => 'required'],
                ['code' => 'ARCH-E1', 'name' => 'مقرر اختياري (1)',              'name_en' => 'Elective Course (1)',                     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,        'type' => 'elective'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 8
            // ═══════════════════════════════════════════════════════════════
            8 => [
                ['code' => 'ARCH402', 'name' => 'تصميم معماري (7)',              'name_en' => 'Architectural Design (7)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH401'],          'type' => 'required'],
                ['code' => 'ARCH425', 'name' => 'الرسومات التنفيذية (2)',        'name_en' => 'Working Drawings (2)',                    'credits' => 3, 't' => 1, 'p' => 4,  'prereq' => ['ARCH424'],          'type' => 'required'],
                ['code' => 'ARCH584', 'name' => 'الممارسة المهنية والتشريعات',   'name_en' => 'Professional Practice and Legislation',  'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null, 'min_units' => 100, 'type' => 'required'],
                ['code' => 'ARCH457', 'name' => 'نظم المعلومات الجغرافية (GIS)', 'name_en' => 'Geographic Information Systems (GIS)',    'credits' => 3, 't' => 2, 'p' => 2,  'prereq' => null,                 'type' => 'required'],
                ['code' => 'ARCH-E2', 'name' => 'مقرر اختياري (2)',              'name_en' => 'Elective Course (2)',                     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,                 'type' => 'elective'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 9
            // ═══════════════════════════════════════════════════════════════
            9 => [
                ['code' => 'ARCH501', 'name' => 'تصميم معماري (8)',              'name_en' => 'Architectural Design (8)',                'credits' => 5, 't' => 0, 'p' => 10, 'prereq' => ['ARCH402'], 'type' => 'required'],
                ['code' => 'ARCH591', 'name' => 'ندوة وبحث التخرج',             'name_en' => 'Graduation Seminar and Research',         'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['ARCH399'], 'type' => 'required'],
                ['code' => 'ARCH595', 'name' => 'إدارة المشاريع (BIM Manage)',   'name_en' => 'BIM Management',                          'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => ['ARCH381'], 'type' => 'required'],
                ['code' => 'ARCH-E3', 'name' => 'مقرر اختياري (3)',              'name_en' => 'Elective Course (3)',                     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,        'type' => 'elective'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 10
            // ═══════════════════════════════════════════════════════════════
            10 => [
                ['code' => 'ARCH599', 'name' => 'مشروع التخرج النهائي',          'name_en' => 'Final Graduation Project',                'credits' => 8, 't' => 0, 'p' => 16, 'prereq' => ['ARCH591', 'ARCH501'], 'type' => 'required'],
                ['code' => 'GH152',   'name' => 'كتابة التقارير الفنية (بالعربية)','name_en' => 'Technical Report Writing (Arabic)',       'credits' => 1, 't' => 2, 'p' => 0,  'prereq' => ['GH142'],              'type' => 'university_requirement'],
            ],
        ];

        // ─── Phase 1: Create all subjects ────────────────────────────────
        $subjectMap = []; // code => Subject model

        foreach ($curriculum as $semesterNumber => $courses) {
            foreach ($courses as $course) {
                $subject = Subject::create([
                    'name'              => $course['name'],
                    'name_en'           => $course['name_en'],
                    'code'              => $course['code'],
                    'credits'           => $course['credits'],
                    'weekly_hours'      => $course['t'] + $course['p'],
                    'theoretical_hours' => $course['t'],
                    'practical_hours'   => $course['p'],
                    'department_id'     => $department->id,
                    'cost_per_credit'   => 200.00,
                    'is_required'       => $course['type'] !== 'elective',
                    'subject_type'      => $course['type'],
                    'semester_number'   => $semesterNumber,
                    'min_units_required'=> $course['min_units'] ?? null,
                    'max_students'      => 30,
                    'is_active'         => true,
                ]);

                $subjectMap[$course['code']] = $subject;

                // Create subject_departments pivot
                SubjectDepartment::create([
                    'subject_id'            => $subject->id,
                    'department_id'         => $department->id,
                    'is_primary_department' => true,
                    'is_active'             => true,
                ]);
            }
        }

        $this->command->info('   ✅ ' . count($subjectMap) . ' subjects created.');

        // ─── Phase 2: Wire up prerequisites ──────────────────────────────
        $prereqCount = 0;

        foreach ($curriculum as $semesterNumber => $courses) {
            foreach ($courses as $course) {
                if (empty($course['prereq'])) {
                    continue;
                }

                $subject = $subjectMap[$course['code']];

                foreach ($course['prereq'] as $prereqCode) {
                    if (!isset($subjectMap[$prereqCode])) {
                        $this->command->warn("   ⚠️  Prerequisite {$prereqCode} not found for {$course['code']}");
                        continue;
                    }

                    SubjectPrerequisite::create([
                        'subject_id'      => $subject->id,
                        'prerequisite_id' => $subjectMap[$prereqCode]->id,
                    ]);
                    $prereqCount++;
                }
            }
        }

        $this->command->info('   ✅ ' . $prereqCount . ' prerequisite relationships created.');

        // ─── Summary ─────────────────────────────────────────────────────
        $totalUnits = collect($curriculum)->flatten(1)->sum('credits');
        $this->command->info('');
        $this->command->info('   📊 Architecture Engineering Summary:');
        $this->command->info("      Department: {$department->name} ({$department->name_en})");
        $this->command->info("      Semesters: " . count($curriculum));
        $this->command->info("      Total Subjects: " . count($subjectMap));
        $this->command->info("      Total Units: {$totalUnits}");
        $this->command->info("      Prerequisites: {$prereqCount}");
        $this->command->info('   ✅ Architecture Engineering seeding complete!');
    }
}
