'use client';

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { gsap } from "gsap";
import SmartCTAButton from "../../components/SmartCTAButton";
import PageTransition from "../../components/PageTransition";
import Logo from "../../components/Logo";
import {
  changelogs,
  categoryIcons,
  typeColors
} from "../../lib/changelogs-data";

export default function Changelogs() {
  useEffect(() => {
    // Set initial visibility to prevent flash
    gsap.set([".changelog-header", ".changelog-entry"], { opacity: 1 });

    // Animate page elements with more reliable approach
    const tl = gsap.timeline({ delay: 0.1 });
    tl.from(".changelog-header", {
      duration: 0.6,
      y: 20,
      opacity: 0,
      ease: "power2.out"
    })
    .from(".changelog-entry", {
      duration: 0.5,
      y: 15,
      opacity: 0,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.3");
  }, []);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
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
                <Link href="/" className="flex items-center">
                  <Logo
                    width={48}
                    height={48}
                    className="w-10 h-10 md:w-12 md:h-12"
                  />
                </Link>
              </div>

              <div className="hidden md:flex items-center space-x-8">
                <Link href="/#features" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                  Features
                </Link>
                <Link href="/#process" className="text-muted-foreground hover:text-foreground font-medium transition-colors">
                  Process
                </Link>
                <Link href="/changelogs" className="text-foreground font-semibold">
                  Changelogs
                </Link>
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

        {/* Main Content */}
        <main className="pt-28 pb-12 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="changelog-header text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-3"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-info text-info-foreground text-sm font-extrabold mb-6 shadow-xl border-2 border-info">
                  <span className="w-2 h-2 bg-info-foreground rounded-full mr-2 animate-pulse"></span>
                  Product Updates
                </div>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
                Changelogs
              </h1>
            </div>

            {/* Changelog Entries */}
            <div className="space-y-10">
              {changelogs.map((entry, index) => (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="changelog-entry"
                >
                  {/* Entry Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-border">
                    <div className="flex items-center space-x-4 mb-3 md:mb-0">
                      <div className={`w-3 h-3 rounded-full ${typeColors[entry.type]}`}></div>
                      <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
                        v{entry.version}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        entry.type === 'major' ? 'bg-error-muted text-error-muted-foreground' :
                        entry.type === 'minor' ? 'bg-info-muted text-info-muted-foreground' :
                        entry.type === 'patch' ? 'bg-success-muted text-success-muted-foreground' :
                        'bg-warning-muted text-warning-muted-foreground'
                      }`}>
                        {entry.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-muted-foreground font-medium">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Entry Content */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-card-foreground mb-3">
                      {entry.title}
                    </h3>
                  </div>

                  {/* Changes */}
                  <div className="space-y-6">
                    {entry.changes.map((changeGroup, groupIndex) => (
                      <div key={groupIndex}>
                        <div className="flex items-center mb-4">
                          <span className="text-xl mr-3">{categoryIcons[changeGroup.category]}</span>
                          <h4 className="text-lg font-semibold text-card-foreground">
                            {changeGroup.category.charAt(0).toUpperCase() + changeGroup.category.slice(1)}
                          </h4>
                        </div>
                        <ul className="space-y-2 ml-7">
                          {changeGroup.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start">
                              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              <span className="text-muted-foreground leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Divider for next entry */}
                  {index < changelogs.length - 1 && (
                    <div className="mt-10 pt-6">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>


          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 md:py-12 px-4 md:px-6 bg-secondary/50 dark:bg-background transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            {/* Main Footer Content */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Brand & Description */}
              <div className="md:col-span-1">
                <div className="flex items-center mb-6">
                  <Logo
                    width={40}
                    height={40}
                    className="w-10 h-10"
                  />
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  The smartest way for IT students to create professional SIWES logbook entries.
                  Transform your weekly summaries into detailed daily logs with SwiftLog&apos;s AI.
                </p>
              </div>

              {/* Product Links */}
              <div>
                <h4 className="font-semibold text-foreground mb-6">Product</h4>
                <ul className="space-y-4">
                  <li><Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="/#process" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</Link></li>
                  <li><Link href="/changelogs" className="text-muted-foreground hover:text-foreground transition-colors">Changelogs</Link></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
                </ul>
              </div>

              {/* Support & Developer */}
              <div>
                <h4 className="font-semibold text-foreground mb-6">Support & Info</h4>
                <ul className="space-y-4 mb-8">
                  <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                </ul>

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">Built by</p>
                  <p className="font-semibold text-foreground mb-3">DUKEDEV</p>
                  <div className="flex space-x-3">
                    <motion.a
                      href="https://twitter.com/duke_azeta_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://github.com/dukeazeta"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </motion.a>
                    <motion.a
                      href="https://www.linkedin.com/in/duke-azeta/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
                      whileHover={{ y: -2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </motion.a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-gray-500 text-sm">
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
