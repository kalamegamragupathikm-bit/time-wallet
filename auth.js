// auth.js - Authentication & User Login Management
// Individual User Login with Email/Password, Mobile OTP & Social Auth

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.loginContainer = document.getElementById('loginContainer');
    this.appShell = document.querySelector('.app-shell');
    this.subscribers = [];
    this.otpTimer = null;
    this.otpAttempts = 0;
    
    this.initializeAuthUI();
    this.checkExistingSession();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(c => c !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => cb(this.currentUser, this.isAuthenticated));
  }

  initializeAuthUI() {
    if (!this.loginContainer) {
      const container = document.createElement('div');
      container.id = 'loginContainer';
      container.className = 'login-container';
      container.innerHTML = this.getLoginHTML();
      document.body.insertBefore(container, document.body.firstChild);
      this.loginContainer = container;
    }

    this.attachAuthEventListeners();
  }

  getLoginHTML() {
    return `
      <div class="login-wrapper">
        <div class="login-card">
          <div class="login-header">
            <div class="login-brand">
              <svg viewBox="0 0 32 32" class="login-icon">
                <path class="ai-ring" d="M10 3h12l7 7v12l-7 7H10l-7-7V10l7-7Z"/>
                <circle cx="16" cy="16" r="8"/>
                <path d="M16 10v6l4 2"/>
              </svg>
              <h1>Timewallet</h1>
              <p>Track your time, manage your money</p>
            </div>
          </div>

          <div class="login-tabs">
            <button class="tab-btn active" data-tab="login">Login</button>
            <button class="tab-btn" data-tab="register">Sign up</button>
            <button class="tab-btn" data-tab="mobile">Mobile</button>
          </div>

          <!-- Email/Password Login Form -->
          <form id="loginForm" class="login-form active" data-tab="login">
            <div class="form-group">
              <label for="loginEmail">Email address</label>
              <input 
                id="loginEmail" 
                type="email" 
                name="email" 
                placeholder="you@example.com" 
                required
              />
              <small id="loginEmailError" class="error-message"></small>
            </div>

            <div class="form-group">
              <label for="loginPassword">Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="loginPassword" 
                  type="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required
                />
                <button type="button" class="toggle-password" data-target="loginPassword">
                  <span data-icon="eye"></span>
                </button>
              </div>
              <small id="loginPasswordError" class="error-message"></small>
            </div>

            <div class="form-row">
              <label class="checkbox-label">
                <input type="checkbox" name="remember" />
                Remember me
              </label>
              <a href="#" class="forgot-link" id="forgotPasswordLink">Forgot password?</a>
            </div>

            <button type="submit" class="auth-btn primary-btn">Sign in</button>
            <small id="loginError" class="error-message"></small>
            <small id="loginLoading" class="loading-message"></small>
          </form>

          <!-- Registration Form -->
          <form id="registerForm" class="login-form" data-tab="register">
            <div class="form-group">
              <label for="registerName">Full name</label>
              <input 
                id="registerName" 
                type="text" 
                name="name" 
                placeholder="Alex Verne" 
                required
              />
              <small id="registerNameError" class="error-message"></small>
            </div>

            <div class="form-group">
              <label for="registerEmail">Email address</label>
              <input 
                id="registerEmail" 
                type="email" 
                name="email" 
                placeholder="you@example.com" 
                required
              />
              <small id="registerEmailError" class="error-message"></small>
            </div>

            <div class="form-group">
              <label for="registerPhone">Mobile number</label>
              <div class="phone-input-wrapper">
                <select id="registerCountry" class="country-code">
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (India)</option>
                  <option value="+61">+61 (Australia)</option>
                  <option value="+86">+86 (China)</option>
                  <option value="+81">+81 (Japan)</option>
                </select>
                <input 
                  id="registerPhone" 
                  type="tel" 
                  name="phone" 
                  placeholder="9876543210" 
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              <small id="registerPhoneError" class="error-message"></small>
            </div>

            <div class="form-group">
              <label for="registerPassword">Password</label>
              <div class="password-input-wrapper">
                <input 
                  id="registerPassword" 
                  type="password" 
                  name="password" 
                  placeholder="Min 8 characters" 
                  required
                />
                <button type="button" class="toggle-password" data-target="registerPassword">
                  <span data-icon="eye"></span>
                </button>
              </div>
              <small id="registerPasswordError" class="error-message"></small>
              <div class="password-strength" id="passwordStrength"></div>
            </div>

            <div class="form-group">
              <label for="registerConfirm">Confirm password</label>
              <div class="password-input-wrapper">
                <input 
                  id="registerConfirm" 
                  type="password" 
                  name="confirm" 
                  placeholder="••••••••" 
                  required
                />
                <button type="button" class="toggle-password" data-target="registerConfirm">
                  <span data-icon="eye"></span>
                </button>
              </div>
              <small id="registerConfirmError" class="error-message"></small>
            </div>

            <div class="form-group">
              <label for="registerWorkspace">Workspace name (optional)</label>
              <input 
                id="registerWorkspace" 
                type="text" 
                name="workspace" 
                placeholder="My Workspace" 
              />
            </div>

            <label class="checkbox-label">
              <input type="checkbox" name="terms" required />
              I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
            </label>

            <button type="submit" class="auth-btn primary-btn">Create account</button>
            <small id="registerError" class="error-message"></small>
            <small id="registerLoading" class="loading-message"></small>
          </form>

          <!-- Mobile OTP Login Form -->
          <div id="mobileLoginForm" class="login-form" data-tab="mobile">
            <div id="mobileStep1" class="mobile-step active">
              <h3>Sign in with Mobile</h3>
              <div class="form-group">
                <label for="mobileCountry">Country</label>
                <select id="mobileCountry" class="country-code">
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+91">🇮🇳 +91 (India)</option>
                  <option value="+61">🇦🇺 +61 (Australia)</option>
                  <option value="+86">🇨🇳 +86 (China)</option>
                  <option value="+81">🇯🇵 +81 (Japan)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="mobileNumber">Mobile number</label>
                <div class="phone-input-wrapper">
                  <span class="country-code-display" id="countryCodeDisplay">+91</span>
                  <input 
                    id="mobileNumber" 
                    type="tel" 
                    name="phone" 
                    placeholder="9876543210" 
                    pattern="[0-9]{10}"
                    maxlength="15"
                    required
                  />
                </div>
                <small id="mobileNumberError" class="error-message"></small>
              </div>

              <button type="button" class="auth-btn primary-btn" id="sendOTPBtn">Send OTP</button>
              <small id="sendOTPLoading" class="loading-message"></small>
            </div>

            <div id="mobileStep2" class="mobile-step hidden">
              <h3>Enter OTP</h3>
              <p class="otp-info">We've sent a 6-digit code to <strong id="otpPhoneDisplay"></strong></p>

              <div class="form-group">
                <label for="otpCode">One-Time Password</label>
                <input 
                  id="otpCode" 
                  type="text" 
                  name="otp" 
                  placeholder="000000" 
                  pattern="[0-9]{6}"
                  maxlength="6"
                  inputmode="numeric"
                  required
                  autocomplete="one-time-code"
                />
                <small id="otpCodeError" class="error-message"></small>
              </div>

              <div class="otp-timer">
                <span>Resend in <strong id="otpCountdown">60</strong>s</span>
                <button type="button" class="resend-btn" id="resendOTPBtn" disabled>Resend OTP</button>
              </div>

              <button type="button" class="auth-btn primary-btn" id="verifyOTPBtn">Verify OTP</button>
              <button type="button" class="auth-btn secondary-btn" id="changePhoneBtn">Change number</button>
              <small id="verifyOTPLoading" class="loading-message"></small>
            </div>

            <div id="mobileStep3" class="mobile-step hidden">
              <h3>Complete Your Profile</h3>
              
              <div class="form-group">
                <label for="mobileEmail">Email address</label>
                <input 
                  id="mobileEmail" 
                  type="email" 
                  name="email" 
                  placeholder="you@example.com" 
                  required
                />
                <small id="mobileEmailError" class="error-message"></small>
              </div>

              <div class="form-group">
                <label for="mobileName">Full name</label>
                <input 
                  id="mobileName" 
                  type="text" 
                  name="name" 
                  placeholder="Your name" 
                  required
                />
                <small id="mobileNameError" class="error-message"></small>
              </div>

              <div class="form-group">
                <label for="mobileWorkspace">Workspace (optional)</label>
                <input 
                  id="mobileWorkspace" 
                  type="text" 
                  name="workspace" 
                  placeholder="My Workspace" 
                />
              </div>

              <label class="checkbox-label">
                <input type="checkbox" name="mobileTerms" required />
                I agree to Terms & Privacy Policy
              </label>

              <button type="button" class="auth-btn primary-btn" id="completeMobileBtn">Complete Setup</button>
              <small id="completeMobileLoading" class="loading-message"></small>
            </div>
          </div>

          <!-- Social Auth -->
          <div class="social-divider">
            <span>Or continue with</span>
          </div>
          <div class="social-buttons">
            <button type="button" class="social-btn google-btn" id="googleAuth">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button type="button" class="social-btn github-btn" id="githubAuth">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <p class="login-footer">
            <span id="authToggleText">Don't have an account?</span>
            <button type="button" class="toggle-auth-link" id="toggleAuthForm">Sign up</button>
          </p>
        </div>
      </div>
    `;
  }

  attachAuthEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        this.switchAuthTab(tab);
      });
    });

    // Email/Password Login
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Registration
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Mobile OTP Flow
    document.getElementById('sendOTPBtn')?.addEventListener('click', () => this.sendOTP());
    document.getElementById('verifyOTPBtn')?.addEventListener('click', () => this.verifyOTP());
    document.getElementById('completeMobileBtn')?.addEventListener('click', () => this.completeMobileAuth());
    document.getElementById('resendOTPBtn')?.addEventListener('click', () => this.resendOTP());
    document.getElementById('changePhoneBtn')?.addEventListener('click', () => this.backToPhoneStep());

    // Mobile country code display
    document.getElementById('mobileCountry')?.addEventListener('change', (e) => {
      document.getElementById('countryCodeDisplay').textContent = e.target.value;
    });

    // OTP input auto-focus to next
    document.getElementById('otpCode')?.addEventListener('input', (e) => {
      if (e.target.value.length === 6) {
        document.getElementById('verifyOTPBtn').focus();
      }
    });

    // Social auth
    document.getElementById('googleAuth')?.addEventListener('click', () => this.handleSocialAuth('google'));
    document.getElementById('githubAuth')?.addEventListener('click', () => this.handleSocialAuth('github'));

    // Password visibility toggle
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.currentTarget.dataset.target;
        const input = document.getElementById(target);
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        e.currentTarget.classList.toggle('active');
      });
    });

    // Password strength indicator
    document.getElementById('registerPassword')?.addEventListener('input', (e) => {
      this.checkPasswordStrength(e.target.value);
    });

    // Toggle auth form
    document.getElementById('toggleAuthForm')?.addEventListener('click', () => {
      const tab = document.querySelector('.tab-btn.active').dataset.tab;
      const newTab = tab === 'login' ? 'register' : 'login';
      this.switchAuthTab(newTab);
    });

    // Forgot password
    document.getElementById('forgotPasswordLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showForgotPasswordModal();
    });
  }

  switchAuthTab(tab) {
    // Update tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update forms
    document.querySelectorAll('.login-form').forEach(form => {
      form.classList.toggle('active', form.dataset.tab === tab);
    });

    // Update toggle text
    const text = tab === 'login' ? "Don't have an account?" : "Already have an account?";
    const btnText = tab === 'login' ? 'Sign up' : 'Sign in';
    if (document.getElementById('authToggleText')) {
      document.getElementById('authToggleText').textContent = text;
      document.getElementById('toggleAuthForm').textContent = btnText;
    }
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const remember = document.querySelector('input[name="remember"]')?.checked;

    this.clearErrors('login');
    document.getElementById('loginLoading').textContent = 'Signing in...';

    try {
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const user = await this.authenticateUser(email, password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      this.setCurrentUser(user);
      
      if (remember) {
        localStorage.setItem('timewallet_remember_email', email);
      }

      localStorage.setItem('timewallet_auth_token', user.token);
      localStorage.setItem('timewallet_user', JSON.stringify(user));

      document.getElementById('loginLoading').textContent = 'Redirecting...';
      
      setTimeout(() => {
        this.showApp();
      }, 500);

      showToast(`Welcome back, ${user.name}!`);
    } catch (error) {
      document.getElementById('loginError').textContent = error.message;
      document.getElementById('loginLoading').textContent = '';
    }
  }

  async handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const country = document.getElementById('registerCountry').value;
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const workspace = document.getElementById('registerWorkspace').value;
    const terms = document.querySelector('input[name="terms"]')?.checked;

    this.clearErrors('register');
    document.getElementById('registerLoading').textContent = 'Creating account...';

    try {
      if (!name.trim()) throw new Error('Name is required');
      if (!this.validateEmail(email)) throw new Error('Invalid email format');
      if (!this.validatePhone(phone)) throw new Error('Invalid phone number');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');
      if (password !== confirm) throw new Error('Passwords do not match');
      if (!terms) throw new Error('You must agree to terms');

      const strength = this.getPasswordStrength(password);
      if (strength < 2) throw new Error('Password is too weak');

      const user = await this.registerUser({
        name,
        email,
        phone: country + phone,
        password,
        workspace: workspace || 'My Workspace',
      });

      if (!user) {
        throw new Error('Registration failed');
      }

      this.setCurrentUser(user);
      localStorage.setItem('timewallet_auth_token', user.token);
      localStorage.setItem('timewallet_user', JSON.stringify(user));

      document.getElementById('registerLoading').textContent = 'Redirecting...';
      
      setTimeout(() => {
        this.showApp();
      }, 500);

      showToast(`Welcome, ${user.name}! Your account has been created.`);
    } catch (error) {
      document.getElementById('registerError').textContent = error.message;
      document.getElementById('registerLoading').textContent = '';
    }
  }

  async sendOTP() {
    const phone = document.getElementById('mobileNumber').value;
    const country = document.getElementById('mobileCountry').value;

    document.getElementById('mobileNumberError').textContent = '';
    document.getElementById('sendOTPLoading').textContent = 'Sending OTP...';
    document.getElementById('sendOTPBtn').disabled = true;

    try {
      if (!this.validatePhone(phone)) {
        throw new Error('Invalid phone number');
      }

      const fullPhone = country + phone;
      const otp = await this.requestOTP(fullPhone);

      if (!otp) {
        throw new Error('Failed to send OTP');
      }

      // Store phone for later
      this.mobilePhoneNumber = fullPhone;
      this.generatedOTP = otp; // For demo - in production, server stores this

      // Move to OTP verification step
      document.getElementById('mobileStep1').classList.add('hidden');
      document.getElementById('mobileStep2').classList.remove('hidden');
      document.getElementById('otpPhoneDisplay').textContent = this.maskPhone(fullPhone);

      this.startOTPTimer();
      document.getElementById('otpCode').focus();

      showToast('OTP sent successfully');
    } catch (error) {
      document.getElementById('mobileNumberError').textContent = error.message;
    } finally {
      document.getElementById('sendOTPLoading').textContent = '';
      document.getElementById('sendOTPBtn').disabled = false;
    }
  }

  async verifyOTP() {
    const otpCode = document.getElementById('otpCode').value;
    
    document.getElementById('otpCodeError').textContent = '';
    document.getElementById('verifyOTPLoading').textContent = 'Verifying...';
    document.getElementById('verifyOTPBtn').disabled = true;

    try {
      if (!otpCode || otpCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const verified = await this.validateOTP(this.mobilePhoneNumber, otpCode);

      if (!verified) {
        this.otpAttempts++;
        if (this.otpAttempts > 3) {
          throw new Error('Too many failed attempts. Please try again later.');
        }
        throw new Error('Invalid OTP. Please try again.');
      }

      // Move to profile completion step
      document.getElementById('mobileStep2').classList.add('hidden');
      document.getElementById('mobileStep3').classList.remove('hidden');
      document.getElementById('mobileName').focus();

      clearTimeout(this.otpTimer);
      showToast('OTP verified successfully');
    } catch (error) {
      document.getElementById('otpCodeError').textContent = error.message;
    } finally {
      document.getElementById('verifyOTPLoading').textContent = '';
      document.getElementById('verifyOTPBtn').disabled = false;
    }
  }

  async completeMobileAuth() {
    const email = document.getElementById('mobileEmail').value;
    const name = document.getElementById('mobileName').value;
    const workspace = document.getElementById('mobileWorkspace').value;
    const terms = document.querySelector('input[name="mobileTerms"]')?.checked;

    this.clearMobileErrors();
    document.getElementById('completeMobileLoading').textContent = 'Setting up account...';
    document.getElementById('completeMobileBtn').disabled = true;

    try {
      if (!name.trim()) throw new Error('Name is required');
      if (!this.validateEmail(email)) throw new Error('Invalid email');
      if (!terms) throw new Error('You must agree to terms');

      const user = await this.registerUserWithPhone({
        name,
        email,
        phone: this.mobilePhoneNumber,
        workspace: workspace || 'My Workspace',
      });

      if (!user) {
        throw new Error('Account creation failed');
      }

      this.setCurrentUser(user);
      localStorage.setItem('timewallet_auth_token', user.token);
      localStorage.setItem('timewallet_user', JSON.stringify(user));

      document.getElementById('completeMobileLoading').textContent = 'Redirecting...';
      
      setTimeout(() => {
        this.showApp();
      }, 500);

      showToast(`Welcome, ${user.name}!`);
    } catch (error) {
      if (error.message.includes('Email')) {
        document.getElementById('mobileEmailError').textContent = error.message;
      } else if (error.message.includes('Name')) {
        document.getElementById('mobileNameError').textContent = error.message;
      } else {
        showToast(error.message, 'error');
      }
    } finally {
      document.getElementById('completeMobileLoading').textContent = '';
      document.getElementById('completeMobileBtn').disabled = false;
    }
  }

  async resendOTP() {
    document.getElementById('resendOTPBtn').disabled = true;
    try {
      const otp = await this.requestOTP(this.mobilePhoneNumber);
      this.generatedOTP = otp;
      this.startOTPTimer();
      showToast('OTP resent successfully');
    } catch (error) {
      showToast('Failed to resend OTP', 'error');
    }
  }

  backToPhoneStep() {
    document.getElementById('mobileStep2').classList.add('hidden');
    document.getElementById('mobileStep1').classList.remove('hidden');
    document.getElementById('mobileNumber').focus();
    clearTimeout(this.otpTimer);
  }

  startOTPTimer() {
    let countdown = 60;
    document.getElementById('otpCountdown').textContent = countdown;
    document.getElementById('resendOTPBtn').disabled = true;

    this.otpTimer = setInterval(() => {
      countdown--;
      document.getElementById('otpCountdown').textContent = countdown;

      if (countdown === 0) {
        clearTimeout(this.otpTimer);
        document.getElementById('resendOTPBtn').disabled = false;
      }
    }, 1000);
  }

  maskPhone(phone) {
    const str = phone.toString();
    return str.substring(0, str.length - 4) + '****';
  }

  validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  validatePhone(phone) {
    const regex = /^[0-9]{10,15}$/;
    return regex.test(phone.replace(/\D/g, ''));
  }

  checkPasswordStrength(password) {
    const strength = this.getPasswordStrength(password);
    const strengthEl = document.getElementById('passwordStrength');
    
    if (!strengthEl) return;

    const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['#ff6b6b', '#ffa500', '#ffd700', '#90ee90', '#00aa00'];
    
    strengthEl.style.width = `${(strength + 1) * 20}%`;
    strengthEl.style.backgroundColor = colors[strength];
    strengthEl.textContent = levels[strength];
  }

  getPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    return Math.min(strength - 1, 4);
  }

  clearErrors(form) {
    document.querySelectorAll(`[id*="${form}Error"]`).forEach(el => {
      el.textContent = '';
    });
  }

  clearMobileErrors() {
    document.getElementById('mobileEmailError').textContent = '';
    document.getElementById('mobileNameError').textContent = '';
  }

  async authenticateUser(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password.length >= 6) {
          resolve({
            id: Math.random().toString(36).substr(2, 9),
            name: 'Alex Verne',
            email: email,
            workspace: 'Freelance workspace',
            avatar: 'AV',
            token: 'mock_jwt_token_' + Date.now(),
            createdAt: new Date().toISOString(),
          });
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 1000);
    });
  }

  async registerUser(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: data.name,
          email: data.email,
          phone: data.phone,
          workspace: data.workspace,
          avatar: data.name.substring(0, 2).toUpperCase(),
          token: 'mock_jwt_token_' + Date.now(),
          createdAt: new Date().toISOString(),
        });
      }, 1500);
    });
  }

  async registerUserWithPhone(data) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: data.name,
          email: data.email,
          phone: data.phone,
          workspace: data.workspace,
          avatar: data.name.substring(0, 2).toUpperCase(),
          loginMethod: 'phone-otp',
          token: 'mock_jwt_token_' + Date.now(),
          createdAt: new Date().toISOString(),
        });
      }, 1500);
    });
  }

  async requestOTP(phone) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Generate mock OTP (in production, backend sends SMS)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`OTP for ${phone}: ${otp}`); // For demo only
        resolve(otp);
      }, 1500);
    });
  }

  async validateOTP(phone, otp) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // In production, verify with backend
        // For demo, accept mock OTP or correct sequence
        resolve(otp.length === 6);
      }, 1000);
    });
  }

  async handleSocialAuth(provider) {
    try {
      console.log(`Authenticating with ${provider}...`);
      
      const user = await this.authenticateWithSocial(provider);
      
      if (!user) {
        throw new Error(`${provider} authentication failed`);
      }

      this.setCurrentUser(user);
      localStorage.setItem('timewallet_auth_token', user.token);
      localStorage.setItem('timewallet_user', JSON.stringify(user));

      this.showApp();
      showToast(`Signed in with ${provider}!`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async authenticateWithSocial(provider) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: 'User Name',
          email: `user@${provider}.com`,
          workspace: 'My Workspace',
          avatar: provider.substring(0, 1).toUpperCase(),
          provider: provider,
          token: 'mock_jwt_token_' + Date.now(),
          createdAt: new Date().toISOString(),
        });
      }, 1500);
    });
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.isAuthenticated = true;
    this.notifySubscribers();
    
    if (typeof appState !== 'undefined') {
      appState.setState('user.name', user.name);
      appState.setState('user.workspace', user.workspace);
    }
  }

  checkExistingSession() {
    try {
      const token = localStorage.getItem('timewallet_auth_token');
      const user = localStorage.getItem('timewallet_user');
      
      if (token && user) {
        this.currentUser = JSON.parse(user);
        this.isAuthenticated = true;
        this.showApp();
        this.notifySubscribers();
      } else {
        const rememberedEmail = localStorage.getItem('timewallet_remember_email');
        if (rememberedEmail) {
          document.getElementById('loginEmail').value = rememberedEmail;
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  }

  showApp() {
    if (this.loginContainer) {
      this.loginContainer.style.display = 'none';
    }
    if (this.appShell) {
      this.appShell.style.display = 'block';
    }
  }

  showLoginForm() {
    if (this.loginContainer) {
      this.loginContainer.style.display = 'flex';
    }
    if (this.appShell) {
      this.appShell.style.display = 'none';
    }
  }

  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('timewallet_auth_token');
    localStorage.removeItem('timewallet_user');
    this.notifySubscribers();
    this.showLoginForm();
    showToast('Logged out successfully');
  }

  showForgotPasswordModal() {
    const email = prompt('Enter your email address:');
    if (email) {
      this.sendPasswordReset(email);
    }
  }

  async sendPasswordReset(email) {
    try {
      console.log('Sending password reset to:', email);
      showToast('Check your email for password reset link');
    } catch (error) {
      showToast('Failed to send reset email', 'error');
    }
  }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  if (!window.authManager) {
    window.authManager = new AuthManager();
    
    setTimeout(() => {
      const profileButton = document.getElementById('profileSettings');
      if (profileButton) {
        profileButton.addEventListener('click', () => {
          const menu = document.createElement('div');
          menu.className = 'profile-dropdown';
          menu.innerHTML = `
            <button class="dropdown-item" id="profileOption">Edit Profile</button>
            <button class="dropdown-item" id="settingsOption">Settings</button>
            <hr>
            <button class="dropdown-item logout" id="logoutOption">Logout</button>
          `;
          
          const existing = document.querySelector('.profile-dropdown');
          if (existing) existing.remove();
          
          profileButton.appendChild(menu);
          
          document.getElementById('logoutOption').addEventListener('click', () => {
            authManager.logout();
          });
        });
      }
    }, 500);
  }
});
