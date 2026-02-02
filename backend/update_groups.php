<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentSemesterRegistration;
use App\Models\StudentGroup;

$registrations = StudentSemesterRegistration::whereNull('group_id')->get();

echo "Found {$registrations->count()} registrations without groups\n";

foreach ($registrations as $reg) {
    $groupName = 'المجموعة ' . $reg->semester_number;
    
    $group = StudentGroup::firstOrCreate(
        [
            'department_id' => $reg->department_id,
            'semester_id' => $reg->semester_id,
            'semester_number' => $reg->semester_number,
        ],
        [
            'group_name' => $groupName,
            'max_students' => 30,
            'current_students' => 0,
            'is_active' => true,
            'description' => 'مجموعة تم إنشاؤها تلقائياً للفصل الدراسي ' . $reg->semester_number,
        ]
    );
    
    $reg->group_id = $group->id;
    $reg->save();
    
    echo "Assigned student {$reg->student_id} to group {$group->group_name}\n";
}

// Update all group counts
$groups = StudentGroup::all();
foreach ($groups as $group) {
    $group->current_students = StudentSemesterRegistration::where('group_id', $group->id)->count();
    $group->save();
    echo "Updated group {$group->group_name}: {$group->current_students} students\n";
}

echo "\nDone! Updated {$registrations->count()} registrations\n";
