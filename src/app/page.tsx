'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {

  useEffect(() => {
    // Hero animations
    const tl = gsap.timeline();
    tl.from(".hero-title", {
      duration: 1.2,
      y: 100,
      opacity: 0,
      ease: "power3.out",
      stagger: 0.2
    })
    .from(".hero-subtitle", {
      duration: 1,
      y: 50,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.5")
    .from(".hero-buttons", {
      duration: 0.8,
      y: 30,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.3");

    // Scroll-triggered animations
    gsap.fromTo(".feature-card",
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: ".features-section",
          start: "top 80%",
        }
      }
    );

  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Glassmorphism Navbar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-4xl"
      >
        <nav className="backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">SIWES LogGen</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Process', 'About'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative"
                >
                  {item}
                </a>
              ))}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/onboarding"
                  className="bg-gray-900 text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-pink-100 to-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70"
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
                scale: [1.1, 1, 1.1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-1"
            >
              <span className="inline-block px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium mb-1">
                ✨ AI-Powered SIWES Log Generation
              </span>
            </motion.div>

            <h1 className="hero-title text-6xl md:text-8xl font-bold text-gray-900 mb-6 leading-none">
              Transform
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Weekly Summaries
              </span>
              <br />
              into Perfect Logs
            </h1>

            <p className="hero-subtitle text-lg md:text-xl text-gray-600 mb-4 max-w-3xl mx-auto leading-relaxed">
              The smartest way for IT students to create professional SIWES logbook entries.
              Just describe your week, and watch AI craft detailed daily logs.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/onboarding"
                  className="bg-gray-900 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-800 transition-all duration-300 inline-flex items-center space-x-2"
                >
                  <span>Start Creating</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="text-gray-600 hover:text-gray-900 font-semibold text-lg transition-colors inline-flex items-center space-x-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Watch Demo</span>
                </button>
              </motion.div>
            </div>

            {/* Minimal Demo Preview */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-3xl p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-4">
                    <div className="text-left">
                      <div className="text-sm text-gray-500 mb-2">Input</div>
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-gray-700 text-sm leading-relaxed">
                        This week I worked on database optimization, attended team meetings, and completed user interface testing for the mobile app...
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-left">
                      <div className="text-sm text-gray-500 mb-2">Generated Output</div>
                      <div className="space-y-3">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 text-sm">
                          <strong className="text-indigo-700">Monday:</strong> <span className="text-gray-700">Analyzed database performance metrics and identified bottlenecks...</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 text-sm">
                          <strong className="text-purple-700">Tuesday:</strong> <span className="text-gray-700">Participated in sprint planning meeting...</span>
                        </div>
                        <div className="text-center text-gray-400 text-xs">+ 3 more days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="features-section py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Built for
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Students</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every feature designed to make your SIWES journey smoother
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              className="feature-card text-center group"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AI Generation</h3>
              <p className="text-gray-600 leading-relaxed">
                Transform brief summaries into comprehensive daily logs with advanced AI that understands IT workflows
              </p>
            </motion.div>

            <motion.div
              className="feature-card text-center group"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Smart Editing</h3>
              <p className="text-gray-600 leading-relaxed">
                Fine-tune each day with intelligent suggestions and maintain consistency across your entire logbook
              </p>
            </motion.div>

            <motion.div
              className="feature-card text-center group"
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-pink-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Organize and access all your weekly reports with powerful search and timeline features
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-32 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Three Simple
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From weekly summary to professional logbook in minutes
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              {
                step: "01",
                title: "Write Summary",
                description: "Describe your week's activities in natural language. No need for perfect formatting.",
                icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              },
              {
                step: "02",
                title: "AI Magic",
                description: "Our AI analyzes your summary and generates detailed daily logs for each weekday.",
                icon: "M13 10V3L4 14h7v7l9-11h-7z"
              },
              {
                step: "03",
                title: "Perfect & Save",
                description: "Review, edit any details, and save to your organized logbook collection.",
                icon: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className="relative mb-8">
                  <div className="text-8xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors duration-300">
                    {item.step}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white border-2 border-gray-200 rounded-2xl flex items-center justify-center group-hover:border-indigo-300 group-hover:scale-110 transition-all duration-300">
                      <svg className="w-8 h-8 text-gray-700 group-hover:text-indigo-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to Transform
              <br />
              Your SIWES Experience?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the smart students who are already creating professional logbooks effortlessly
            </p>
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/onboarding"
                className="bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 inline-flex items-center space-x-2"
              >
                <span>Get Started Free</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">SIWES LogGen</span>
            </motion.div>

            <div className="flex items-center space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Support</a>
            </div>

            <div className="text-gray-400 text-sm">
              Made with ❤️ for IT students
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
