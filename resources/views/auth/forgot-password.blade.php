@extends('layouts.app')

@section('title', 'THOR REBRAND TOOL - Forgot Password')

@section('content')
<div class="fade-in" style="display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: 20px 0;">
    <div class="studio-card" style="width: min(100%, 420px); padding: 32px; margin: 0;">
        <div style="text-align: center; margin-bottom: 24px;">
            <span class="badge" style="margin-bottom: 8px;">Security Recovery</span>
            <h1 class="section-title" style="font-size: 1.5rem;">Reset Access</h1>
        </div>

        @if (session('status'))
            <div class="badge" style="display: block; width: 100%; text-align: center; margin-bottom: 24px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--success); text-transform: none;">
                Recovery email has been dispatched.
            </div>
        @else
            <p class="drop-subtext" style="text-align: center; margin-bottom: 24px;">Enter your email to receive a recovery link.</p>
        @endif

        <form method="POST" action="{{ route('password.email') }}" class="control-group" style="gap: 16px;">
            @csrf
            
            <div class="control-group">
                <label for="email" class="control-label" style="font-size: 0.7rem;">Verified Email</label>
                <input id="email" type="email" name="email" class="text-input" style="height: 48px;" placeholder="you@example.com" value="{{ old('email') }}" required autofocus autocomplete="username">
                @error('email') <p class="drop-subtext" style="color: var(--error); margin-top: 4px; font-size: 0.7rem;">{{ $message }}</p> @enderror
            </div>

            <button type="submit" class="btn btn-primary" style="height: 48px; margin-top: 12px; width: 100%;">Send Recovery Link</button>

            <p class="drop-subtext" style="text-align: center; margin-top: 16px; font-size: 0.8rem;">
                <a href="/login" class="nav-link" style="color: var(--primary); text-decoration: underline;">Back to Sign In</a>
            </p>
        </form>
    </div>
</div>
@endsection
