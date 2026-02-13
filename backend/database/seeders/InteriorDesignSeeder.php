<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\SubjectPrerequisite;
use Illuminate\Support\Str;

class InteriorDesignSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🎨  Seeding Interior Design Department...');

        // ─── Find or create the department ────────────────────────────────
        $department = Department::where('name', 'التصميم الداخلي')->first();

        if (!$department) {
            $department = Department::create([
                'name' => 'التصميم الداخلي',
                'name_en' => 'Interior Design',
                'description' => 'قسم التصميم الداخلي والديكور - جامعة الخليل الأهلية',
                'semester_count' => 8,
                'is_active' => true,
            ]);
        } else {
            $department->update(['semester_count' => 8]);
        }

        // ─── Delete old subjects for this department (clean slate) ────────
        $oldSubjectIds = Subject::where('department_id', $department->id)->pluck('id');
        if ($oldSubjectIds->isNotEmpty()) {
            SubjectPrerequisite::whereIn('subject_id', $oldSubjectIds)
                ->orWhereIn('prerequisite_id', $oldSubjectIds)
                ->delete();
            SubjectDepartment::whereIn('subject_id', $oldSubjectIds)->delete();
            Subject::whereIn('id', $oldSubjectIds)->delete();
            $this->command->info('   Cleaned old Interior Design subjects.');
        }

        // ─── Define all courses across 8 semesters ─────────────────────
        // hours_t_p format: "theoretical/practical"
        // Supporting courses are merged into their respective semesters
        // Elective courses are placed in semester 8
        $curriculum = [
            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 1
            // ═══════════════════════════════════════════════════════════════
            1 => [
                ['code' => 'ID101',  'name' => 'رسم هندسي',       'name_en' => 'Engineering Drawing',      'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID102',  'name' => 'رسم حر',          'name_en' => 'Freehand Drawing',         'credits' => 2, 't' => 0, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID103',  'name' => 'أسس التصميم',     'name_en' => 'Design Principles',        'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'GS121',  'name' => 'لغة عربية 1',     'name_en' => 'Arabic Language 1',        'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'GS123',  'name' => 'لغة إنجليزية',    'name_en' => 'English Language',         'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'GS101ID', 'name' => 'رياضة 1',         'name_en' => 'Mathematics 1',            'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 2
            // ═══════════════════════════════════════════════════════════════
            2 => [
                ['code' => 'ID206',    'name' => 'رسم معماري',              'name_en' => 'Architectural Drawing',              'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => ['ID101'],  'type' => 'required'],
                ['code' => 'ID204',    'name' => 'منظور عام',              'name_en' => 'General Perspective',                'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID205',    'name' => 'تاريخ فنون 1',           'name_en' => 'History of Arts 1',                  'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'GS207',    'name' => 'برامج حاسوب',            'name_en' => 'Computer Programs',                  'credits' => 2, 't' => 1, 'p' => 2, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'GS122',    'name' => 'علم النفس',              'name_en' => 'Psychology',                         'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'GS227ID',  'name' => 'كتابة تقارير',           'name_en' => 'Report Writing',                     'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'ID207',    'name' => 'العوامل البشرية في التصميم', 'name_en' => 'Human Factors',                  'credits' => 3, 't' => 3, 'p' => 0, 'prereq' => null,       'type' => 'department_requirement'],
                ['code' => 'ID208',    'name' => 'التصوير والتسويق الرقمي', 'name_en' => 'Photography & Digital Marketing',   'credits' => 2, 't' => 1, 'p' => 2, 'prereq' => null,       'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 3
            // ═══════════════════════════════════════════════════════════════
            3 => [
                ['code' => 'ID313',    'name' => 'مبادئ التصميم الداخلي',   'name_en' => 'Principles of Interior Design',     'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID103', 'ID206'], 'type' => 'required'],
                ['code' => 'ID310',    'name' => 'تقنيات الإظهار',          'name_en' => 'Rendering Techniques',               'credits' => 2, 't' => 0, 'p' => 4, 'prereq' => ['ID206'],  'type' => 'required'],
                ['code' => 'ID311',    'name' => 'تقنيات مواد 1',           'name_en' => 'Materials Technology 1',              'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID314',    'name' => 'تصميم صناعي',            'name_en' => 'Industrial Design',                  'credits' => 2, 't' => 0, 'p' => 4, 'prereq' => ['ID101'],  'type' => 'required'],
                ['code' => 'ID315',    'name' => 'تاريخ التصميم الداخلي',   'name_en' => 'History of Interior Design',         'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'GS326ID',  'name' => 'إحصاء وصفي',            'name_en' => 'Descriptive Statistics',              'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'ID312',    'name' => 'حاسوب وبرامج هندسية 1',  'name_en' => 'Computer & Engineering Software 1',  'credits' => 2, 't' => 1, 'p' => 2, 'prereq' => ['ID207'],  'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 4
            // ═══════════════════════════════════════════════════════════════
            4 => [
                ['code' => 'ID419',    'name' => 'تصميم داخلي 1',          'name_en' => 'Interior Design 1',                  'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID313', 'ID314'], 'type' => 'required'],
                ['code' => 'ID421',    'name' => 'منظور وظل',              'name_en' => 'Perspective and Shade',              'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => ['ID204'],  'type' => 'required'],
                ['code' => 'ID417',    'name' => 'تصميم أثاث',             'name_en' => 'Furniture Design',                   'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID416',    'name' => 'مجسمات ونماذج 1',        'name_en' => 'Maquettes and Models 1',             'credits' => 3, 't' => 0, 'p' => 6, 'prereq' => ['ID206'],  'type' => 'required'],
                ['code' => 'ID420',    'name' => 'تقنيات الإضاءة والصوت',   'name_en' => 'Lighting and Sound Techniques',      'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'GS427ID',  'name' => 'علم الجمال والنقد',       'name_en' => 'Aesthetics and Criticism',           'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'university_requirement'],
                ['code' => 'ID418',    'name' => 'حاسوب وبرامج هندسية 2',  'name_en' => 'Computer & Engineering Software II', 'credits' => 2, 't' => 1, 'p' => 2, 'prereq' => ['ID312'],  'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 5
            // ═══════════════════════════════════════════════════════════════
            5 => [
                ['code' => 'ID523',    'name' => 'تصميم داخلي 2',                'name_en' => 'Interior Design 2',                    'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID419'],  'type' => 'required'],
                ['code' => 'ID527',    'name' => 'رسومات تنفيذية 1',             'name_en' => 'Working Drawings 1',                   'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => ['ID419'],  'type' => 'required'],
                ['code' => 'ID528',    'name' => 'تقنيات المواد 2',              'name_en' => 'Materials Technology 2',                'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => ['ID311'],  'type' => 'required'],
                ['code' => 'ID522',    'name' => 'نظريات العمارة والتصميم',       'name_en' => 'Theories of Architecture and Design',  'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID524',    'name' => 'نظم التحكم البيئي',            'name_en' => 'Environmental Control Systems',         'credits' => 3, 't' => 3, 'p' => 0, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID525',    'name' => 'تاريخ فنون 2',                'name_en' => 'History of Art II',                     'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => ['ID205'],  'type' => 'department_requirement'],
                ['code' => 'ID526',    'name' => 'أخلاقيات ممارسة المهنة',       'name_en' => 'Professional Practice Ethics',          'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,       'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 6
            // ═══════════════════════════════════════════════════════════════
            6 => [
                ['code' => 'ID630',    'name' => 'تصميم داخلي 3',              'name_en' => 'Interior Design 3',                  'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID523'],  'type' => 'required'],
                ['code' => 'ID632',    'name' => 'ورشة تصميم',                 'name_en' => 'Design Workshop',                    'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID528'],  'type' => 'required'],
                ['code' => 'ID631',    'name' => 'تصميم وتنسيق حدائق',         'name_en' => 'Landscape Design',                   'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID633',    'name' => 'تصميم المكملات الداخلية',     'name_en' => 'Interior Accessories Design',        'credits' => 2, 't' => 0, 'p' => 4, 'prereq' => null,       'type' => 'required'],
                ['code' => 'ID629',    'name' => 'الإظهار الجرافيكي الرقمي',    'name_en' => 'Digital Graphical Rendering',        'credits' => 2, 't' => 1, 'p' => 2, 'prereq' => ['ID418'],  'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 7
            // ═══════════════════════════════════════════════════════════════
            7 => [
                ['code' => 'ID735',    'name' => 'التصميم الداخلي 4',                          'name_en' => 'Interior Design 4',                                        'credits' => 4, 't' => 0, 'p' => 8, 'prereq' => ['ID630'],           'type' => 'required'],
                ['code' => 'ID736',    'name' => 'رسومات تنفيذية 2',                           'name_en' => 'Working Drawings 2',                                       'credits' => 3, 't' => 1, 'p' => 4, 'prereq' => ['ID630', 'ID527'],  'type' => 'required'],
                ['code' => 'ID737',    'name' => 'حساب الكلفة والمواصفات',                      'name_en' => 'Quantity Surveying and Specifications',                    'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,                'type' => 'required'],
                ['code' => 'ID738',    'name' => 'ترميم وتأهيل المباني الأثرية',                'name_en' => 'Restoration and Rehabilitation of Historic Buildings',     'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,                'type' => 'required'],
                ['code' => 'ID734',    'name' => 'حلقة نقاش',                                  'name_en' => 'Seminar',                                                  'credits' => 2, 't' => 2, 'p' => 0, 'prereq' => null,                'type' => 'department_requirement'],
            ],

            // ═══════════════════════════════════════════════════════════════
            // SEMESTER 8
            // ═══════════════════════════════════════════════════════════════
            8 => [
                ['code' => 'ID839',    'name' => 'التصميم الداخلي 5',                   'name_en' => 'Interior Design 5',                    'credits' => 4, 't' => 0, 'p' => 8,  'prereq' => ['ID735'],  'type' => 'required'],
                ['code' => 'ID840',    'name' => 'مجسمات ونماذج 2',                     'name_en' => 'Maquettes and Models 2',               'credits' => 3, 't' => 0, 'p' => 6,  'prereq' => ['ID416'],  'type' => 'required'],
                ['code' => 'ID841',    'name' => 'إدارة مشاريع',                        'name_en' => 'Project Management',                   'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,       'type' => 'required'],
                ['code' => 'GS499ID',  'name' => 'مشروع تخرج',                          'name_en' => 'Graduation Project',                   'credits' => 8, 't' => 0, 'p' => 16, 'prereq' => null,       'type' => 'required', 'min_units' => 109],
                // Elective courses (student picks one or more to complete 117 units)
                ['code' => 'ID842',    'name' => 'الاستدامة والعمارة الخضراء',           'name_en' => 'Sustainability & Green Architecture', 'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,       'type' => 'elective'],
                ['code' => 'ID843',    'name' => 'التفكير التصميمي',                     'name_en' => 'Design Thinking',                     'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,       'type' => 'elective'],
                ['code' => 'ID844',    'name' => 'سيكولوجية التصميم',                    'name_en' => 'Design Psychology',                   'credits' => 2, 't' => 2, 'p' => 0,  'prereq' => null,       'type' => 'elective'],
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
        $this->command->info('   📊 Interior Design Summary:');
        $this->command->info("      Department: {$department->name} ({$department->name_en})");
        $this->command->info("      Semesters: " . count($curriculum));
        $this->command->info("      Total Subjects: " . count($subjectMap));
        $this->command->info("      Total Units: {$totalUnits}");
        $this->command->info("      Prerequisites: {$prereqCount}");
        $this->command->info('   ✅ Interior Design seeding complete!');
    }
}
