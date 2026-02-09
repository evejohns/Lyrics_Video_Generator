import { Link } from 'react-router-dom';
import { Music, Sparkles, Zap, Video } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-dark-900 to-pink-600/20" />

        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-6">
            Create <span className="text-gradient">Lyric Videos</span>
            <br />
            in Minutes
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto">
            AI-powered lyric video generator for musicians and creators. Professional quality,
            zero editing skills required.
          </p>

          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-primary px-8 py-4 text-lg">
              Get Started Free
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-4 text-lg">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-primary-500">5-10min</div>
              <div className="text-gray-400">Average Creation Time</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500">95%+</div>
              <div className="text-gray-400">AI Sync Accuracy</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-500">50+</div>
              <div className="text-gray-400">Templates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-dark-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-16">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">AI Auto-Sync</h3>
              <p className="text-gray-400">
                Whisper AI automatically syncs lyrics to your audio with 95%+ accuracy.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">50+ Templates</h3>
              <p className="text-gray-400">
                Beautiful pre-made templates for every genre and style. Fully customizable.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Preview</h3>
              <p className="text-gray-400">
                See changes instantly as you customize fonts, colors, and animations.
              </p>
            </div>

            <div className="card p-6">
              <div className="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">YouTube Upload</h3>
              <p className="text-gray-400">
                Export to 4K or upload directly to YouTube with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-display font-bold mb-6">
            Ready to Create Your First Lyric Video?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Start for free. No credit card required.
          </p>
          <Link to="/register" className="btn-primary px-8 py-4 text-lg">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-500">
          <p>&copy; 2025 Lyric Video Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
