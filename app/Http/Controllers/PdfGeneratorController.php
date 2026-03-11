<?php

namespace App\Http\Controllers;

// use App\Models\PdfRecord; // Removed to use file-based storage
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PdfGeneratorController extends Controller
{
    public function index()
    {
        $records = $this->getRecords();

        return view('pdf-records', compact('records'));
    }

    public function dashboard()
    {
        $records = $this->getRecords();

        return view('dashboard', compact('records'));
    }

    public function create(Request $request)
    {
        $preset = $request->query('preset');
        $record = null;

        if ($preset === 'drdoom') {
            $record = (object)[];
            $record->id = null;
            $record->store_name = 'DrDOOMARTS';
            $record->store_link = 'etsy.com/shop/DrDOOMARTS';
            $record->created_by = 'Independent Artist';
            $record->title = 'DrDOOMARTS-Procreate-Guide';
            $record->theme = 'black-style';
            $record->pdf_mode = 'dark';
            $record->welcome_title = 'Your Procreate Brush Library Is Ready';
            $record->welcome_msg = 'Thank you for supporting independent art. Every brush in this set was created, tested, and packed by a working digital artist for a smooth Procreate experience on iPad.';
            $record->products = [[
                'name' => 'Procreate Brushset Download',
                'link' => '',
                'type' => '🎨',
                'desc' => 'Artist-crafted .brushset file · Instant digital delivery · Ready for Procreate on iPad',
            ]];
            $record->step1 = 'Tap the download button below and save your .brushset or ZIP file to the Files app on your iPad.';
            $record->step2 = 'Open Files, find the download, and tap it once. Procreate will launch and begin importing automatically.';
            $record->step3 = 'Open your Brush Library in Procreate and start creating. If you need help, send me a message on Etsy and I will guide you.';
        } elseif ($preset === 'thor') {
            $record = (object)[
                'id' => null,
                'store_name' => 'ThorPresets',
                'store_link' => 'etsy.com/shop/ThorPresets',
                'title' => 'ThorPresets-Download-Card',
                'theme' => 'gold-style',
            ];
        }

        $defaults = $this->getRecords()->first();

        return view('pdf-generator', ['record' => $record, 'defaults' => $defaults]);
    }

    public function edit($id)
    {
        $record = $this->getRecordById($id);
        if (!$record) abort(404);

        return view('pdf-generator', compact('record'));
    }

    public function save(Request $request)
    {
        $request->validate([
            'store_name' => 'required|string|max:200',
            'products' => 'required|array|min:1',
        ]);

        $data = [
            'user_id' => Auth::id(),
            'title' => $request->input('title', $request->input('store_name') . ' - PDF'),
            'store_name' => $request->store_name,
            'store_link' => $request->store_link,
            'created_by' => $request->input('created_by'),
            'welcome_title' => $request->input('welcome_title', 'Your Files are Ready! ✨'),
            'welcome_msg' => $request->welcome_msg,
            'theme' => $request->input('theme', 'gd'),
            'pdf_mode' => $request->input('pdf_mode', 'light'),
            'products' => $request->products,
            'message' => $request->message,
            'step1' => $request->step1,
            'step2' => $request->step2,
            'step3' => $request->step3,
            'show_review' => $request->boolean('show_review', true),
            'review_text' => $request->input('review_text', 'Your feedback helps our small shop grow!'),
        ];

        if ($request->filled('id')) {
            $id = $request->id;
            $record = $this->getRecordById($id);
            if (!$record) abort(404);
            
            $data['id'] = $id;
            $data['updated_at'] = now()->toDateTimeString();
            $data['created_at'] = $record->created_at ?? $data['updated_at'];
            
            $this->saveRecord($id, $data);
            $msg = 'Record updated.';
        } else {
            $id = (string) Str::uuid();
            $data['id'] = $id;
            $data['created_at'] = now()->toDateTimeString();
            $data['updated_at'] = $data['created_at'];
            
            $this->saveRecord($id, $data);
            $msg = 'PDF record saved.';
        }

        return response()->json(['success' => true, 'id' => $id, 'message' => $msg]);
    }

    public function preview($id)
    {
        $record = $this->getRecordById($id);
        if (!$record) abort(404);

        return view('pdf-preview', compact('record'));
    }

    public function destroy($id)
    {
        $this->deleteRecord($id);

        return redirect()->route('pdf.index')->with('success', 'Record deleted.');
    }

    private function getRecordsPath()
    {
        $path = storage_path('app/pdf_records/' . Auth::id());
        if (!file_exists($path)) @mkdir($path, 0755, true);
        return $path;
    }

    private function getRecords()
    {
        $path = $this->getRecordsPath();
        $files = glob($path . '/*.json');
        $records = [];
        foreach ($files as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data) {
                $data['id'] = basename($file, '.json');
                $records[] = (object) $data;
            }
        }
        usort($records, function($a, $b) {
            return strtotime($b->created_at ?? '0') <=> strtotime($a->created_at ?? '0');
        });
        return collect($records);
    }

    private function getRecordById($id)
    {
        $path = $this->getRecordsPath() . '/' . $id . '.json';
        if (!file_exists($path)) return null;
        $data = json_decode(file_get_contents($path), true);
        if ($data) {
            $data['id'] = $id;
            return (object) $data;
        }
        return null;
    }

    private function saveRecord($id, $data)
    {
        $path = $this->getRecordsPath() . '/' . $id . '.json';
        file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
    }

    private function deleteRecord($id)
    {
        $path = $this->getRecordsPath() . '/' . $id . '.json';
        if (file_exists($path)) @unlink($path);
    }
}
