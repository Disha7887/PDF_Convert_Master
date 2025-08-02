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
      description: "Process documents in seconds with our optimized infrastructure"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "Bank-level encryption and SOC 2 compliant infrastructure"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global CDN",
      description: "99.9% uptime with servers worldwide for optimal performance"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Multi-Platform",
      description: "SDKs available for Python, Node.js, PHP, Java, and more"
    }
  ];

  const codeExamples = {
    curl: `curl -X POST "https://api.pdfconvertmaster.com/v1/convert" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@document.docx" \\
  -F "format=pdf"`,
    
    javascript: `const response = await fetch('https://api.pdfconvertmaster.com/v1/convert', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
  },
  body: formData
});

const result = await response.json();
console.log('Conversion completed:', result.download_url);`,
    
    python: `import requests

url = "https://api.pdfconvertmaster.com/v1/convert"
headers = {"Authorization": "Bearer YOUR_API_KEY"}
files = {"file": open("document.docx", "rb")}
data = {"format": "pdf"}

response = requests.post(url, headers=headers, files=files, data=data)
result = response.json()

print(f"Download URL: {result['download_url']}")`
  };

  const endpoints = [
    {
      method: "POST",
      path: "/v1/convert",
      description: "Convert documents between formats",
      example: "Convert Word to PDF, Excel to PDF, images to PDF"
    },
    {
      method: "POST", 
      path: "/v1/merge",
      description: "Merge multiple PDF files into one",
      example: "Combine multiple PDFs into a single document"
    },
    {
      method: "POST",
      path: "/v1/split",
      description: "Split PDF into separate pages or ranges", 
      example: "Extract specific pages from a PDF document"
    },
    {
      method: "POST",
      path: "/v1/compress",
      description: "Reduce PDF file size while maintaining quality",
      example: "Optimize PDFs for web or email sharing"
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
            Integrate PDF conversion, merging, and processing capabilities directly into your applications 
            with our RESTful API. Trusted by 10,000+ developers worldwide.
          </p>
        </div>

        {/* API Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Code Examples */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Terminal className="w-6 h-6 mr-3 text-blue-400" />
                Quick Start
              </h3>
              <p className="text-gray-300 mb-6">
                Get started with our API in minutes. Choose your preferred language and start converting documents.
              </p>
            </div>

            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
                <TabsTrigger value="curl" className="data-[state=active]:bg-blue-600">cURL</TabsTrigger>
                <TabsTrigger value="javascript" className="data-[state=active]:bg-blue-600">JavaScript</TabsTrigger>
                <TabsTrigger value="python" className="data-[state=active]:bg-blue-600">Python</TabsTrigger>
              </TabsList>
              
              {Object.entries(codeExamples).map(([language, code]) => (
                <TabsContent key={language} value={language} className="mt-4">
                  <div className="relative">
                    <pre className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                      <code>{code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => copyToClipboard(code, language)}
                    >
                      {copiedEndpoint === language ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Right Column - API Endpoints */}
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Layers className="w-6 h-6 mr-3 text-green-400" />
                API Endpoints
              </h3>
              <p className="text-gray-300 mb-6">
                Comprehensive API endpoints for all your PDF processing needs.
              </p>
            </div>

            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="outline" 
                          className={`font-mono text-xs ${
                            endpoint.method === 'POST' ? 'border-green-500/50 text-green-400' : 'border-blue-500/50 text-blue-400'
                          }`}
                        >
                          {endpoint.method}
                        </Badge>
                        <code className="text-white font-mono text-sm">{endpoint.path}</code>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{endpoint.description}</p>
                    <p className="text-gray-400 text-xs">{endpoint.example}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 pt-16 border-t border-white/10">
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
        <div className="mt-16 text-center">
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
                onClick={() => setLocation('/api-setup')}
              >
                <Code2 className="w-5 h-5 mr-2" />
                Get API Key
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-4"
                onClick={() => setLocation('/api-reference')}
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
