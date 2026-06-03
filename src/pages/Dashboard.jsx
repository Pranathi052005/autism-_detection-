import { useSessionsList } from '../hooks/useSession';
import PatientCard from '../components/PatientCard';
import ChatBot from '../components/ChatBot';
import { Loader2, Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: sessions, isLoading, isError } = useSessionsList();
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const displayName = user ? user.fullName || user.email?.split('@')[0] || 'Your' : 'Your';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 block-fade-in relative z-10">
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-primary rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float -z-10"></div>
      <div className="absolute top-40 -left-10 w-64 h-64 bg-brand-highlight rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float-delayed -z-10"></div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bio-glass text-bio-rose font-bold text-sm mb-4 border border-purple-100 shadow-sm">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            Family Dashboard
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-bio-800 tracking-tight">{displayName} Assessments</h1>
          <p className="mt-3 text-bio-500 font-medium text-lg">Review insights and track progress easily.</p>
        </div>
        <Link
          to="/session/new"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bio-glass text-bio-rose hover:text-bio-text-primary hover:bg-bio-gradient border-2 border-bio-glass-100 hover:border-transparent font-display font-bold rounded-full transition-all shadow-sm transform hover:-translate-y-1 hover:shadow-lg"
        >
          <Sparkles className="w-5 h-5 text-yellow-400 group-hover:text-white" />
          <span>Start New Assessment</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 glass-card rounded-[2rem]">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
          <p className="text-bio-500 font-bold">Waking up our helpers...</p>
        </div>
      ) : isError ? (
        <div className="glass-card bg-red-50/80 p-10 rounded-[2rem] text-center border border-red-100 shadow-sm">
          <p className="font-extrabold text-2xl text-red-700 mb-2">Oops!</p>
          <p className="text-bio-600 font-medium">We couldn't reach our systems. Please check your connection.</p>
        </div>
      ) : sessions?.length === 0 || !sessions ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6 glass-card rounded-[2rem]">
          <div className="text-7xl mb-6">🌸</div>
          <h2 className="text-2xl font-bold text-white mb-3">No assessments yet</h2>
          <p className="text-[#A0ADB8] text-base mb-8 max-w-md">Start your first playful screening to see incredible insights here.</p>
          <Link
            to="/session/new"
            className="px-8 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#FF6B8A] to-[#00D4AA] hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-[#FF6B8A]/30"
          >
            Start First Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sessions.map((session) => (
            <PatientCard key={session.id} session={session} />
          ))}
        </div>
      )}
      <ChatBot />
    </div>
  );
}
