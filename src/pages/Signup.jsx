import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import { Mail, Lock, User, Heart, Loader2 } from 'lucide-react';
import { useRegister } from '../hooks/useAuth';

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    console.log('🔍 SIGNUP DEBUG - Form data being sent:', formData);
    console.log('🔍 SIGNUP DEBUG - Form data JSON:', JSON.stringify(formData));
    
    registerMutation.mutate(formData, {
      onSuccess: (data) => {
        setIsLoading(false);
        setSuccess(true);
        // Store user data from API response
        localStorage.setItem('user', JSON.stringify({
          id: data.id,
          email: data.email,
          fullName: data.full_name
        }));
        window.dispatchEvent(new Event('auth_change'));
        
        // Show success message and redirect to login after 1.5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      },
      onError: (error) => {
        setIsLoading(false);
        const msg = error.response?.data?.detail || 'Signup failed';
        if (msg === 'Email already registered') {
          setError('This email is already registered. Sign in instead?');
        } else {
          setError(msg);
        }
        console.error('Signup failed:', error);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 relative z-10 overflow-hidden">
      <div className="absolute top-10 right-10 w-96 h-96 bg-brand-highlight rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float -z-10"></div>
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-brand-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float-delayed -z-10"></div>

      <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] shadow-xl border border-white block-fade-in relative">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white animate-float">
              <Heart className="w-8 h-8 fill-green-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-green-600 mb-4">Account created!</h2>
            <p className="text-bio-500 font-medium">Please sign in to continue.</p>
            <p className="text-sm text-bio-400 mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white animate-float">
                <Heart className="w-8 h-8 fill-pink-500" />
              </div>
              <h2 className="text-3xl font-extrabold text-bio-800">Join EarlyBloom</h2>
              <p className="text-bio-500 font-medium mt-2">A caring space to understand your child's communication.</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-red-600 font-medium text-sm">{error}</p>
                {error.includes('Sign in instead') && (
                  <Link to="/login" className="text-pink-600 font-bold hover:text-pink-800 transition-colors mt-2 inline-block">
                    Go to Sign In
                  </Link>
                )}
              </div>
            )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-bio-600 pl-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bio-400" />
              <input 
                type="text" 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-5 py-3.5 bg-bio-glass-50 border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-rose/20 focus:border-bio-rose outline-none transition-all font-body font-medium text-bio-text-primary bio-focus-ring shadow-sm"
                placeholder="Your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-bio-600 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bio-400" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-5 py-3.5 bg-bio-glass-50 border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-rose/20 focus:border-bio-rose outline-none transition-all font-body font-medium text-bio-text-primary bio-focus-ring shadow-sm"
                placeholder="hello@family.com"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-bio-600 pl-1">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bio-400" />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-5 py-3.5 bg-bio-glass-50 border border-bio-glass-100 rounded-bio focus:ring-4 focus:ring-bio-rose/20 focus:border-bio-rose outline-none transition-all font-body font-medium text-bio-text-primary bio-focus-ring shadow-sm"
                placeholder="•••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || registerMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] mt-6 disabled:opacity-70"
          >
            {isLoading || registerMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-8 text-bio-500 font-medium">
          Already a member? <Link to="/login" className="text-pink-600 font-bold hover:text-pink-800 transition-colors">Sign in here</Link>
        </p>
          </>
        )}
      </div>
      <ChatBot />
    </div>
  );
}
