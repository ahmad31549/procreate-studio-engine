@extends('layouts.app')

@section('title', 'Select Your Studio - THOR REBRAND TOOL')

@section('content')
<div class="hero fade-in">
    <span class="badge">Studio Workspace</span>
    <h1 class="hero-title">Select Your Tool</h1>
    <p class="hero-desc">Choose the specialized engine you want to launch for your next project.</p>
</div>

<div class="fade-in" style="max-width: 1000px; margin: 0 auto 60px;">
    <div class="file-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px;">
        
        <!-- PROCREATE STUDIO -->
        @php $hasProcreate = auth()->user()->hasToolAccess('procreate_studio'); @endphp
        <a href="{{ $hasProcreate ? route('studio.procreate') : '#' }}" 
           class="studio-card selection-card {{ $hasProcreate ? 'active-studio' : 'locked-studio' }}" 
           style="text-decoration: none; border-color: {{ $hasProcreate ? 'var(--primary)' : 'var(--border-color)' }}; background: {{ $hasProcreate ? 'rgba(249, 115, 22, 0.05)' : 'rgba(255,255,255,0.02)' }};">
            
            @if(!$hasProcreate)
                <div style="position: absolute; top: 12px; right: 12px;">
                    <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: var(--error); border-color: var(--error); font-size: 0.65rem; margin: 0;">Access Required</span>
                </div>
            @endif

            <div class="section-label">
                <div class="step-number" style="background: {{ $hasProcreate ? 'var(--primary)' : 'var(--text-dim)' }}">🎨</div>
                <h2 class="section-title">Procreate Rebrand Studio</h2>
            </div>
            <p class="drop-subtext" style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                The flagship engine for rebranding brushes, swatches, and .procreate files with custom metadata.
            </p>
            <div class="btn {{ $hasProcreate ? 'btn-primary' : 'btn-secondary' }}" style="height: 44px; width: 100%; font-size: 0.9rem; {{ $hasProcreate ? '' : 'cursor: not-allowed; opacity: 0.6;' }}">
                {{ $hasProcreate ? 'Launch Studio' : '🔒 Locked' }}
            </div>
        </a>

        <!-- ETSY PDF LAB -->
        @php $hasPdf = auth()->user()->hasToolAccess('pdf_lab'); @endphp
        <a href="{{ $hasPdf ? route('pdf.index') : '#' }}" 
           class="studio-card selection-card {{ $hasPdf ? 'active-studio' : 'locked-studio' }}" 
           style="text-decoration: none; border-color: {{ $hasPdf ? 'var(--secondary)' : 'var(--border-color)' }}; background: {{ $hasPdf ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)' }};">
            
            @if(!$hasPdf)
                <div style="position: absolute; top: 12px; right: 12px;">
                    <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: var(--error); border-color: var(--error); font-size: 0.65rem; margin: 0;">Access Required</span>
                </div>
            @endif

            <div class="section-label">
                <div class="step-number" style="background: {{ $hasPdf ? 'var(--secondary)' : 'var(--text-dim)' }}">📄</div>
                <h2 class="section-title">Etsy PDF Lab</h2>
            </div>
            <p class="drop-subtext" style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                Automated PDF watermarking and branding for digital products and listing assets.
            </p>
            <div class="btn {{ $hasPdf ? 'btn-secondary' : 'btn-secondary' }}" style="height: 44px; width: 100%; font-size: 0.9rem; {{ $hasPdf ? '' : 'cursor: not-allowed; opacity: 0.6;' }}">
                {{ $hasPdf ? 'Launch Lab' : '🔒 Locked' }}
            </div>
        </a>

        <!-- GRAPHIC REBRAND STUDIO -->
        @php $hasGraphic = auth()->user()->hasToolAccess('graphic_rebrand'); @endphp
        <div class="studio-card selection-card {{ $hasGraphic ? 'active-studio' : 'locked-studio' }}" style="border-color: var(--border-color); background: rgba(255,255,255,0.02);">
            <div style="position: absolute; top: 12px; right: 12px; display: flex; gap: 6px;">
                @if(!$hasGraphic)
                    <span class="badge" style="background: rgba(239, 68, 68, 0.2); color: var(--error); border-color: var(--error); font-size: 0.65rem; margin: 0;">Access Required</span>
                @endif
                <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: var(--success); border-color: var(--success); font-size: 0.65rem; margin: 0;">Coming Soon</span>
            </div>
            <div class="section-label">
                <div class="step-number" style="background: var(--text-dim)">🖼️</div>
                <h2 class="section-title">Graphic Rebrand</h2>
            </div>
            <p class="drop-subtext" style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 20px;">
                Bulk brand application for vector assets, mockups, and visual design templates.
            </p>
            <div class="btn btn-secondary" style="height: 44px; width: 100%; font-size: 0.9rem; cursor: not-allowed; opacity: 0.6;">
                Coming Soon
            </div>
        </div>

    </div>
</div>

<style>
    .selection-card {
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        position: relative;
    }
    .locked-studio {
        cursor: not-allowed;
        filter: grayscale(0.5);
    }
    .active-studio:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(249, 115, 22, 0.1);
        border-color: var(--primary) !important;
    }
</style>
@endsection
