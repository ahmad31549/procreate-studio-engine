@extends('layouts.app')

@section('title', 'THOR REBRAND TOOL - Access')

@section('content')
<div class="fade-in" style="display: flex; align-items: center; justify-content: center; min-height: 80vh; padding: 20px 0;">
    <div class="studio-card" style="width: min(100%, 450px); padding: 32px; margin: 0; box-shadow: var(--shadow-lg);">
        
        <!-- Tab Toggle -->
        <div style="display: flex; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 4px; margin-bottom: 28px;">
            <button id="loginTab" onclick="showAuth('login')" style="flex: 1; height: 40px; border: none; border-radius: 9px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.3s ease; background: transparent; color: var(--text-dim); outline: none;">Sign In</button>
            <button id="registerTab" onclick="showAuth('register')" style="flex: 1; height: 40px; border: none; border-radius: 9px; cursor: pointer; font-weight: 700; font-size: 0.85rem; transition: all 0.3s ease; background: var(--primary); color: #000; outline: none;">Register</button>
        </div>

        <!-- Login Form -->
        <div id="loginSection" style="display: none;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 class="section-title" style="font-size: 1.25rem;">Welcome Back</h2>
                <p class="drop-subtext" style="font-size: 0.8rem;">Enter your credentials to access the studio.</p>
            </div>

            <form method="POST" action="{{ route('login') }}" class="control-group" style="gap: 16px;">
                @csrf
                <div class="control-group">
                    <label class="control-label" style="font-size: 0.7rem;">Email</label>
                    <input type="email" name="email" class="text-input" style="height: 48px;" placeholder="Email address" value="{{ old('email') }}" required autofocus>
                    @error('email') <p class="drop-subtext" style="color: var(--error); font-size: 0.7rem; margin-top: 2px;">{{ $message }}</p> @enderror
                </div>

                <div class="control-group">
                    <label class="control-label" style="font-size: 0.7rem;">Password</label>
                    <input type="password" name="password" class="text-input" style="height: 48px;" placeholder="••••••••" required>
                    @error('password') <p class="drop-subtext" style="color: var(--error); font-size: 0.7rem; margin-top: 2px;">{{ $message }}</p> @enderror
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); cursor: pointer;">
                        <input type="checkbox" name="remember" style="accent-color: var(--primary)"> Remember
                    </label>
                    <a href="{{ route('password.request') }}" class="nav-link" style="font-size: 0.75rem;">Forgot?</a>
                </div>

                <button type="submit" class="btn btn-primary" style="height: 48px; width: 100%; margin-top: 8px;">Access Engine</button>
            </form>
        </div>

        <!-- Register Form -->
        <div id="registerSection">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 class="section-title" style="font-size: 1.25rem;">Create Account</h2>
                <p class="drop-subtext" style="font-size: 0.8rem;">Start your rebranding journey today.</p>
            </div>

            <form method="POST" action="{{ route('register') }}" class="control-group" style="gap: 12px; width: 100%;">
                @csrf
                <div class="control-group">
                    <label class="control-label" style="font-size: 0.7rem;">Full Name</label>
                    <input type="text" name="name" class="text-input" style="height: 44px; font-size: 0.9rem;" placeholder="Operator Name" value="{{ old('name') }}" required>
                    @error('name') <p class="drop-subtext" style="color: var(--error); font-size: 0.7rem; margin-top: 2px;">{{ $message }}</p> @enderror
                </div>

                <div class="control-group">
                    <label class="control-label" style="font-size: 0.7rem;">Email</label>
                    <input type="email" name="email" class="text-input" style="height: 44px; font-size: 0.9rem;" placeholder="Email" value="{{ old('email') }}" required>
                    @error('email') <p class="drop-subtext" style="color: var(--error); font-size: 0.7rem; margin-top: 2px;">{{ $message }}</p> @enderror
                </div>

                <div style="display: flex; gap: 12px; width: 100%;">
                    <div class="control-group" style="flex: 1; min-width: 0;">
                        <label class="control-label" style="font-size: 0.7rem;">Password</label>
                        <input type="password" name="password" class="text-input" style="height: 44px; font-size: 0.9rem; width: 100%;" placeholder="Create Key" required>
                    </div>
                    <div class="control-group" style="flex: 1; min-width: 0;">
                        <label class="control-label" style="font-size: 0.7rem;">Confirm</label>
                        <input type="password" name="password_confirmation" class="text-input" style="height: 44px; font-size: 0.9rem; width: 100%;" placeholder="Repeat" required>
                    </div>
                </div>
                @error('password') <p class="drop-subtext" style="color: var(--error); font-size: 0.7rem; margin-top: 2px;">{{ $message }}</p> @enderror

                <button type="submit" class="btn btn-primary" style="height: 48px; width: 100%; margin-top: 12px;">Register & Launch</button>
            </form>
        </div>
    </div>
</div>

<script>
function showAuth(type) {
    const loginSec = document.getElementById('loginSection');
    const registerSec = document.getElementById('registerSection');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');

    if (type === 'login') {
        loginSec.style.display = 'block';
        registerSec.style.display = 'none';
        loginTab.style.background = 'var(--primary)';
        loginTab.style.color = '#000';
        registerTab.style.background = 'transparent';
        registerTab.style.color = 'var(--text-dim)';
    } else {
        loginSec.style.display = 'none';
        registerSec.style.display = 'block';
        registerTab.style.background = 'var(--primary)';
        registerTab.style.color = '#000';
        loginTab.style.background = 'transparent';
        loginTab.style.color = 'var(--text-dim)';
    }
}

// Auto-switch based on errors or route
@if (($errors->has('name') || $errors->has('password')) && old('name'))
    showAuth('register');
@elseif ($errors->has('email') || $errors->has('password'))
    showAuth('login');
@endif

if(window.location.hash === '#login' || (window.location.pathname === '/login' && !window.location.hash)) {
    showAuth('login');
} else if (window.location.hash === '#register' || window.location.pathname === '/register') {
    showAuth('register');
}
</script>
@endsection
