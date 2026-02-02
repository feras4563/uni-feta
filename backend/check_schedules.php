<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Class Schedules ===\n";
$schedules = \App\Models\ClassSchedule::with('teacher')->get();
echo "Total: " . $schedules->count() . "\n\n";

foreach ($schedules as $schedule) {
    echo "Teacher: " . ($schedule->teacher ? $schedule->teacher->name : 'No teacher') . "\n";
    echo "Day: " . $schedule->day_of_week . " | Time: " . $schedule->start_time . " - " . $schedule->end_time . "\n";
    echo "Subject: " . ($schedule->subject_id ?? 'NULL (availability)') . "\n";
    echo "---\n";
}

echo "\n=== Teacher Subjects ===\n";
$assignments = \App\Models\TeacherSubject::with(['teacher', 'subject'])->get();
echo "Total: " . $assignments->count() . "\n\n";

foreach ($assignments as $assignment) {
    echo "Teacher: " . $assignment->teacher->name . "\n";
    echo "Subject: " . $assignment->subject->name . "\n";
    echo "Teacher ID: " . $assignment->teacher_id . "\n";
    echo "---\n";
}
