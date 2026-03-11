@extends('layouts.app')

@section('title', 'Procreate Rebrand Studio - Reset Password')

@section('content')
<div class="hero fade-in">
    <span class="badge">Security Override</span>
    <h1 class="hero-title">New Password</h1>
    <p class="hero-desc">Create a strong new password for your account to finalize the reset.</p>
</div>

<div class="studio-card fade-in" style="width: min(100%, 450px); margin: 0 auto 60px;">
    <form method="POST" action="{{ route('password.store') }}" class="control-group" style="gap: 24px;">
        @csrf
        
        <input type="hidden" name="token" value="{{ $request->route('token') }}">

        <div class="control-group">
            <label for="email" class="control-label">Your Email Address</label>
            <input id="email" type="email" name="email" class="text-input" value="{{ old('email', $request->email) }}" required autofocus autocomplete="username">
            @error('email') <p class="drop-subtext" style="color: var(--error); margin-top: 4px;">{{ $message }}</p> @enderror
        </div>

        <div class="control-group">
            <label for="password" class="control-label">New Password</label>
            <input id="password" type="password" name="password" class="text-input" placeholder="••••••••" required autocomplete="new-password">
            @error('password') <p class="drop-subtext" style="color: var(--error); margin-top: 4px;">{{ $message }}</p> @enderror
        </div>

        <div class="control-group">
            <label for="password_confirmation" class="control-label">Confirm New Password</label>
            <input id="password_confirmation" type="password" name="password_confirmation" class="text-input" placeholder="••••••••" required autocomplete="new-password">
        </div>

        <button type="submit" class="btn btn-primary" style="margin-top: 12px;">Reset Password Now</button>

        <p class="drop-subtext" style="text-align: center; margin-top: 8px;">
            <a href="/login" class="nav-link" style="color: var(--primary); text-decoration: underline;">Cancel and login</a>
        </p>
    </form>
</div>
@endsection
