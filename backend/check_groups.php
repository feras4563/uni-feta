<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\StudentSemesterRegistration;
use App\Models\StudentGroup;

$registrations = StudentSemesterRegistration::count();
$groups = StudentGroup::count();

echo "Semester Registrations: {$registrations}\n";
echo "Student Groups: {$groups}\n\n";

$allGroups = StudentGroup::all();
foreach ($allGroups as $group) {
    echo "Group: {$group->group_name}\n";
    echo "  Department: {$group->department_id}\n";
    echo "  Semester: {$group->semester_id}\n";
    echo "  Current Students: {$group->current_students}\n\n";
}
