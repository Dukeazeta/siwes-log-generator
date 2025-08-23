'use client';


import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { gsap } from "gsap";
import SmartCTAButton from "../components/SmartCTAButton";
import PageTransition from "../components/PageTransition";
import Logo from "../components/Logo";

export default function Home() {

  useEffect(() => {
    // Ensure elements are visible first, then animate
    const heroElements = [".hero-title", ".hero-subtitle", ".hero-buttons"];
    
    // Failsafe: Ensure elements are visible even if GSAP fails
    const ensureVisibility = () => {
      heroElements.forEach(selector => {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          element.style.opacity = '1';
          element.style.visibility = 'visible';
          element.style.transform = 'none';
        }
      });
    };

    // Immediate visibility fallback
    ensureVisibility();
    
    // Set initial state with GSAP if available
    if (typeof gsap !== 'undefined') {
      gsap.set(heroElements, { 
        opacity: 1,
        y: 0,
        visibility: "visible"
      });

      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        try {
          // Create animation timeline
          const tl = gsap.timeline();
          
          // Reset to starting position for animation
          gsap.set(heroElements, { opacity: 0, y: 20 });
          
          tl.to(".hero-title", {
            duration: 0.6,
            y: 0,
            opacity: 1,
            ease: "power2.out"
          })
          .to(".hero-subtitle", {
            duration: 0.5,
            y: 0,
            opacity: 1,
            ease: "power2.out"
          }, "-=0.3")
          .to(".hero-buttons", {
            duration: 0.5,
            y: 0,
            opacity: 1,
            ease: "power2.out"
          }, "-=0.2");
        } catch (error) {
          console.warn('GSAP animation failed, using fallback:', error);
          ensureVisibility();
        }
      }, 100);

      // University logos carousel animation
      const initCarousel = () => {
        try {
          const carousel = document.querySelector(".university-carousel");
          if (carousel) {
            gsap.set(".university-carousel", { x: 0 });
            gsap.to(".university-carousel", {
              x: "-50%",
              duration: 40,
              ease: "none",
              repeat: -1
            });
          }
        } catch (error) {
          console.warn('Carousel animation failed:', error);
        }
      };
      
      // Initialize carousel after a small delay
      setTimeout(initCarousel, 200);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // GSAP not available, ensure elements remain visible
      console.warn('GSAP not available, using CSS fallback');
      ensureVisibility();
    }

    // Additional safeguard after a longer delay
    const safeguardTimer = setTimeout(ensureVisibility, 1000);
    
    return () => {
      clearTimeout(safeguardTimer);
    };
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground overflow-hidden transition-colors duration-300">
      {/* Floating Glassmorphism Navbar */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-4xl"
      >
        <nav className="backdrop-blur-md bg-background/70 dark:bg-background/80 border border-border/50 rounded-full px-4 md:px-8 py-3 md:py-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center">
              <Logo
                width={48}
                height={48}
                className="w-10 h-10 md:w-12 md:h-12"
              />
            </div>

            <div className="hidden md:flex items-center space-x-8">
              {['Features', 'Process'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors relative"
                >
                  {item}
                </a>
              ))}
              <a
                href="/changelogs"
                className="text-muted-foreground hover:text-foreground font-medium transition-colors relative"
              >
                Changelogs
              </a>
              <SmartCTAButton
                className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-colors"
                authenticatedText="Go to Dashboard"
                unauthenticatedText="Get Started"
              >
                Get Started
              </SmartCTAButton>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <main className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70"
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
              className="absolute top-40 right-10 w-72 h-72 bg-gradient-to-r from-pink-100 to-indigo-100 dark:from-pink-900/30 dark:to-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl opacity-70"
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
              className="mb-1 flex flex-wrap items-center justify-center gap-3"
            >
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 dark:bg-gradient-to-r dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 text-white dark:text-white text-sm font-extrabold">
                <span className="w-2 h-2 bg-blue-400 dark:bg-white rounded-full mr-2 animate-pulse"></span>
                Beta v2.1.1
              </div>
              <span className="inline-block px-4 py-2 rounded-full text-sm font-extrabold bg-black text-white dark:bg-white dark:text-gray-900">
                ✨ AI-Powered SIWES Log Generation
              </span>
            </motion.div>

            <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-foreground mb-6 leading-none opacity-100 visible">
              Transform
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Weekly Summaries
              </span>
              <br />
              into Perfect Logs
            </h1>

            <p className="hero-subtitle text-base sm:text-lg md:text-xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed opacity-100 visible">
              The smartest way for IT students to create professional SIWES logbook entries.
              Just describe your week, and watch SwiftLog&apos;s AI craft detailed daily logs.
            </p>

            <div className="hero-buttons flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-12 md:mb-16 opacity-100 visible">
              <SmartCTAButton
                className="bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-primary/90 transition-all duration-300 inline-flex items-center space-x-2"
                authenticatedText="Open Dashboard"
                unauthenticatedText="Start Creating"
              >
                <span>Start Creating</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </SmartCTAButton>

              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <button className="text-muted-foreground hover:text-foreground font-semibold text-base md:text-lg transition-colors inline-flex items-center space-x-2">
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
              <div className="bg-card/80 backdrop-blur-sm border border-border rounded-3xl p-8 md:p-12 transition-colors duration-300">
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

      {/* Trusted By Section */}
      <section id="features" className="trusted-section py-12 md:py-16 overflow-hidden bg-background transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm text-muted-foreground mb-8">Trusted by students from</p>
          </motion.div>

          {/* University Carousel */}
          <div className="relative">
            {/* Gradient Overlays */}
            <div className="absolute left-0 top-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>

            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div className="university-carousel flex items-center space-x-16" style={{ width: '200%' }}>
                {/* First Set */}
                {[
                  { logo: "/LOGOS/1.svg", name: "UNILAG" },
                  { logo: "/LOGOS/2.svg", name: "UI" },
                  { logo: "/LOGOS/3.svg", name: "FUTMINNA" },
                  { logo: "/LOGOS/4.svg", name: "COVENANT" },
                  { logo: "/LOGOS/5.svg", name: "FUTO" },
                  { logo: "/LOGOS/6.svg", name: "OAU" }
                ].map((uni) => (
                  <div
                    key={`first-${uni.name}`}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    <div className="dark:w-20 dark:h-20 dark:rounded-full dark:bg-white dark:flex dark:items-center dark:justify-center">
                      <Image
                        src={uni.logo}
                        alt={`${uni.name} Logo`}
                        width={80}
                        height={80}
                        className="h-16 dark:h-12 w-auto object-contain"
                      />
                    </div>
                  </div>
                ))}

                {/* Duplicate Set for Seamless Loop */}
                {[
                  { logo: "/LOGOS/1.svg", name: "UNILAG" },
                  { logo: "/LOGOS/2.svg", name: "UI" },
                  { logo: "/LOGOS/3.svg", name: "FUTMINNA" },
                  { logo: "/LOGOS/4.svg", name: "COVENANT" },
                  { logo: "/LOGOS/5.svg", name: "FUTO" },
                  { logo: "/LOGOS/6.svg", name: "OAU" }
                ].map((uni) => (
                  <div
                    key={`second-${uni.name}`}
                    className="flex-shrink-0 flex items-center justify-center"
                  >
                    <div className="dark:w-20 dark:h-20 dark:rounded-full dark:bg-white dark:flex dark:items-center dark:justify-center">
                      <Image
                        src={uni.logo}
                        alt={`${uni.name} Logo`}
                        width={80}
                        height={80}
                        className="h-16 dark:h-12 w-auto object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-16 md:py-24 px-4 md:px-6 bg-secondary/30 dark:bg-background transition-colors duration-300">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              How it
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Works</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your weekly activities into professional logs
            </p>
          </motion.div>

          <div className="space-y-16">
            {[
              {
                step: "1",
                title: "Write Your Summary",
                description: "Simply describe what you accomplished during the week in your own words. No formatting required.",
                detail: "Just type naturally about your tasks, projects, meetings, and learning experiences."
              },
              {
                step: "2",
                title: "AI Generates Daily Logs",
                description: "Our intelligent AI breaks down your summary into detailed, professional daily entries.",
                detail: "Each day gets specific activities, learning outcomes, and professional language."
              },
              {
                step: "3",
                title: "Review & Save",
                description: "Edit any details if needed, then save to your organized logbook collection.",
                detail: "Your logs are automatically formatted and ready for submission to supervisors."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`flex flex-col md:flex-row items-center gap-12 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Step Number */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold">{item.step}</span>
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 ${index % 2 === 1 ? 'md:text-right' : ''}`}>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-lg text-card-foreground mb-2 leading-relaxed">{item.description}</p>
                  <p className="text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>

                {/* Visual Element */}
                <div className="flex-shrink-0 w-64 h-32 bg-card rounded-2xl flex items-center justify-center border border-border">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-2"></div>
                    <div className="w-16 h-2 bg-muted rounded mx-auto mb-1"></div>
                    <div className="w-12 h-2 bg-muted rounded mx-auto"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <SmartCTAButton
              className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary/90 transition-all duration-300 inline-flex items-center space-x-2"
              authenticatedText="Go to Dashboard"
              unauthenticatedText="Try It Now"
            >
              <span>Try It Now</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </SmartCTAButton>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4 md:px-6 bg-gradient-to-r from-gray-900 via-gray-800 to-black dark:from-gray-950 dark:via-gray-900 dark:to-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Ready to Transform
              <br />
              Your SIWES Experience?
            </h2>
            <p className="text-xl text-gray-300 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the smart students who are already creating professional logbooks effortlessly
            </p>
            <SmartCTAButton
              className="bg-white dark:bg-gray-100 text-gray-900 dark:text-gray-800 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-all duration-300 inline-flex items-center space-x-2"
              authenticatedText="Open Dashboard"
              unauthenticatedText="Get Started Free"
            >
              <span>Get Started Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </SmartCTAButton>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-16 px-4 md:px-6 bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-8 md:mb-12">
            {/* Brand & Description */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-6">
                <Image
                  src="/LOGOS/SwiftLog_Dark.svg"
                  alt="SwiftLog Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The smartest way for IT students to create professional SIWES logbook entries.
                Transform your weekly summaries into detailed daily logs with SwiftLog&apos;s AI.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Features</a></li>
                <li><a href="#process" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">How it Works</a></li>
                <li><a href="/changelogs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Changelogs</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Developer */}
            <div>
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Built by</p>
                <p className="font-semibold text-gray-900 dark:text-white mb-3">DUKEDEV</p>
                <div className="flex space-x-3">
                  <motion.a
                    href="https://twitter.com/duke_azeta_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </motion.a>
                  <motion.a
                    href="https://github.com/dukeazeta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </motion.a>
                  <motion.a
                    href="https://www.linkedin.com/in/duke-azeta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                © 2025 SwiftLog. All rights reserved.
              </div>

            </div>
          </div>
        </div>
      </footer>
    </div>
    </PageTransition>
  );
}
