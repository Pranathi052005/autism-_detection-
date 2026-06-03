import { Link } from 'react-router-dom';
import { Calendar, User, CheckCircle, Loader2, ArrowRight } from 'lucide-react';

export default function PatientCard({ session }) {
  return (
    <div className="glass-card rounded-[2rem] p-6 border border-bio-glass-100 hover:border-bio-rose shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-full transform hover:-translate-y-1 bg-bio-glass-50">
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity z-0"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center border-2 border-white shadow-sm transform group-hover:rotate-[10deg] transition-transform">
              <User className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-bio-text-primary">
                {session.patientName || 'Friendly Face'}
              </h3>
              <p className="text-sm text-bio-text-secondary font-display font-bold mt-0.5">
                {session.ageMonths} months old
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {session.status === 'completed' && session.scores?.length > 0 && (() => {
            const avg = session.scores.reduce((sum, score) => sum + score.score, 0) / session.scores.length;
            const isHigh = avg > 70;
            const isMod = avg > 40;
            return (
              <span className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold rounded-xl border ${
                isHigh ? 'bio-glass bio-glow-rose text-bio-rose border-bio-rose' :
                isMod ? 'bio-glass bio-glow-amber text-amber-400 border-amber-400' :
                'bio-glass bio-glow-teal text-bio-teal border-bio-teal'
              }`}>
                Risk: {isHigh ? 'High' : isMod ? 'Moderate' : 'Low'}
              </span>
            );
          })()}
          <span className={`px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold rounded-xl border ${
            session.status === 'completed' ? 'bio-glass bio-glow-teal text-bio-teal border-bio-teal' : 
            session.status === 'processing' ? 'bio-glass bio-glow-amber text-amber-400 border-amber-400 animate-pulse' : 
            'bio-glass text-bio-text-secondary border-bio-glass-100'
          }`}>
            {session.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
            {session.status === 'completed' && <CheckCircle className="w-3.5 h-3.5"/>}
            {session.status === 'processing' ? 'Analyzing...' : session.status === 'completed' ? 'Ready!' : 'Pending...'}
          </span>
          <span className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-display font-bold rounded-bio bg-bio-glass border border-bio-glass-100 text-bio-text-secondary shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(session.createdAt || Date.now()).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      <Link 
        to={`/report/${session.id}`}
        className="block text-center w-full bio-glass hover:bg-bio-gradient text-bio-rose hover:text-bio-text-primary font-display font-bold py-3.5 rounded-bio transition-all shadow-sm border border-bio-glass-100 hover:border-transparent group-hover:shadow-md relative z-10 flex justify-center items-center gap-2"
      >
        <span>Open Insights</span>
        <ArrowRight className="w-4 h-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
      </Link>
    </div>
  );
}
