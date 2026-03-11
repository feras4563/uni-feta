<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Subject;
use App\Models\SubjectDepartment;
use App\Models\SubjectPrerequisite;
use Illuminate\Database\Seeder;

class VisualArtsDigitalMediaSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🎬 Seeding Visual Arts and Digital Media Department...');

        $targetName = 'قسم الفنون البصرية والإعلام الرقمي';
        $legacyNames = ['الفنون البصرية و الوسائط المتعددة'];

        $department = Department::where('name', $targetName)->first();

        if (!$department) {
            $department = Department::whereIn('name', $legacyNames)->first();
        }

        $departmentData = [
            'name' => $targetName,
            'name_en' => 'Department of Visual Arts and Digital Media',
            'description' => 'قسم الفنون البصرية والإعلام الرقمي',
            'location' => 'Janzur Campus',
            'structure' => '1+1+2 (Foundation + Core + Specialization)',
            'semester_count' => 8,
            'is_active' => true,
        ];

        if (!$department) {
            $department = Department::create($departmentData);
        } else {
            $department->update($departmentData);
        }

        // Remove old curriculum (including legacy department records) before reseeding
        $relatedDepartmentIds = Department::whereIn('name', array_merge([$targetName], $legacyNames))
            ->pluck('id');

        if ($relatedDepartmentIds->isEmpty()) {
            $relatedDepartmentIds = collect([$department->id]);
        }

        $oldSubjectIds = Subject::whereIn('department_id', $relatedDepartmentIds)->pluck('id');
        if ($oldSubjectIds->isNotEmpty()) {
            SubjectPrerequisite::whereIn('subject_id', $oldSubjectIds)
                ->orWhereIn('prerequisite_id', $oldSubjectIds)
                ->delete();

            SubjectDepartment::whereIn('subject_id', $oldSubjectIds)->delete();
            Subject::whereIn('id', $oldSubjectIds)->delete();

            $this->command->info('   Cleaned old department subjects.');
        }

        $curriculum = [
            // Shared curriculum (Semesters 1-4)
            1 => [
                ['code' => 'UNAR 101', 'name' => 'لغة عربية (1)', 'credits' => 2, 'type' => 'university_requirement'],
                ['code' => 'UNEN 102', 'name' => 'لغة إنجليزية (1)', 'credits' => 3, 'type' => 'university_requirement'],
                ['code' => 'DEVA 103', 'name' => 'مبادئ الرسم والمنظور', 'credits' => 3, 'type' => 'required'],
                ['code' => 'DEVA 104', 'name' => 'نظرية اللون والتكوين', 'credits' => 3, 'type' => 'required'],
                ['code' => 'DEVA 105', 'name' => 'مدخل إلى الإعلام الجديد', 'credits' => 2, 'type' => 'required'],
                ['code' => 'UNCS 106', 'name' => 'مهارات الحاسوب والبحث', 'credits' => 2, 'type' => 'university_requirement'],
            ],
            2 => [
                ['code' => 'UNIS 107', 'name' => 'ثقافة إسلامية', 'credits' => 2, 'type' => 'university_requirement'],
                ['code' => 'UNEN 108', 'name' => 'لغة إنجليزية (تخصصية)', 'credits' => 3, 'type' => 'university_requirement', 'prereq' => ['UNEN 102']],
                ['code' => 'DEVA 109', 'name' => 'أساسيات التصوير الضوئي', 'credits' => 3, 'type' => 'required'],
                ['code' => 'DEVA 110', 'name' => 'مبادئ التصميم الجرافيكي', 'credits' => 3, 'type' => 'required', 'prereq' => ['DEVA 104']],
                ['code' => 'DEVA 111', 'name' => 'تاريخ الفن والحضارة', 'credits' => 2, 'type' => 'required'],
                ['code' => 'DEVA 112', 'name' => 'التفكير الإبداعي وحل المشكلات', 'credits' => 2, 'type' => 'required'],
            ],
            3 => [
                ['code' => 'DEVA 201', 'name' => 'المونتاج الرقمي (1)', 'credits' => 3, 'type' => 'required', 'prereq' => ['DEVA 110']],
                ['code' => 'DEVA 202', 'name' => 'سيكولوجية الاتصال البصري', 'credits' => 2, 'type' => 'required', 'prereq' => ['DEVA 105']],
                ['code' => 'DEVA 203', 'name' => 'تقنيات الرسم والوسائط المختلطة', 'credits' => 3, 'type' => 'required', 'prereq' => ['DEVA 103']],
                ['code' => 'DEVA 204', 'name' => 'تصميم الهوية البصرية', 'credits' => 3, 'type' => 'required', 'prereq' => ['DEVA 110']],
                ['code' => 'DEVA 205', 'name' => 'تشريعات وأخلاقيات المهنة', 'credits' => 2, 'type' => 'required'],
            ],
            4 => [
                ['code' => 'DEVA 206', 'name' => 'تصوير الفيديو والسينما', 'credits' => 3, 'type' => 'required', 'prereq' => ['DEVA 109']],
                ['code' => 'DEVA 207', 'name' => 'الكتابة للصورة والوسائط', 'credits' => 3, 'type' => 'required', 'prereq' => ['UNAR 101']],
                ['code' => 'DEVA 208', 'name' => 'جماليات التلقي والنقد', 'credits' => 2, 'type' => 'required', 'prereq' => ['DEVA 111']],
                ['code' => 'DEVA 209', 'name' => 'مبادئ التسويق', 'credits' => 3, 'type' => 'required'],
                ['code' => 'DEVA 210', 'name' => 'ورشة عمل مدمجة (مشروع صغير)', 'credits' => 2, 'type' => 'required', 'min_units' => 40],
            ],

            // Specialization stage (Semesters 5-8)
            // Fine Arts & Media
            5 => [
                ['code' => 'FA 311', 'name' => 'التصوير الزيتي المتقدم', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 203']],
                ['code' => 'FA 312', 'name' => 'فن نحت الفراغ', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 103']],
                ['code' => 'FA 313', 'name' => 'الفن الرقمي والذكاء الاصطناعي', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 110']],
                ['code' => 'FA 314', 'name' => 'سيميولوجيا الصورة', 'credits' => 2, 'type' => 'elective', 'prereq' => ['DEVA 208']],

                ['code' => 'AD 311', 'name' => 'تصميم واجهات UX/UI', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 204']],
                ['code' => 'AD 312', 'name' => 'الإنفوجرافيك وتجريد المعلومات', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 204']],
                ['code' => 'AD 313', 'name' => 'الرسوم المتحركة 2D', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 201']],
                ['code' => 'AD 314', 'name' => 'سيكولوجية الجمهور الإعلاني', 'credits' => 2, 'type' => 'elective', 'prereq' => ['DEVA 202']],

                ['code' => 'PH 311', 'name' => 'التصوير الفوتوغرافي المتقدم', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 109']],
                ['code' => 'PH 312', 'name' => 'هندسة الإضاءة الدرامية', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 206']],
                ['code' => 'PH 313', 'name' => 'لغة الكاميرا والسيناريو البصري', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 207']],
                ['code' => 'PH 314', 'name' => 'معالجة الصور الرقمية', 'credits' => 2, 'type' => 'elective', 'prereq' => ['DEVA 110']],

                ['code' => 'MM 311', 'name' => 'الصحافة الرقمية (Mojo)', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 207']],
                ['code' => 'MM 312', 'name' => 'كتابة المحتوى العابر للمنصات', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 207']],
                ['code' => 'MM 313', 'name' => 'أساسيات البودكاست والبث', 'credits' => 2, 'type' => 'elective', 'prereq' => ['DEVA 201']],
                ['code' => 'MM 314', 'name' => 'صحافة البيانات والإنفوجرافيك', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 110']],
            ],
            6 => [
                ['code' => 'FA 321', 'name' => 'الجداريات وفن الشارع', 'credits' => 3, 'type' => 'elective', 'prereq' => ['FA 311']],
                ['code' => 'FA 322', 'name' => 'الوسائط المختلطة', 'credits' => 3, 'type' => 'elective', 'prereq' => ['FA 312']],
                ['code' => 'FA 323', 'name' => 'فن الفيديو والتركيب', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 201']],
                ['code' => 'FA 324', 'name' => 'إدارة المعارض والقيادة الفنية', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'AD 321', 'name' => 'تصميم التغليف والتعليب', 'credits' => 3, 'type' => 'elective', 'prereq' => ['AD 311']],
                ['code' => 'AD 322', 'name' => 'تصميم الحملات الإعلانية', 'credits' => 3, 'type' => 'elective', 'prereq' => ['AD 314']],
                ['code' => 'AD 323', 'name' => 'التصوير الإعلاني التجاري', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 109']],
                ['code' => 'AD 324', 'name' => 'إدارة وكالات الإعلان', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'PH 321', 'name' => 'تصوير الفيديو السينمائي', 'credits' => 3, 'type' => 'elective', 'prereq' => ['PH 312']],
                ['code' => 'PH 322', 'name' => 'الإخراج السينمائي القصير', 'credits' => 3, 'type' => 'elective', 'prereq' => ['PH 313']],
                ['code' => 'PH 323', 'name' => 'هندسة الصوت والتأثيرات', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'PH 324', 'name' => 'مونتاج وتصحيح ألوان', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 201']],

                ['code' => 'MM 321', 'name' => 'إدارة منصات التواصل الاجتماعي', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 209']],
                ['code' => 'MM 322', 'name' => 'الوثائقيات الرقمية القصيرة', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 206']],
                ['code' => 'MM 323', 'name' => 'العلاقات العامة الرقمية', 'credits' => 2, 'type' => 'elective', 'prereq' => ['DEVA 202']],
                ['code' => 'MM 324', 'name' => 'الذكاء الاصطناعي في الإعلام', 'credits' => 2, 'type' => 'elective'],
            ],
            7 => [
                ['code' => 'FA 411', 'name' => 'مشروع تخرج 1 (بحث)', 'credits' => 2, 'type' => 'elective', 'min_units' => 90],
                ['code' => 'FA 412', 'name' => 'الفن التفاعلي', 'credits' => 3, 'type' => 'elective', 'prereq' => ['FA 323']],
                ['code' => 'FA 413', 'name' => 'استوديو التخصص', 'credits' => 3, 'type' => 'elective', 'prereq' => ['FA 321']],
                ['code' => 'FA 414', 'name' => 'التسويق الفني وريادة الأعمال', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'AD 411', 'name' => 'مشروع تخرج 1 (بحث)', 'credits' => 2, 'type' => 'elective', 'min_units' => 90],
                ['code' => 'AD 412', 'name' => 'التصميم البيئي ونظم الإرشاد', 'credits' => 3, 'type' => 'elective', 'prereq' => ['AD 321']],
                ['code' => 'AD 413', 'name' => 'التسويق الرقمي المتقدم', 'credits' => 3, 'type' => 'elective', 'prereq' => ['DEVA 209']],
                ['code' => 'AD 414', 'name' => 'استوديو التصميم', 'credits' => 3, 'type' => 'elective', 'prereq' => ['AD 322']],

                ['code' => 'PH 411', 'name' => 'مشروع تخرج 1 (بحث)', 'credits' => 2, 'type' => 'elective', 'min_units' => 90],
                ['code' => 'PH 412', 'name' => 'المؤثرات البصرية VFX', 'credits' => 3, 'type' => 'elective', 'prereq' => ['PH 324']],
                ['code' => 'PH 413', 'name' => 'تصوير الدراما والوثائقي', 'credits' => 3, 'type' => 'elective', 'prereq' => ['PH 321']],
                ['code' => 'PH 414', 'name' => 'إدارة الإنتاج والتوزيع', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'MM 411', 'name' => 'مشروع تخرج 1 (بحث)', 'credits' => 2, 'type' => 'elective', 'min_units' => 90],
                ['code' => 'MM 412', 'name' => 'التسويق بالمحتوى', 'credits' => 2, 'type' => 'elective', 'prereq' => ['MM 321']],
                ['code' => 'MM 413', 'name' => 'الإعلام المحلي والمجتمعي', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'MM 414', 'name' => 'التحقيق الرقمي وفحص الأخبار', 'credits' => 2, 'type' => 'elective', 'prereq' => ['MM 311']],
            ],
            8 => [
                ['code' => 'FA 421', 'name' => 'مشروع التخرج النهائي', 'credits' => 6, 'type' => 'elective', 'prereq' => ['FA 411']],
                ['code' => 'FA 422', 'name' => 'البورتفوليو والترويج الذاتي', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'FA 423', 'name' => 'التدريب الميداني', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'AD 421', 'name' => 'مشروع التخرج النهائي', 'credits' => 6, 'type' => 'elective', 'prereq' => ['AD 411']],
                ['code' => 'AD 422', 'name' => 'البورتفوليو والترويج المهني', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'AD 423', 'name' => 'التدريب الميداني', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'PH 421', 'name' => 'مشروع التخرج النهائي', 'credits' => 6, 'type' => 'elective', 'prereq' => ['PH 411']],
                ['code' => 'PH 422', 'name' => 'البورتفوليو المرئي (Showreel)', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'PH 423', 'name' => 'التدريب الميداني', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'MM 421', 'name' => 'مشروع التخرج (المنصة الرقمية)', 'credits' => 6, 'type' => 'elective', 'prereq' => ['MM 411']],
                ['code' => 'MM 422', 'name' => 'البورتفوليو الإعلامي الرقمي', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'MM 423', 'name' => 'التدريب الميداني', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'EL 601', 'name' => 'الخط العربي والزخرفة', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'EL 602', 'name' => 'التصوير الفوتوغرافي المعماري', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'EL 603', 'name' => 'مبادئ الرسوم المتحركة 3D', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'EL 604', 'name' => 'نقد السينما العالمية', 'credits' => 2, 'type' => 'elective'],

                ['code' => 'SUP DE 501', 'name' => 'إدارة المشاريع الإبداعية', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'SUP DE 502', 'name' => 'تطبيقات الذكاء الاصطناعي في الإنتاج', 'credits' => 2, 'type' => 'elective'],
                ['code' => 'SUP DE 503', 'name' => 'مهارات العرض والإلقاء', 'credits' => 2, 'type' => 'elective'],
            ],
        ];

        // Phase 1: create all subjects
        $subjectMap = [];

        foreach ($curriculum as $semesterNumber => $courses) {
            foreach ($courses as $course) {
                $subject = Subject::create([
                    'name' => $course['name'],
                    'name_en' => $course['name_en'] ?? null,
                    'code' => $course['code'],
                    'credits' => $course['credits'],
                    'weekly_hours' => $course['weekly_hours'] ?? $course['credits'],
                    'theoretical_hours' => $course['theoretical_hours'] ?? $course['credits'],
                    'practical_hours' => $course['practical_hours'] ?? 0,
                    'department_id' => $department->id,
                    'cost_per_credit' => 200.00,
                    'is_required' => $course['type'] !== 'elective',
                    'subject_type' => $course['type'],
                    'semester_number' => $semesterNumber,
                    'min_units_required' => $course['min_units'] ?? null,
                    'max_students' => 30,
                    'is_active' => true,
                ]);

                $subjectMap[$course['code']] = $subject;

                SubjectDepartment::create([
                    'subject_id' => $subject->id,
                    'department_id' => $department->id,
                    'is_primary_department' => true,
                    'is_active' => true,
                ]);
            }
        }

        $this->command->info('   ✅ ' . count($subjectMap) . ' subjects created.');

        // Phase 2: create prerequisite links
        $prereqCount = 0;
        foreach ($curriculum as $courses) {
            foreach ($courses as $course) {
                if (empty($course['prereq'])) {
                    continue;
                }

                $subject = $subjectMap[$course['code']];

                foreach ($course['prereq'] as $prereqCode) {
                    if (!isset($subjectMap[$prereqCode])) {
                        $this->command->warn("   ⚠️ Prerequisite {$prereqCode} not found for {$course['code']}");
                        continue;
                    }

                    SubjectPrerequisite::create([
                        'subject_id' => $subject->id,
                        'prerequisite_id' => $subjectMap[$prereqCode]->id,
                    ]);
                    $prereqCount++;
                }
            }
        }

        $totalUnits = collect($curriculum)->flatten(1)->sum('credits');

        $this->command->info('   ✅ ' . $prereqCount . ' prerequisite relationships created.');
        $this->command->info('');
        $this->command->info('   📊 Visual Arts & Digital Media Summary:');
        $this->command->info("      Department: {$department->name} ({$department->name_en})");
        $this->command->info('      Semesters: ' . count($curriculum));
        $this->command->info('      Total Subjects: ' . count($subjectMap));
        $this->command->info("      Total Units: {$totalUnits}");
        $this->command->info("      Prerequisites: {$prereqCount}");
        $this->command->info('   ✅ Visual Arts & Digital Media seeding complete!');
    }
}
