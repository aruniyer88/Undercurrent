"use client";

import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Mic2, 
  BarChart3, 
  Users, 
  Sparkles,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Brain,
  Waves
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-50/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-50/30 rounded-full blur-3xl" />
        </div>

        <motion.div 
          className="max-w-5xl mx-auto text-center"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-border text-primary-700 text-caption font-semibold mb-8"
            variants={fadeInUp}
          >
            <Sparkles className="w-4 h-4" />
            AI-Powered Qualitative Research
          </motion.div>

          <motion.h1 
            className="text-display md:text-[48px] md:leading-[56px] lg:text-[56px] lg:leading-[64px] text-text-primary tracking-tight mb-6"
            variants={fadeInUp}
          >
            From brief to insights
            <br />
            <span className="text-primary-600">in a day, not weeks</span>
          </motion.h1>

          <motion.p 
            className="text-h3 font-normal text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
            variants={fadeInUp}
          >
            Turn open-ended research briefs into AI-led interviews with personalized voices. 
            Get synthesized insights without the agency timeline or budget.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            variants={fadeInUp}
          >
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-10 px-6">
                Book a Meeting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Button variant="secondary" size="lg" className="h-10 px-6">
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-10 px-6 border-y border-border-subtle bg-surface">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-caption text-text-muted mb-6">
            Trusted by forward-thinking teams
          </p>
          <div className="flex items-center justify-center gap-12 opacity-50 grayscale">
            {/* Placeholder logos */}
            <div className="w-24 h-8 bg-border-subtle rounded" />
            <div className="w-24 h-8 bg-border-subtle rounded" />
            <div className="w-24 h-8 bg-border-subtle rounded" />
            <div className="w-24 h-8 bg-border-subtle rounded hidden md:block" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Research in four simple steps
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto">
              No complex setup. No lengthy timelines. Just describe what you want to learn.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: MessageSquare,
                title: "Describe your goals",
                description: "Chat naturally about what you want to learn. We'll structure it into a research study."
              },
              {
                icon: Mic2,
                title: "Choose a voice",
                description: "Pick a preset voice or clone your own to make interviews feel personal and familiar."
              },
              {
                icon: Users,
                title: "Run interviews",
                description: "Share a link with participants. Our AI conducts thoughtful, conversational interviews."
              },
              {
                icon: BarChart3,
                title: "Get insights",
                description: "Receive synthesized findings with evidence, ready to share with stakeholders."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-lg bg-primary-50 border border-primary-border flex items-center justify-center mb-6">
                    <step.icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-primary-600 text-white text-caption font-semibold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <h3 className="text-h3 text-text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-body text-text-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice Clone Feature */}
      <section className="py-20 px-6 bg-topbar-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-border text-caption font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                Voice Cloning
              </div>
              <h2 className="text-h1 mb-6">
                Your voice, your connection
              </h2>
              <p className="text-body text-topbar-text/80 mb-8 leading-relaxed">
                Clone your voice or a team leader&apos;s to create familiar, trusted interviews. 
                Students hear their instructor, employees hear their CEO - dramatically 
                improving completion rates and response quality.
              </p>
              <ul className="space-y-4">
                {[
                  "Higher completion rates from familiar voices",
                  "Maintain your personal style and phrases",
                  "Full consent management built-in",
                  "Adjust tone, pacing, and dialect"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-border flex-shrink-0" />
                    <span className="text-body text-topbar-text/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              {/* Waveform visualization placeholder */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                    <Mic2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-body-strong text-white">Your Voice Profile</p>
                    <p className="text-caption text-topbar-text/60">Warm, conversational style</p>
                  </div>
                </div>
                {/* Waveform bars */}
                <div className="flex items-center justify-center gap-[2px] h-10 mb-6">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-[3px] bg-primary-border rounded-full transition-all duration-100"
                      style={{ 
                        height: `${Math.random() * 30 + 10}px`,
                        opacity: 0.5 + Math.random() * 0.5
                      }} 
                    />
                  ))}
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="secondary" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Play className="w-4 h-4 mr-2" />
                    Preview Voice
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-h1 text-text-primary mb-4">
              Built for people who need answers fast
            </h2>
            <p className="text-body text-text-secondary max-w-2xl mx-auto">
              Whether you&apos;re testing concepts, gathering feedback, or understanding your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "Brand & Community Managers",
                description: "Test campaigns, gather community feedback, and understand sentiment without expensive agencies or slow timelines.",
                examples: ["Campaign testing", "Community feedback", "Brand perception"]
              },
              {
                icon: Brain,
                title: "Instructors & Educators",
                description: "Gather candid student feedback mid-course or post-completion. Your voice creates comfort for honest responses.",
                examples: ["Course feedback", "Curriculum insights", "Student experience"]
              },
              {
                icon: BarChart3,
                title: "Leaders & Executives",
                description: "Understand employee sentiment on strategy, culture, or changes. Familiar voices drive participation.",
                examples: ["Strategy feedback", "Culture surveys", "Change management"]
              }
            ].map((useCase, index) => (
              <div 
                key={index} 
                className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-border-strong hover:shadow-sm transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                  <useCase.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-h3 text-text-primary mb-3">
                  {useCase.title}
                </h3>
                <p className="text-body text-text-secondary mb-4 leading-relaxed">
                  {useCase.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {useCase.examples.map((example, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-full bg-surface-alt text-text-secondary text-caption"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Speed & Value Props */}
      <section className="py-20 px-6 bg-primary-50/50">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            {[
              {
                icon: Clock,
                value: "~24 hours",
                label: "From brief to insights",
                description: "vs. weeks with traditional research"
              },
              {
                icon: Users,
                value: "60%+",
                label: "Completion rate",
                description: "With voice-cloned interviewers"
              },
              {
                icon: CheckCircle2,
                value: "100%",
                label: "Grounded insights",
                description: "Every finding linked to evidence"
              }
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-lg bg-surface border border-primary-border flex items-center justify-center mb-4">
                  <stat.icon className="w-5 h-5 text-primary-600" />
                </div>
                <p className="text-[32px] leading-[40px] font-bold text-text-primary mb-2">{stat.value}</p>
                <p className="text-h3 text-text-primary mb-1">{stat.label}</p>
                <p className="text-caption text-text-muted">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-h1 text-text-primary mb-4">
            Ready to transform your research?
          </h2>
          <p className="text-body text-text-secondary mb-10">
            Undercurrent is currently invite-only. Book a meeting to see if it&apos;s right for your team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="h-10 px-6">
                Book a Meeting
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="mailto:hello@undercurrent.ai">
              <Button variant="secondary" size="lg" className="h-10 px-6">
                Contact Us
              </Button>
            </a>
          </div>
          <p className="text-caption text-text-muted mt-6">
            No credit card required. No commitment.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border-subtle bg-surface">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-primary-600 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="text-body-strong text-text-primary">Undercurrent</span>
            </div>
            <div className="flex items-center gap-6 text-caption text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
              <a href="mailto:hello@undercurrent.ai" className="hover:text-text-primary transition-colors">Contact</a>
            </div>
            <p className="text-caption text-text-muted">
              © {new Date().getFullYear()} Undercurrent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
