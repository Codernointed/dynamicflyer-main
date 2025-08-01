import React from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Star, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <Layout>
      <Hero />
      
      {/* How It Works Section */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg"
            >
              How It Works
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-white drop-shadow-md"
            >
              Create, share, and personalize flyers in three simple steps
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Create Template",
                description: "Design beautiful flyer templates with our intuitive editor. Add text, images, and custom shapes.",
                icon: "🎨"
              },
              {
                step: "2", 
                title: "Share Link",
                description: "Generate a unique link for your template that anyone can access and customize.",
                icon: "🔗"
              },
              {
                step: "3",
                title: "Personalize",
                description: "Users can add their own photos, text, and details to create personalized versions.",
                icon: "✨"
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8 rounded-lg bg-black/40 backdrop-blur-sm border border-white/30 shadow-xl"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
                  {item.icon}
                </div>
                <div className="text-amber-400 font-bold text-sm mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-semibold text-white mb-4 drop-shadow-md">{item.title}</h3>
                <p className="text-white/90 drop-shadow-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg"
            >
              Ready to Create Amazing Flyers?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg text-white mb-8 drop-shadow-md"
            >
              Join thousands of creators who are already using Infinity Generation to design beautiful templates
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button asChild size="lg" className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white border-0">
                <Link to="/signup" className="group inline-flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Get Started for Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default Index;