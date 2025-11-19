"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col items-center justify-center px-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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
          className="absolute top-3/4 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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
          className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
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

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center justify-center text-center z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo and Branding */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg mb-6">
              <span className="text-white font-bold text-4xl">T</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-4">
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Talent3X
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Build skills that count — together
            </p>
          </div>

          {/* Login Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 mt-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Link href="/stud">
                <Button className="px-10 py-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl shadow-2xl text-xl font-bold w-64">
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
                <Button className="px-10 py-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-2xl shadow-2xl text-xl font-bold w-64">
                  Educator Login
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Admin Login (smaller, less prominent) */}
          <div className="mt-12">
            <Link href="/admin-talent3x" className="text-gray-500 hover:text-blue-600 transition-colors text-lg">
              Administrator Login
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center z-10">
        <p className="text-gray-600">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
      </div>
    </div>
  );
}