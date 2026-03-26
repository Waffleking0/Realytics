import Link from 'next/link';
import {
  TrendingUp,
  BarChart3,
  Brain,
  ArrowRight,
  Building2,
  CheckCircle2,
  Zap,
  Shield,
  LineChart,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Financial Analysis',
    description:
      'Institutional-grade financial modeling including cap rate, NOI, cash-on-cash return, IRR, and 10-year cash flow projections for any property type.',
    color: 'blue',
    stats: '10+ Metrics',
  },
  {
    icon: TrendingUp,
    title: 'Market Insights',
    description:
      'Comprehensive market risk scoring based on vacancy rates, population growth, employment data, and price appreciation trends in your target market.',
    color: 'purple',
    stats: 'Real-Time Data',
  },
  {
    icon: Brain,
    title: 'AI Reports',
    description:
      'Professional investment reports with executive summaries, risk/reward breakdowns, comparable properties analysis, and clear Buy/Hold/Pass recommendations.',
    color: 'emerald',
    stats: 'Instant Reports',
  },
];

const propertyTypes = [
  { name: 'Residential', icon: '🏠' },
  { name: 'Multifamily', icon: '🏢' },
  { name: 'Commercial', icon: '🏬' },
  { name: 'Land', icon: '🌿' },
  { name: 'Development', icon: '🔨' },
];

const highlights = [
  'Cap Rate & NOI calculation',
  'IRR with 10-year projections',
  'Comparable properties search',
  'Market risk scoring (0-100)',
  'AI-generated investment reports',
  'Buy / Hold / Pass recommendations',
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-800/50 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0f1e]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Realytics</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">AI-Powered Real Estate Analysis</span>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Analyze a Deal
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-6 py-24 overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Investment Analysis
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
            <span className="text-white">Analyze Any</span>
            <br />
            <span className="gradient-text">Real Estate Deal</span>
            <br />
            <span className="text-white">In Seconds</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Realytics delivers institutional-grade financial modeling, market risk scoring, and
            AI-generated investment reports — for residential, commercial, multifamily, land, and
            development properties.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/analyze"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl text-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25 glow-blue"
            >
              Start Analyzing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Shield className="w-4 h-4 text-green-400" />
              No signup required
            </div>
          </div>

          {/* Property Type Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {propertyTypes.map((type) => (
              <div
                key={type.name}
                className="px-4 py-2 bg-gray-800/60 border border-gray-700/50 rounded-full text-sm text-gray-300 flex items-center gap-2"
              >
                <span>{type.icon}</span>
                <span>{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything You Need to Evaluate a Deal
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From raw inputs to a complete investment thesis — Realytics handles the math and the analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colorClasses: Record<string, string> = {
                blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20 text-blue-400',
                purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20 text-purple-400',
                emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
              };
              const badgeClasses: Record<string, string> = {
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              };

              return (
                <div
                  key={feature.title}
                  className={`relative p-6 rounded-2xl bg-gradient-to-b ${colorClasses[feature.color]} border backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 rounded-lg bg-gray-800/50">
                      <Icon className={`w-6 h-6 ${colorClasses[feature.color].split(' ').pop()}`} />
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badgeClasses[feature.color]}`}>
                      {feature.stats}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Professional-Grade Analysis,
                <br />
                <span className="gradient-text">Zero Complexity</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Realytics automates the financial modeling that institutional investors rely on —
                so you can focus on finding the right deals, not building spreadsheets.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {highlights.map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* Mock dashboard preview */}
              <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-xs text-gray-500 ml-2">Analysis Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Cap Rate', value: '8.4%', color: 'text-green-400' },
                    { label: 'Cash-on-Cash', value: '11.2%', color: 'text-green-400' },
                    { label: 'Monthly CF', value: '+$1,840', color: 'text-blue-400' },
                    { label: 'IRR (10yr)', value: '16.8%', color: 'text-purple-400' },
                  ].map((metric) => (
                    <div key={metric.label} className="bg-gray-800 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
                      <div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">AI Recommendation</div>
                    <div className="text-sm text-gray-300">Strong fundamentals detected</div>
                  </div>
                  <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <span className="text-green-400 font-bold text-sm">BUY</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-400" />
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                  </div>
                  <span className="text-xs text-gray-400">Risk: Low (24/100)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Analyze Your Next Deal?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Enter your property details and get a complete investment analysis in under 30 seconds.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl text-lg transition-all duration-200 shadow-lg shadow-blue-500/25 glow-blue"
          >
            Analyze a Deal Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-400 text-sm">Realytics © 2026</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            For informational purposes only. Not financial advice. Always perform independent due diligence before investing.
          </p>
        </div>
      </footer>
    </div>
  );
}
