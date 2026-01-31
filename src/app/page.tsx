"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
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
import { useState, useEffect } from "react";

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
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission
    console.log("Email submitted:", email);
    // You can add your email handling logic here
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fafafa' }}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-white/95 border-b border-border-subtle shadow-sm"
          : "bg-transparent"
      }`}>
        <div className="max-w-5xl mx-auto h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-primary-600 flex items-center justify-center">
              <Waves className="w-6 h-6 text-white" />
            </div>
            <span className="text-h2 text-text-primary font-semibold">Undercurrent</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="default">
                Sign in
              </Button>
            </Link>
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="default">
                Book a Demo
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION with Textured Background */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 -z-10">
          {/* Background image */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-canvas to-primary-400/5" />

          {/* Mesh gradient overlay */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                radial-gradient(at 20% 30%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                radial-gradient(at 80% 20%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
                radial-gradient(at 40% 80%, rgba(59, 130, 246, 0.1) 0px, transparent 50%),
                radial-gradient(at 90% 70%, rgba(99, 102, 241, 0.1) 0px, transparent 50%)
              `
            }}
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
            backgroundSize: '100px 100px'
          }} />

          {/* Animated glow effects */}
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
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
            className="flex flex-col items-center justify-center gap-4 mb-12"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            <form onSubmit={handleEmailSubmit} className="w-full max-w-md">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-14 px-6 text-body rounded-lg border-2 border-border-subtle focus:border-primary-600"
                />
                <Button type="submit" size="lg" className="h-14 px-8 whitespace-nowrap">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </form>
            <p className="text-caption text-text-muted">
              We'll get back to you within 24 hours
            </p>
          </motion.div>

          {/* Trust Signals */}
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 1, y: 0 }}
            variants={fadeInUp}
          >
            <p className="text-body text-text-secondary">
              Trusted by <span className="font-semibold text-text-primary">200+ teams</span> who've completed research in under 48 hours
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Everything you need, built in
            </h2>
            <p className="text-body text-text-secondary">
              A complete platform for AI-powered qualitative research
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              {
                icon: Brain,
                title: "AI Interview Engine",
                description: "Natural conversation AI that adapts to responses, asks intelligent follow-ups, and maintains context throughout the interview"
              },
              {
                icon: Waves,
                title: "Voice Cloning",
                description: "Clone your voice in 60 seconds to boost trust and completion rates. Participants feel like they're talking to you"
              },
              {
                icon: Sparkles,
                title: "AI Synthesis",
                description: "Automated insight extraction with citations, themes, and evidence-based findings. Get stakeholder-ready reports instantly"
              },
              {
                icon: Target,
                title: "End-to-End Platform",
                description: "Study design, participant management, distribution, and real-time results dashboard - all in one place"
              }
            ].map((item, index) => (
              <div key={index} className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary-border transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary-50 border border-primary-border flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-h3 text-text-primary mb-2">{item.title}</h3>
                    <p className="text-body text-text-secondary leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-primary-50 border-2 border-primary-border rounded-lg p-8 text-center">
            <div className="mb-6">
              <p className="text-body text-text-muted mb-2">Simple, transparent pricing</p>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <p className="text-[56px] leading-[64px] font-bold text-primary-600">$2,500</p>
                <span className="text-h3 text-text-secondary">per study</span>
              </div>
              <p className="text-body text-text-secondary">No subscriptions • Pay per study • Cancel anytime</p>
            </div>
            <p className="text-body text-text-secondary mb-6 max-w-xl mx-auto">
              Get professional-grade insights delivered in 24-48 hours. No long-term contracts or hidden fees.
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
                quote: "We needed to understand why turnover spiked. In two days, we interviewed 60 employees with our CEO's cloned voice. The synthesis revealed two specific manager issues we could fix immediately. Turnover dropped 40% in three months.",
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
                description: "While competitors wait weeks for agency research, you're already iterating based on insights.",
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
            Join 200+ teams who've ditched slow agencies and expensive timelines.
            Book a 15-minute call to see if Undercurrent is right for you.
          </p>

          {/* "Yes" Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-h3 bg-white hover:bg-gray-50">
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
                <span>See if it's a fit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="py-16 px-6 border-t border-border-subtle bg-surface">
        <div className="max-w-[1600px] mx-auto">
          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
