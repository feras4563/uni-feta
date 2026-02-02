<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentSemesterRegistration;
use App\Models\StudentGroup;

// Find all registrations without groups
$registrationsWithoutGroups = StudentSemesterRegistration::whereNull('group_id')->get();

echo "Found {$registrationsWithoutGroups->count()} registrations without groups\n\n";

foreach ($registrationsWithoutGroups as $reg) {
    // Create or find group
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
    
    // Assign group to registration
    $reg->group_id = $group->id;
    $reg->save();
    
    echo "Assigned registration {$reg->id} to group {$group->group_name}\n";
}

// Update all group counts
echo "\nUpdating group counts...\n";
$groups = StudentGroup::all();
foreach ($groups as $group) {
    $count = StudentSemesterRegistration::where('group_id', $group->id)->count();
    $group->current_students = $count;
    $group->save();
    echo "Group {$group->group_name}: {$count} students\n";
}

echo "\n=== Final Status ===\n";
echo "Total Groups: " . StudentGroup::count() . "\n";
echo "Total Registrations: " . StudentSemesterRegistration::count() . "\n";
echo "Registrations without groups: " . StudentSemesterRegistration::whereNull('group_id')->count() . "\n";

echo "\nDone!\n";
