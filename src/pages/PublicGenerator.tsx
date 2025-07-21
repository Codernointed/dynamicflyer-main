/**
 * Public Generator Page
 * Public-facing page for end-users to generate personalized flyers
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Upload, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PublicGenerator() {
  const { templateId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Create Your Personalized Flyer
          </h1>
          <p className="text-muted-foreground">
            Add your photo and details to generate your custom flyer
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Flyer</CardTitle>
                <CardDescription>
                  Upload your photo and enter your details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Upload className="inline h-4 w-4 mr-1" />
                    Upload Photo
                  </label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Click to upload or drag and drop</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Type className="inline h-4 w-4 mr-1" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-input rounded-md"
                  />
                </div>

                <Button className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Generate & Download
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Template ID: {templateId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Flyer Preview</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-8"
        >
          <Card className="max-w-md mx-auto">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                🚧 Public generator under construction
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 