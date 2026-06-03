import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import { Mail, Lock, ArrowRight, Sparkles, Loader2, UserCircle, Heart } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('parent');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('🔍 LOGIN DEBUG - Form data being sent:', formData);
    
    loginMutation.mutate(formData, {
      onSuccess: (data) => {
        setIsLoading(false);
        // Store user data and token from API response
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          email: data.email,
          fullName: data.full_name
        }));
        window.dispatchEvent(new Event('auth_change'));
        navigate('/dashboard');
      },
      onError: (error) => {
        setIsLoading(false);
        console.error('Login failed:', error);
      }
    });
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 relative z-10 overflow-hidden">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-brand-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float -z-10"></div>
      <div className="absolute bottom-10 -right-10 w-80 h-80 bg-brand-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-float-delayed -z-10"></div>

      <div className="w-full max-w-md glass-card p-10 rounded-[2.5rem] shadow-xl border border-white block-fade-in relative">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-purple-600 mb-4 bg-purple-50 inline-block px-4 py-1.5 rounded-full border border-purple-100 flex items-center justify-center gap-2 mx-auto w-max">
            <Heart className="w-4 h-4 fill-purple-400" /> Helping you understand your child better 💙
          </p>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm transform -rotate-6 border-4 border-white">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-bio-800">Welcome Back</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="flex bio-glass-50 p-1 rounded-bio border border-bio-glass-100">
            <button type="button" onClick={() => setRole('parent')} className={`flex-1 py-2.5 rounded-bio text-sm font-display font-bold transition-all ${role === 'parent' ? 'bio-glass text-bio-rose bio-glow-rose shadow-sm' : 'text-bio-text-secondary hover:text-bio-text-primary'}`}>Parent</button>
            <button type="button" onClick={() => setRole('clinician')} className={`flex-1 py-2.5 rounded-bio text-sm font-display font-bold transition-all ${role === 'clinician' ? 'bio-glass text-bio-rose bio-glow-rose shadow-sm' : 'text-bio-text-secondary hover:text-bio-text-primary'}`}>Clinician</button>
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
            <label className="text-sm font-bold text-bio-600 pl-1">Password</label>
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
            disabled={isLoading || loginMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] mt-4 disabled:opacity-70"
          >
            {isLoading || loginMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>Continue as {role === 'parent' ? 'Parent' : 'Clinician'} <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>

        <p className="text-center mt-8 text-bio-500 font-medium">
          Don't have an account yet? <br/>
          <Link to="/signup" className="text-purple-600 font-bold hover:text-purple-800 transition-colors">Create one here</Link>
        </p>
      </div>
      <ChatBot />
    </div>
  );
}
