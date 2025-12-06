"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 pb-24 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute top-3/4 right-1/4 w-72 h-72 bg-primary/10 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-primary/10 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: [0, -80, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center z-10 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center w-full"
        >
          {/* Logo and Branding */}
          <div className="flex flex-col items-center mb-8">
            <div className="mb-6">
              <Image 
                src="/pics/LOGO-blank.png" 
                alt="Talent3X Logo" 
                width={240} 
                height={240} 
                className="w-[36vw] max-w-[360px] h-auto sm:w-[30vw] sm:max-w-[420px]"
              />
            </div>
            <p className="text-muted-foreground text-xl max-w-2xl">
              Build skills that count - together
            </p>
          </div>

          {/* Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mt-8 mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href="/stud">
                <Button size="lg" className="w-64">
                  Student Login
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href="/edu">
                <Button variant="outline" size="lg" className="w-64">
                  Educator Login
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Subheadline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Coordinate real projects, build verifiable skills, and share proof with one click.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl"
        >
          {/* Early Pilot Release Card */}
          <motion.div
            whileHover={{ y: -10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className="bg-card/80 backdrop-blur-sm border rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Early Pilot Release</h3>
            <p className="text-muted-foreground">
              This is an early pilot version of Talent3X. Features may change as we refine the platform together with our partner institutions.
            </p>
          </motion.div>

          {/* University-Focused Design Card */}
          <motion.div
            whileHover={{ y: -10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className="bg-card/80 backdrop-blur-sm border rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Academic Design</h3>
            <p className="text-muted-foreground">
              This pilot is specifically developed for academic environments. It showcases core concepts but does not represent the final commercial product.
            </p>
          </motion.div>

          {/* Feedback Welcome Card */}
          <motion.div
            whileHover={{ y: -10, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            className="bg-card/80 backdrop-blur-sm border rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Feedback Welcome</h3>
            <p className="text-muted-foreground">
              Your feedback plays a crucial role in shaping Talent3X. Share your ideas so we can improve usability, stability, and the overall experience.
            </p>
          </motion.div>
        </motion.div>

        {/* Why We're Building Talent3X Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-semibold mb-4">Why We{`'`}re Building Talent3X</h2>
          
          
          
          <p className="text-white/70 leading-relaxed mb-4">
            We believe skills should be visible, proof should be portable, and contribution should speak for itself. Talent3X is our step toward a fairer ecosystem where students gain recognition, educators get better insights, and institutions can measure impact more transparently.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. University Pilot.</p>
      </div>
    </div>
  );
}