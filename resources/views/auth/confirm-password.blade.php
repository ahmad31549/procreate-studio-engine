@extends('layouts.app')

@section('title', 'Procreate Rebrand Studio - Confirm Password')

@section('content')
<div class="hero fade-in">
    <span class="badge">Security Verification</span>
    <h1 class="hero-title">Security Check</h1>
    <p class="hero-desc">You are entering a secure area. Please confirm your password to proceed.</p>
</div>

<div class="studio-card fade-in" style="width: min(100%, 450px); margin: 0 auto 60px;">
    <form method="POST" action="{{ route('password.confirm') }}" class="control-group" style="gap: 24px;">
        @csrf
        
        <div class="control-group">
            <label for="password" class="control-label">Your Password</label>
            <input id="password" type="password" name="password" class="text-input" placeholder="••••••••" required autofocus autocomplete="current-password">
            @error('password') <p class="drop-subtext" style="color: var(--error); margin-top: 4px;">{{ $message }}</p> @enderror
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 12px;">Confirm & Access</button>

        <p class="drop-subtext" style="text-align: center; margin-top: 8px;">
            <a href="/" class="nav-link" style="color: var(--primary); text-decoration: underline;">Cancel and go back</a>
        </p>
    </form>
</div>
@endsection
