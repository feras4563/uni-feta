<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FormTemplateController extends Controller
{
    private function disk()
    {
        return Storage::disk('public');
    }

    /**
     * List all available form templates.
     */
    public function index()
    {
        $files = $this->disk()->files('forms');

        $templates = [];
        foreach ($files as $file) {
            $filename = basename($file);
            $extension = pathinfo($filename, PATHINFO_EXTENSION);

            if (!in_array(strtolower($extension), ['pdf', 'docx', 'doc', 'xlsx'])) {
                continue;
            }

            $templates[] = [
                'name' => pathinfo($filename, PATHINFO_FILENAME),
                'filename' => $filename,
                'extension' => $extension,
                'size' => $this->disk()->size($file),
                'url' => '/storage/forms/' . $filename,
                'last_modified' => date('Y-m-d H:i:s', $this->disk()->lastModified($file)),
            ];
        }

        return response()->json($templates);
    }

    /**
     * Serve a form template file inline (with proper CORS via API middleware).
     */
    public function serve(string $filename)
    {
        $path = 'forms/' . $filename;

        if (!$this->disk()->exists($path)) {
            return response()->json(['message' => 'النموذج غير موجود'], 404);
        }

        $mimeTypes = [
            'pdf'  => 'application/pdf',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'doc'  => 'application/msword',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';

        return response($this->disk()->get($path), 200, [
            'Content-Type' => $mime,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }

    /**
     * Download a specific form template.
     */
    public function download(string $filename)
    {
        $path = 'forms/' . $filename;

        if (!$this->disk()->exists($path)) {
            return response()->json(['message' => 'النموذج غير موجود'], 404);
        }

        return $this->disk()->download($path, $filename);
    }
}
