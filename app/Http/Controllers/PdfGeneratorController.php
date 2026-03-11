<?php

namespace App\Http\Controllers;

use App\Models\PdfRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PdfGeneratorController extends Controller
{
    public function index()
    {
        $records = PdfRecord::where('user_id', Auth::id())
            ->latest()
            ->get();

        return view('pdf-records', compact('records'));
    }

    public function dashboard()
    {
        $records = PdfRecord::where('user_id', Auth::id())
            ->latest()
            ->get();

        return view('dashboard', compact('records'));
    }

    public function create(Request $request)
    {
        $preset = $request->query('preset');
        $record = null;

        if ($preset === 'drdoom') {
            $record = new PdfRecord();
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
            $record = new PdfRecord([
                'store_name' => 'ThorPresets',
                'store_link' => 'etsy.com/shop/ThorPresets',
                'title' => 'ThorPresets-Download-Card',
                'theme' => 'gold-style',
            ]);
        }

        $defaults = PdfRecord::where('user_id', Auth::id())->latest()->first();

        return view('pdf-generator', ['record' => $record, 'defaults' => $defaults]);
    }

    public function edit($id)
    {
        $record = PdfRecord::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

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
            $record = PdfRecord::where('id', $request->id)
                ->where('user_id', Auth::id())
                ->firstOrFail();
            $record->update($data);
            $msg = 'Record updated.';
        } else {
            $record = PdfRecord::create($data);
            $msg = 'PDF record saved.';
        }

        return response()->json(['success' => true, 'id' => $record->id, 'message' => $msg]);
    }

    public function preview($id)
    {
        $record = PdfRecord::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return view('pdf-preview', compact('record'));
    }

    public function destroy($id)
    {
        PdfRecord::where('id', $id)
            ->where('user_id', Auth::id())
            ->delete();

        return redirect()->route('pdf.index')->with('success', 'Record deleted.');
    }
}
