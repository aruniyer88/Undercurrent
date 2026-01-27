"use client";

import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Brain,
  Waves,
  Star,
  TrendingUp,
  Zap,
  Target,
  Award
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-surface/80 border-b border-border-subtle">
        <div className="max-w-[1600px] mx-auto px-6 h-[56px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-body-strong text-text-primary">Undercurrent</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="sm">
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION with Textured Background */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Textured Background */}
        <div className="absolute inset-0 -z-10">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-canvas to-primary-50/30" />

          {/* Dot pattern texture */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241 / 0.05) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgb(99 102 241) 1px, transparent 1px), linear-gradient(90deg, rgb(99 102 241) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }} />

          {/* Animated blobs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }} />
        </div>

        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial={false}
          animate="animate"
          variants={stagger}
        >
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-border text-primary-700 text-caption font-semibold mb-8 shadow-sm"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Qualitative Research
          </motion.div>

          {/* Headline */}
          <motion.h1
            className="text-display md:text-[48px] md:leading-[56px] lg:text-[56px] lg:leading-[64px] text-text-primary tracking-tight mb-6"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            From brief to insights
            <br />
            <span className="text-primary-600">in a day, not weeks</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            className="text-h3 font-normal text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            Turn open-ended research briefs into AI-led interviews with personalized voices.
            Get synthesized insights without the agency timeline or budget.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-12 px-8">
                Book a Meeting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button variant="secondary" size="lg" className="h-12 px-8">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-primary-100 border-2 border-canvas flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary-600 text-primary-600" />
                ))}
              </div>
            </div>
            <p className="text-body text-text-secondary">
              <span className="font-semibold text-text-primary">200+</span> teams have completed research in under 48 hours
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. PROBLEM-AGITATE SECTION */}
      <section className="py-20 px-6 bg-surface border-y border-border-subtle">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Stuck in the research bottleneck?
            </h2>
            <p className="text-body text-text-secondary">
              You need answers fast, but traditional research keeps holding you back
            </p>
          </div>

          <div className="space-y-8 mb-12">
            {[
              {
                problem: "Weeks of waiting for agency deliverables",
                agitation: "By the time you get insights, your competitors have already launched. Market windows close while you&apos;re still waiting for the research deck.",
                pain: "You&apos;ve missed product launches, lost momentum on campaigns, and second-guessed decisions without data."
              },
              {
                problem: "Spending $10k-50k for basic feedback",
                agitation: "Your budget gets drained on overhead, account managers, and fancy presentations when all you needed was 20 honest conversations.",
                pain: "You&apos;ve skipped essential research because the cost couldn&apos;t be justified, making decisions in the dark."
              },
              {
                problem: "Low completion rates on surveys",
                agitation: "Generic survey links get 5-15% response rates. You&apos;re making strategic decisions based on a tiny, potentially biased sample.",
                pain: "You&apos;ve launched initiatives that flopped because the feedback you collected didn&apos;t represent your actual audience."
              }
            ].map((item, index) => (
              <div key={index} className="bg-canvas border border-border-subtle rounded-lg p-6 hover:border-primary-border transition-all">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
                      <span className="text-h2 text-red-600">×</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-text-primary mb-3">{item.problem}</h3>
                    <p className="text-body text-text-secondary mb-3 leading-relaxed">{item.agitation}</p>
                    <p className="text-body text-text-muted italic leading-relaxed">&quot;{item.pain}&quot;</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8 border-t border-border-subtle">
            <p className="text-h3 text-text-primary mb-4">
              You&apos;re not alone. This is the reality for every modern team.
            </p>
            <p className="text-body text-text-secondary max-w-2xl mx-auto">
              But what if you could get the same depth of insights in 24 hours, at 10% of the cost,
              with completion rates above 60%? That&apos;s exactly what Undercurrent delivers.
            </p>
          </div>
        </div>
      </section>

      {/* 4. VALUE STACK SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Everything you need to get insights fast
            </h2>
            <p className="text-body text-text-secondary">
              Here&apos;s what you get with every Undercurrent study
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              {
                tier: "AI Interview Engine",
                value: "$15,000",
                description: "Natural conversation AI that adapts to responses, asks follow-ups, and maintains context",
                features: ["Dynamic questioning flow", "Natural voice synthesis", "Multi-language support"]
              },
              {
                tier: "Voice Cloning Technology",
                value: "$8,000",
                description: "Clone your voice or a team leader&apos;s to boost trust and completion rates by 4x",
                features: ["60-second voice training", "Tone & pacing controls", "Full consent management"]
              },
              {
                tier: "AI Synthesis & Analysis",
                value: "$12,000",
                description: "Automated insight extraction with citations, themes, and evidence-based findings",
                features: ["Pattern recognition", "Quote extraction", "Stakeholder-ready reports"]
              },
              {
                tier: "End-to-End Platform",
                value: "$10,000",
                description: "Study design, participant management, distribution, and results dashboard",
                features: ["Brief-to-study AI assistant", "Link sharing", "Real-time results"]
              }
            ].map((item, index) => (
              <div key={index} className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary-border transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <h3 className="text-h3 text-text-primary">{item.tier}</h3>
                    </div>
                    <p className="text-body text-text-secondary mb-3 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {item.features.map((feature, i) => (
                        <span key={i} className="text-caption text-text-muted bg-canvas px-3 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-body-strong text-text-muted line-through">{item.value}</p>
                    <p className="text-caption text-text-muted">value</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary-50 border-2 border-primary-border rounded-lg p-8 text-center">
            <div className="mb-6">
              <p className="text-body text-text-muted mb-2">Total Value</p>
              <p className="text-[40px] leading-[48px] font-bold text-text-muted line-through mb-2">$45,000</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <p className="text-[56px] leading-[64px] font-bold text-primary-600">$2,500</p>
                <span className="px-4 py-2 bg-primary-600 text-white rounded-full text-body-strong">
                  Save 94%
                </span>
              </div>
              <p className="text-body text-text-secondary">per study • no subscription required</p>
            </div>
            <p className="text-body text-text-secondary mb-6 max-w-xl mx-auto">
              Get the same quality insights as a $50k agency engagement, delivered in 24-48 hours instead of weeks.
            </p>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-12 px-8">
                Book Your First Study
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 5. SOCIAL PROOF SECTION */}
      <section className="py-20 px-6 bg-canvas">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Real teams, real results
            </h2>
            <p className="text-body text-text-secondary">
              See how teams are using Undercurrent to make faster, better decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "VP Marketing, TechFlow",
                avatar: "SC",
                result: "Validated campaign concept in 2 days",
                quote: "We tested three campaign angles with 50 target customers in 36 hours. The voice-cloned interviews felt personal and got us a 68% completion rate. We identified the winning concept before our competitors even finished their agency briefs.",
                metric: "3x faster decisions",
                image: Users
              },
              {
                name: "Dr. Marcus Rodriguez",
                role: "Professor, Columbia Business School",
                avatar: "MR",
                result: "Improved course with student feedback",
                quote: "My students were honest in ways they never are on surveys. Using my cloned voice created trust - 87% completion rate. I identified curriculum gaps mid-semester and made changes that boosted satisfaction scores by 32 points.",
                metric: "87% completion rate",
                image: Brain
              },
              {
                name: "Jennifer Park",
                role: "Chief People Officer, CloudScale",
                avatar: "JP",
                result: "Diagnosed culture issues in 48 hours",
                quote: "We needed to understand why turnover spiked. In two days, we interviewed 60 employees with our CEO&apos;s cloned voice. The synthesis revealed two specific manager issues we could fix immediately. Turnover dropped 40% in three months.",
                metric: "40% turnover reduction",
                image: BarChart3
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary-border hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 border-2 border-primary-border flex items-center justify-center">
                    <span className="text-body-strong text-primary-600">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="text-body-strong text-text-primary">{testimonial.name}</p>
                    <p className="text-caption text-text-muted">{testimonial.role}</p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-primary-50 border border-primary-border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-primary-600" />
                    <p className="text-body-strong text-primary-700">{testimonial.result}</p>
                  </div>
                  <p className="text-caption text-primary-600 font-semibold">{testimonial.metric}</p>
                </div>

                <blockquote className="text-body text-text-secondary leading-relaxed mb-4 italic">
                  &quot;{testimonial.quote}&quot;
                </blockquote>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-primary-600 text-primary-600" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRANSFORMATION SECTION */}
      <section className="py-20 px-6 bg-surface border-y border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Your research transformation journey
            </h2>
            <p className="text-body text-text-secondary">
              See how teams go from blocked to breakthrough with Undercurrent
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                stage: "Quick Win",
                icon: Zap,
                title: "First Study",
                timeline: "Day 1-2",
                description: "Run your first study and get insights in 24-48 hours. Experience the speed and quality difference.",
                outcome: "Validate an assumption or test a concept before your next meeting"
              },
              {
                stage: "Compound",
                icon: TrendingUp,
                title: "Research Rhythm",
                timeline: "Week 2-4",
                description: "Make research a regular habit. Test multiple angles, iterate on messaging, gather continuous feedback.",
                outcome: "Launch campaigns with confidence, backed by real voice-of-customer data"
              },
              {
                stage: "Advantage",
                icon: Target,
                title: "Strategic Edge",
                timeline: "Month 2-3",
                description: "While competitors wait weeks for agency research, you&apos;re already iterating based on insights.",
                outcome: "Move faster than your market, make data-driven pivots in days not quarters"
              },
              {
                stage: "10x Impact",
                icon: Award,
                title: "Culture Shift",
                timeline: "Month 3+",
                description: "Your team makes research-backed decisions reflexively. Customer voice is embedded in everything.",
                outcome: "Dramatically reduce failed launches, increase win rates, build customer-obsessed culture"
              }
            ].map((stage, index) => (
              <div key={index} className="relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-[2px] bg-gradient-to-r from-primary-border to-transparent -z-10" />
                )}
                <div className="bg-canvas border border-border-subtle rounded-lg p-6 hover:border-primary-border hover:shadow-lg transition-all h-full">
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-50 border border-primary-border flex items-center justify-center mb-4">
                      <stage.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 bg-primary-600 text-white rounded-full text-caption font-semibold">
                        {stage.stage}
                      </span>
                    </div>
                    <h3 className="text-h3 text-text-primary mb-1">{stage.title}</h3>
                    <p className="text-caption text-text-muted mb-3">{stage.timeline}</p>
                  </div>
                  <p className="text-body text-text-secondary mb-4 leading-relaxed">
                    {stage.description}
                  </p>
                  <div className="pt-4 border-t border-border-subtle">
                    <p className="text-body-strong text-primary-600 text-sm">
                      {stage.outcome}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. SECONDARY CTA SECTION */}
      <section className="py-20 px-6 bg-primary-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          {/* Avatar Stack */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-14 h-14 rounded-full bg-white/20 border-4 border-primary-600 flex items-center justify-center backdrop-blur">
                  <Users className="w-6 h-6 text-white" />
                </div>
              ))}
            </div>
          </div>

          {/* Question Headline */}
          <h2 className="text-h1 mb-6">
            Ready to get insights in 24 hours instead of weeks?
          </h2>
          <p className="text-h3 font-normal text-white/90 mb-10 leading-relaxed">
            Join 200+ teams who&apos;ve ditched slow agencies and expensive timelines.
            Book a 15-minute call to see if Undercurrent is right for you.
          </p>

          {/* "Yes" Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-14 px-10 bg-white text-primary-600 hover:bg-white/90 text-h3">
                Yes, Book My Demo
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </a>
          </div>

          <div className="flex flex-col items-center gap-4 text-white/80">
            <div className="flex items-center gap-6 text-body">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>15-min call</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>See if it&apos;s a fit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-16 px-6 border-t border-border-subtle bg-surface">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-md bg-primary-600 flex items-center justify-center">
                  <Waves className="w-6 h-6 text-white" />
                </div>
                <span className="text-h3 text-text-primary">Undercurrent</span>
              </Link>
              <p className="text-body text-text-secondary leading-relaxed mb-4">
                AI-powered qualitative research that delivers insights in 24 hours, not weeks.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-alt hover:bg-primary-50 border border-border-subtle hover:border-primary-border flex items-center justify-center transition-all">
                  <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-alt hover:bg-primary-50 border border-border-subtle hover:border-primary-border flex items-center justify-center transition-all">
                  <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-alt hover:bg-primary-50 border border-border-subtle hover:border-primary-border flex items-center justify-center transition-all">
                  <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h4 className="text-body-strong text-text-primary mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Use Cases</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Voice Cloning</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-body-strong text-text-primary mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">API Reference</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Blog</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Case Studies</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Company & Legal */}
            <div>
              <h4 className="text-body-strong text-text-primary mb-4">Company</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">About</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Careers</a></li>
                <li><a href="mailto:hello@undercurrent.ai" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Contact</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-body text-text-secondary hover:text-primary-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-body text-text-muted">
              © {new Date().getFullYear()} Undercurrent AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-body text-text-muted">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-text-primary transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
