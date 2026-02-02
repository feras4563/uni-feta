<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentSubjectEnrollment;
use App\Models\StudentSemesterRegistration;
use App\Models\StudentGroup;

// Get all subject enrollments
$enrollments = StudentSubjectEnrollment::with(['student', 'semester', 'department'])->get();

echo "Found {$enrollments->count()} subject enrollments\n\n";

// Group by student and semester
$grouped = $enrollments->groupBy(function($item) {
    return $item->student_id . '-' . $item->semester_id;
});

foreach ($grouped as $key => $studentEnrollments) {
    $firstEnrollment = $studentEnrollments->first();
    
    // Check if semester registration already exists
    $existing = StudentSemesterRegistration::where([
        'student_id' => $firstEnrollment->student_id,
        'semester_id' => $firstEnrollment->semester_id,
    ])->first();
    
    if ($existing) {
        echo "Semester registration already exists for student {$firstEnrollment->student_id}\n";
        continue;
    }
    
    // Create or find group
    $groupName = 'المجموعة ' . $firstEnrollment->semester_number;
    $group = StudentGroup::firstOrCreate(
        [
            'department_id' => $firstEnrollment->department_id,
            'semester_id' => $firstEnrollment->semester_id,
            'semester_number' => $firstEnrollment->semester_number,
        ],
        [
            'group_name' => $groupName,
            'max_students' => 30,
            'current_students' => 0,
            'is_active' => true,
            'description' => 'مجموعة تم إنشاؤها تلقائياً للفصل الدراسي ' . $firstEnrollment->semester_number,
        ]
    );
    
    // Create semester registration
    $registration = StudentSemesterRegistration::create([
        'student_id' => $firstEnrollment->student_id,
        'semester_id' => $firstEnrollment->semester_id,
        'study_year_id' => $firstEnrollment->study_year_id,
        'department_id' => $firstEnrollment->department_id,
        'group_id' => $group->id,
        'semester_number' => $firstEnrollment->semester_number,
        'registration_date' => $firstEnrollment->enrollment_date ?? now(),
        'status' => 'active',
    ]);
    
    echo "Created semester registration for student {$firstEnrollment->student->name} in group {$group->group_name}\n";
}

// Update all group counts
echo "\nUpdating group counts...\n";
$groups = StudentGroup::all();
foreach ($groups as $group) {
    $group->current_students = StudentSemesterRegistration::where('group_id', $group->id)->count();
    $group->save();
    echo "Group {$group->group_name}: {$group->current_students} students\n";
}

echo "\nDone!\n";
