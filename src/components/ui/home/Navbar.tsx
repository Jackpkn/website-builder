import { motion } from "motion/react";
import { Code } from "lucide-react";

// Enhanced Navbar
const Navbar = () => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 z-50 w-full backdrop-blur-xl bg-slate-900/20 border-b border-white/10"
    >
      <nav className="mx-auto px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500 rounded-lg blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-r from-teal-600 to-teal-400 p-2 rounded-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              ACET
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
          </motion.button>
        </div>
      </nav>
    </motion.header>
  );
};

export default Navbar;
