import React, { useState } from "react";
import { Maximize2, ImageIcon, Lock, Download, Save, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import "./_group.css";

export function ToolPage() {
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(640);
  const [lockAspect, setLockAspect] = useState(true);

  return (
    <div className="font-['Inter'] bg-[#f9fafb] text-foreground min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-[72px] px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-['Poppins'] font-bold text-xl text-foreground tracking-tight">
              PDF Convert Master
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {["Home", "Tools", "Pricing", "About"].map((item) => (
              <a key={item} href="#" className="text-[15px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground font-medium px-5">
              Log In
            </Button>
            <Button className="rounded-full font-medium px-6 shadow-sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-16 md:py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-[1.25rem] bg-accent text-primary flex items-center justify-center mb-6 shadow-sm">
            <Maximize2 className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-['Poppins'] font-extrabold text-foreground mb-5 tracking-tight">
            Image Resizer
          </h1>
          <p className="text-[17px] leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Resize images to exact dimensions or scale by percentage. Lock the aspect ratio to avoid distortion, then download or save to the server.
          </p>
        </div>

        {/* Tool Card */}
        <div className="bg-white rounded-[2rem] border border-border shadow-sm p-6 md:p-10 lg:p-12">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            {/* Left: Preview */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-border bg-gray-50 flex flex-col items-center justify-center min-h-[280px] p-6 text-muted-foreground shadow-inner">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-sm font-medium opacity-60">Sample Photo Preview</p>
              </div>
              <div className="flex items-center justify-between text-[15px] px-2">
                <span className="text-muted-foreground font-medium">Original: 1920 × 1280px</span>
                <span className="text-primary font-bold">New: {width} × {height}px</span>
                <span className="text-muted-foreground font-medium">1.4 MB</span>
              </div>
            </div>

            {/* Right: Controls */}
            <div className="space-y-8 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2.5">
                  <Label htmlFor="width" className="text-[15px] font-semibold text-foreground">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="rounded-xl h-12 px-4 text-base font-medium shadow-sm bg-gray-50/50"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="height" className="text-[15px] font-semibold text-foreground">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="rounded-xl h-12 px-4 text-base font-medium shadow-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-gray-50/50">
                <Label htmlFor="lock-aspect" className="flex items-center gap-2.5 cursor-pointer font-semibold text-[15px]">
                  <Lock className="w-[18px] h-[18px] text-muted-foreground" />
                  Lock aspect ratio
                </Label>
                <Switch
                  id="lock-aspect"
                  checked={lockAspect}
                  onCheckedChange={setLockAspect}
                  className="scale-110 data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-3.5">
                <Label className="text-[15px] font-semibold text-foreground block">Quick scale</Label>
                <div className="flex flex-wrap gap-2.5">
                  {["25%", "50%", "75%", "100%"].map((pct) => (
                    <Button key={pct} variant="outline" size="sm" className="rounded-full h-9 px-5 font-semibold text-sm border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-foreground">
                      {pct}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="my-2" />

              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row gap-3.5">
                  <Button className="flex-1 rounded-full h-[52px] text-base font-bold shadow-md gap-2 hover:shadow-lg transition-all">
                    <Download className="w-[22px] h-[22px]" />
                    Download
                  </Button>
                  <Button variant="secondary" className="flex-1 rounded-full h-[52px] text-base font-bold gap-2 bg-gray-100 hover:bg-gray-200 text-foreground shadow-sm">
                    <Save className="w-[20px] h-[20px] opacity-70" />
                    Save to server
                  </Button>
                </div>
                
                <div className="pt-2 text-center">
                  <Button variant="ghost" className="rounded-full text-[15px] text-muted-foreground font-semibold gap-2 hover:bg-gray-50 hover:text-foreground px-6 h-11">
                    <RefreshCw className="w-[18px] h-[18px]" />
                    Choose a different image
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
