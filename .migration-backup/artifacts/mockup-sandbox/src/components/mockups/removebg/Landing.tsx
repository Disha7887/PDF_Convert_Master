import React from "react";
import { 
  FileText, 
  ArrowRight, 
  Upload, 
  Shield, 
  Zap, 
  Sparkles, 
  ArrowRightLeft, 
  Layers 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import "./_group.css";

export function Landing() {
  return (
    <div className="font-['Inter'] bg-white text-foreground min-h-screen flex flex-col">
      {/* 1. STICKY TOP NAV */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-['Poppins'] font-bold text-lg tracking-tight">
              PDF Convert Master
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Tools", "Pricing", "About"].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-full text-muted-foreground hover:text-foreground border-border hover:bg-secondary">
              Log In
            </Button>
            <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 2. HERO */}
        <section className="max-w-screen-xl mx-auto px-6 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
            {/* Left Column */}
            <div className="flex flex-col items-start gap-8">
              <Badge variant="secondary" className="rounded-full bg-accent text-accent-foreground px-4 py-1.5 text-sm font-medium border-0">
                ★ Trusted by 10M+ users worldwide
              </Badge>
              
              <h1 className="font-['Poppins'] font-bold text-5xl lg:text-6xl leading-[1.1] text-foreground tracking-tight">
                Professional PDF tools trusted by millions
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" className="rounded-full h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
                  <Zap className="mr-2 w-5 h-5" />
                  Start Converting Now
                </Button>
                <Button size="lg" variant="outline" className="rounded-full h-14 px-8 text-base font-semibold border-border hover:bg-secondary text-foreground">
                  Learn More
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-8 pt-4">
                {[
                  { icon: Shield, text: "100% Secure" },
                  { icon: Zap, text: "Instant Processing" },
                  { icon: Sparkles, text: "Always Free" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column (Hero Visual) */}
            <div className="w-full max-w-lg mx-auto lg:ml-auto">
              <Card className="rounded-3xl border-2 border-dashed border-primary/30 bg-white shadow-xl shadow-primary/5 p-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                  <Upload className="w-10 h-10 text-primary-foreground" />
                </div>
                
                <h2 className="font-['Poppins'] font-bold text-2xl mb-2 text-foreground">
                  Drop your PDF here
                </h2>
                <p className="text-muted-foreground mb-8">
                  or click to browse files
                </p>

                <Button size="lg" className="rounded-full w-full max-w-xs h-14 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mb-8">
                  <Upload className="mr-2 w-5 h-5" />
                  Select PDF File
                </Button>

                <div className="flex items-center justify-center gap-3 w-full">
                  {["PDF", "DOC", "XLS", "JPG"].map((fmt) => (
                    <div key={fmt} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-semibold">
                      {fmt}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. STATS BAND */}
        <section className="max-w-screen-xl mx-auto px-6 mb-24">
          <div className="rounded-3xl bg-secondary/50 border border-border/50 py-12 px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-border/0 lg:divide-border/50">
              {[
                { value: "10M+", label: "Active Users" },
                { value: "100M+", label: "Files Processed" },
                { value: "99.9%", label: "Uptime" },
                { value: "24/7", label: "Support" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="font-['Poppins'] font-bold text-4xl lg:text-5xl text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. FEATURES */}
        <section className="max-w-screen-xl mx-auto px-6 mb-32">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-['Poppins'] font-bold text-3xl lg:text-4xl text-foreground mb-4">
              Transform Your PDF Workflow
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover how millions of users worldwide are revolutionizing their document management with our powerful PDF tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Convert",
                icon: ArrowRightLeft,
                desc: "Transform your documents between different formats with perfect quality preservation.",
                bullets: ["PDF to Word", "Word to PDF", "Excel to PDF", "Image to PDF"]
              },
              {
                title: "Organize",
                icon: Layers,
                desc: "Merge, split, and reorganize your PDF documents with powerful editing tools.",
                bullets: ["Merge PDFs", "Split PDFs", "Compress Files", "Rotate Pages"]
              },
              {
                title: "Secure",
                icon: Shield,
                desc: "Protect your documents with advanced security features and encryption.",
                bullets: ["Password Protect", "Remove Password", "Add Watermark", "Digital Signature"]
              }
            ].map((card, i) => (
              <Card key={i} className="rounded-2xl border border-border bg-white p-8 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                  <card.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-['Poppins'] font-bold text-xl text-foreground mb-3">
                  {card.title}
                </h3>
                <p className="text-muted-foreground mb-8 flex-grow leading-relaxed">
                  {card.desc}
                </p>
                <ul className="space-y-3">
                  {card.bullets.map((bullet, bi) => (
                    <li key={bi} className="flex items-center text-sm text-foreground font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="border-t border-border bg-secondary/30 pt-16 pb-8">
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary text-primary-foreground p-1 rounded-md">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-['Poppins'] font-bold text-lg">
                  PDF Convert Master
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                The ultimate suite of PDF tools to convert, organize, and secure your documents effortlessly.
              </p>
            </div>
            
            <div>
              <h4 className="font-['Poppins'] font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-3">
                {["Features", "Tools", "Pricing", "API"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-['Poppins'] font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-3">
                {["About Us", "Blog", "Careers", "Contact"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-['Poppins'] font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 PDF Convert Master. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
