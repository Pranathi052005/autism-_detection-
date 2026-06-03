import { Link } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import { ArrowRight, Sparkles, Smile, MessageCircle, Heart, Star, LayoutGrid } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Bioluminescent Background Mesh */}
      <div className="absolute inset-0 bg-bio-mesh opacity-50"></div>
      
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="bio-stagger-1">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bio-glass border border-bio-glass-200 text-bio-text-primary font-body font-medium text-sm mb-8 bio-glow-white">
              <Sparkles className="w-5 h-5 text-bio-teal animate-pulse-glow" />
              <span>Caring & Safe Clinical AI</span>
            </div>
            
            <h1 className="font-display font-bold text-6xl lg:text-7xl tracking-wide leading-tight mb-8 bio-stagger-2">
              <span className="text-bio-text-primary">Early Development</span><br className="hidden lg:block"/>
              <span className="bio-gradient-text">Screening</span>
              <br className="hidden lg:block"/>
              <span className="text-bio-text-secondary text-2xl lg:text-3xl font-body font-normal">Made Simple</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-bio-text-secondary mb-12 leading-relaxed font-body font-light bio-stagger-3">
              We empower parents with simple, playful, and emotionally supportive screening tools. Upload tiny moments of your child's day to discover unique strengths and understand their communication needs better.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start bio-stagger-4">
              <Link
                to="/session/new"
                className="bio-gradient-border bio-shimmer relative inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-display font-bold text-bio-text-primary transition-all hover:shadow-bio-glow-rose hover:-translate-y-1 bio-focus-ring"
              >
                Start Assessment <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/dashboard"
                className="bio-glass-hover inline-flex items-center justify-center gap-3 px-10 py-5 text-lg font-display font-bold text-bio-text-primary transition-all hover:shadow-bio-glow-teal hover:-translate-y-1 bio-focus-ring rounded-bio"
              >
                View Family Dashboard
              </Link>
            </div>
            
            <p className="mt-12 text-sm text-bio-text-secondary font-body font-light flex items-center justify-center lg:justify-start gap-3 animate-float">
              <Heart className="w-5 h-5 text-bio-rose animate-pulse-glow" /> Every child is unique, we're here to help.
            </p>
          </div>

          <div className="relative flex justify-center w-full bio-stagger-4" style={{ animationDelay: '300ms' }}>
            <div className="bio-glass p-8 rounded-bio-lg overflow-hidden shadow-bio-card w-full max-w-lg">
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-bio-text-primary flex items-center gap-3"><Sparkles className="w-6 h-6 text-bio-teal animate-pulse-glow" /> Live Demo Tracker</h3>
                <span className="bio-glass px-3 py-1 text-xs font-body font-bold text-bio-teal bio-glow-teal rounded-bio">Interactive</span>
              </div>
              
              {/* Mock Video Upload row */}
              <div className="bio-glass-hover p-5 rounded-bio flex items-center gap-4 cursor-pointer border border-bio-glass-100 mb-4">
                <div className="w-14 h-14 bio-glass rounded-bio flex items-center justify-center text-bio-rose bio-glow-rose">
                  <LayoutGrid className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="w-1/2 h-3 bg-bio-glass-100 rounded-full mb-3"></div>
                  <div className="w-3/4 h-2 bg-bio-glass-50 rounded-full"></div>
                </div>
                <div className="text-xs font-body font-bold text-bio-text-secondary bio-glass px-3 py-1 rounded-bio">Processing</div>
              </div>

              {/* Mock Audio row */}
              <div className="bio-glass-hover p-5 rounded-bio flex items-center gap-4 cursor-pointer border border-bio-glass-100 mb-4">
                <div className="w-14 h-14 bio-glass rounded-bio flex items-center justify-center text-bio-rose bio-glow-rose">
                  <Heart className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="w-1/3 h-3 bg-bio-glass-100 rounded-full mb-3"></div>
                  <div className="flex gap-1 mt-3">
                    {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="w-2 h-5 bg-bio-rose rounded-full animate-pulse-glow" style={{animationDelay: `${i*100}ms`}}></div>
                    ))}
                  </div>
                </div>
                <div className="text-xs font-body font-bold text-bio-teal bio-glass px-3 py-1 rounded-bio bio-glow-teal">Analyzing</div>
              </div>

              {/* Mock Graph */}
              <div className="bio-glass p-6 rounded-bio border border-bio-glass-100">
                <div className="flex justify-between items-center mb-6">
                  <span className="font-display font-bold text-sm text-bio-text-secondary">Development Score</span>
                  <span className="text-bio-teal font-display font-bold bio-glow-teal">74%</span>
                </div>
                <div className="w-full bg-bio-glass-50 rounded-full h-4 overflow-hidden">
                  <div className="bg-bio-gradient h-full rounded-full w-3/4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bottom-0 left-0 bg-bio-glass-100 truncate transform animate-shimmer"></div>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Additional floating micro-interactions */}
            <div className="absolute -top-6 -right-6 glass-panel p-4 rounded-2xl shadow-lg z-20 animate-float" style={{ animationDelay: '1s' }}>
              <Star className="w-8 h-8 text-yellow-500 fill-yellow-200" />
            </div>
          </div>
          
        </div>
        
        {/* Instruction Section */}
        <div className="mt-32 w-full glass-panel rounded-[2rem] p-10 block-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-bio-text-primary">How the process works</h2>
            <p className="text-bio-text-secondary mt-3 font-display font-medium">Four simple steps to provide meaningful insights</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[45%] left-[10%] right-[10%] h-1 bg-gradient-to-r from-purple-200 to-pink-200 z-0"></div>
            
            {[
              { title: "Quick Survey", color: "bg-yellow-100 text-yellow-600", desc: "Tell us a bit about their daily behaviors." },
              { title: "Capture Video", color: "bg-blue-100 text-blue-600", desc: "Upload moments of playtime and interactions." },
              { title: "Record Audio", color: "bg-pink-100 text-pink-600", desc: "Upload short clips of speech and sounds." },
              { title: "Receive Insights", color: "bg-purple-100 text-purple-600", desc: "Get supportive, friendly advice and scores." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center font-display font-2xl shadow-xl shadow-bio-card/50 mb-6 border-4 border-bio-glass-100 ${step.color} transition-transform hover:scale-110`}>
                  {i + 1}
                </div>
                <h3 className="text-xl font-display font-bold text-bio-text-primary mb-2">{step.title}</h3>
                <p className="text-bio-text-secondary font-display font-medium px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ChatBot />
    </div>
  );
}
