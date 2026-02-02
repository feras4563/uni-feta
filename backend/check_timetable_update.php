<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get a specific timetable entry to check
$entryId = $argv[1] ?? null;

if (!$entryId) {
    echo "Usage: php check_timetable_update.php <entry_id>\n";
    exit(1);
}

$entry = \App\Models\TimetableEntry::with(['subject', 'teacher', 'room', 'group'])
    ->find($entryId);

if (!$entry) {
    echo "Entry not found\n";
    exit(1);
}

echo "=== Timetable Entry ===\n";
echo "ID: " . $entry->id . "\n";
echo "Subject: " . ($entry->subject ? $entry->subject->name : 'N/A') . "\n";
echo "Teacher: " . ($entry->teacher ? $entry->teacher->name : 'N/A') . "\n";
echo "Room: " . ($entry->room ? $entry->room->name : 'N/A') . "\n";
echo "Group: " . ($entry->group ? $entry->group->name : 'N/A') . "\n";
echo "Day: " . $entry->day_of_week . " (" . ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$entry->day_of_week] . ")\n";
echo "Time: " . $entry->start_time . " - " . $entry->end_time . "\n";
echo "Active: " . ($entry->is_active ? 'Yes' : 'No') . "\n";
echo "Notes: " . ($entry->notes ?? 'N/A') . "\n";
