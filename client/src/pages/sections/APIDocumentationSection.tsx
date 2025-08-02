import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Code2,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { useLocation } from "wouter";

export const APIDocumentationSection = (): JSX.Element => {
  const [, setLocation] = useLocation();

  const apiFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Process documents in seconds"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "Bank-level encryption"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "99.9% Uptime",
      description: "Reliable global infrastructure"
    }
  ];

  return (
    <section className="relative bg-[#111726] py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 top-20 right-20 rounded-full blur-[40px] bg-[linear-gradient(135deg,rgba(59,130,246,0.1)_0%,rgba(168,85,247,0.1)_100%)]" />
        <div className="absolute w-64 h-64 bottom-20 left-20 rounded-full blur-[30px] bg-[linear-gradient(135deg,rgba(239,68,68,0.1)_0%,rgba(249,115,22,0.1)_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 px-4 py-2 bg-blue-600/20 text-blue-300 border-blue-500/30">
            <Code2 className="w-4 h-4 mr-2" />
            Developer API
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful PDF API for Developers
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Integrate PDF conversion and processing directly into your applications.
            Trusted by 10,000+ developers worldwide.
          </p>
        </div>

        {/* API Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {apiFeatures.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Code Example */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Simple Integration</h3>
            <p className="text-gray-300">Get started with just a few lines of code</p>
          </div>

          <Card className="bg-black/40 border-white/10 max-w-3xl mx-auto">
            <CardContent className="p-6">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{`curl -X POST "https://api.pdfconvertmaster.com/v1/convert" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@document.docx" \\
  -F "format=pdf"`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mb-16 pt-16 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">10,000+</div>
              <div className="text-gray-400">Active Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-gray-400">API Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">100M+</div>
              <div className="text-gray-400">API Calls/Month</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50ms</div>
              <div className="text-gray-400">Avg Response Time</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to integrate PDF processing into your app?
            </h3>
            <p className="text-gray-300 mb-8">
              Get started with our free tier - 1,000 API calls per month, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4"
                onClick={() => setLocation('/dashboard/api-setup')}
              >
                <Code2 className="w-5 h-5 mr-2" />
                Get API Key
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 !text-white hover:bg-white/10 hover:!text-white hover:border-white/50 px-8 py-4 bg-transparent"
                onClick={() => setLocation('/dashboard/api-reference')}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Documentation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
