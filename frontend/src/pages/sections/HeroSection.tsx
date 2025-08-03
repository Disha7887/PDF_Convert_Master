import { ShieldIcon, SparklesIcon, UploadIcon, ZapIcon } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AnimatedSelectButton } from "@/components/ui/animated-select-button";
import { AnimatedParticles } from "@/components/ui/animated-particles";
import { BouncingUploadIcon } from "@/components/ui/bouncing-upload-icon";
import { useLocation } from "wouter";

export const HeroSection = (): JSX.Element => {
  const [location, setLocation] = useLocation();

  // Background decoration elements data
  const gradientBlurs = [
    {
      className:
        "absolute w-96 h-96 top-[102px] left-[72px] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(239,68,68,0.15)_0%,rgba(249,115,22,0.15)_100%)]",
    },
    {
      className:
        "absolute w-80 h-80 top-[614px] left-[976px] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(249,115,22,0.2)_0%,rgba(236,72,153,0.2)_100%)]",
    },
    {
      className:
        "absolute w-64 h-64 top-[563px] left-[216px] rounded-full blur-[32px] bg-[linear-gradient(135deg,rgba(236,72,153,0.25)_0%,rgba(239,68,68,0.25)_100%)]",
    },
  ];

  const borderCircles = [
    {
      className:
        "absolute w-40 h-40 top-64 left-72 rounded-full border-2 border-solid border-[#f770704c]",
    },
    {
      className:
        "absolute w-32 h-32 top-[717px] left-[880px] rounded-full border-2 border-solid border-[#fa913c66]",
    },
    {
      className:
        "absolute w-48 h-48 top-[525px] left-[864px] rounded-full border-2 border-solid border-[#f472b540]",
    },
  ];

  const dotElements = [
    {
      className:
        "absolute w-4 h-4 top-[205px] left-36 bg-[#ffffff4c] rounded-full",
    },
    {
      className:
        "absolute w-3 h-3 top-[410px] left-[1212px] bg-[#f7707066] rounded-full",
    },
    {
      className:
        "absolute w-2 h-2 top-[709px] left-72 bg-[#fa913c80] rounded-full",
    },
    {
      className:
        "absolute w-5 h-5 top-[614px] left-[1060px] bg-[#f472b559] rounded-full",
    },
    {
      className:
        "absolute w-6 h-6 top-[488px] left-[1008px] bg-[#fba5a54c] rounded-full",
    },
  ];

  const rotatedElements = [
    {
      className:
        "absolute w-12 h-12 top-[358px] left-[1080px] rotate-45 bg-[linear-gradient(135deg,rgba(239,68,68,0.2)_0%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "absolute w-8 h-8 top-[378px] left-[1264px] rotate-45 bg-[linear-gradient(135deg,rgba(249,115,22,0.25)_0%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "absolute w-16 h-16 top-[819px] left-[576px] rotate-45 bg-[linear-gradient(135deg,rgba(236,72,153,0.15)_0%,rgba(0,0,0,0)_100%)]",
    },
  ];

  const lineElements = [
    {
      className:
        "absolute w-px h-32 top-[205px] left-[360px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(248,113,113,0.3)_50%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "absolute w-px h-24 top-[614px] left-[935px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(251,146,60,0.4)_50%,rgba(0,0,0,0)_100%)]",
    },
    {
      className:
        "absolute w-px h-28 top-[605px] left-[864px] bg-[linear-gradient(0deg,rgba(0,0,0,0)_0%,rgba(244,114,182,0.35)_50%,rgba(0,0,0,0)_100%)]",
    },
  ];

  // File format options
  const fileFormats = [
    { format: "PDF", className: "w-[38.58px]" },
    { format: "DOC", className: "w-[40.44px]" },
    { format: "XLS", className: "w-[37.61px]" },
    { format: "JPG", className: "w-[38.88px]" },
  ];

  // Trust indicators
  const trustIndicators = [
    {
      icon: <ShieldIcon className="h-4 w-4 mr-1.5 text-[#d0d5da]" />,
      text: "100% Secure",
      className: "w-[102.7px]",
    },
    {
      icon: <ZapIcon className="h-4 w-4 mr-1.5 text-[#d0d5da]" />,
      text: "Instant Processing",
      className: "w-[138.88px] ml-8",
    },
    {
      icon: <SparklesIcon className="h-4 w-4 mr-1.5 text-[#d0d5da]" />,
      text: "Always Free",
      className: "w-[97.47px] ml-8",
    },
  ];

  return (
    <section className="flex flex-col w-full items-start relative bg-[#111726] min-h-screen">
      <div className="flex flex-col w-full items-start relative">
        {/* Background decorative elements */}
        <div className="absolute w-full h-full top-0 left-0">
          {/* Animated particles background */}
          <AnimatedParticles count={35} />

          {gradientBlurs.map((blur, index) => (
            <div key={`blur-${index}`} className={blur.className} />
          ))}

          {borderCircles.map((circle, index) => (
            <div key={`circle-${index}`} className={circle.className} />
          ))}

          {dotElements.map((dot, index) => (
            <div key={`dot-${index}`} className={dot.className} />
          ))}

          {rotatedElements.map((element, index) => (
            <div key={`rotated-${index}`} className={element.className} />
          ))}

          {lineElements.map((line, index) => (
            <div key={`line-${index}`} className={line.className} />
          ))}
        </div>

        <div className="flex w-full items-center relative">
          <div className="max-w-screen-xl mx-auto px-8 py-20 w-full relative">
              <div className="flex flex-wrap w-full items-center gap-12 relative">
                {/* Left column - Text content */}
                <div className="flex flex-col w-full md:w-[584px] items-start relative">
                  <div className="flex flex-col w-full items-start relative">
                    <div className="flex flex-col w-full items-start relative">
                      <Badge className="flex h-[38px] items-center px-[17px] py-[9px] bg-[#ef444433] text-red-300 rounded-full border border-solid border-[#f770704c]">
                        <img
                          className="mr-2"
                          alt="Margin wrap"
                          src="/figmaAssets/margin-wrap.svg"
                        />
                        <span className="font-medium text-sm">
                          Trusted by 10M+ users worldwide
                        </span>
                      </Badge>

                      <div className="pt-4">
                        <h1 className="font-bold text-white text-5xl leading-[48px] max-w-[584px]">
                          Professional PDF tools trusted by millions
                        </h1>
                      </div>

                      <div className="pt-4">
                        <p className="font-normal text-[#d0d5da] text-lg leading-7 max-w-2xl">
                          Every tool you need to use PDFs, at your fingertips.
                          All are 100% FREE and easy to use! Merge, split,
                          compress, convert, rotate, unlock and watermark PDFs
                          with just a few clicks.
                        </p>
                      </div>
                    </div>

                    <div className="pt-8">
                      <div className="flex gap-4">
                        <Button
                          className="h-[61px] px-8 py-4 rounded-lg shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]"
                          onClick={() => {
                            console.log('Start Converting Now button clicked');
                            setLocation('/tools');
                          }}
                        >
                          <img
                            className="mr-2"
                            alt="Margin wrap"
                            src="/figmaAssets/margin-wrap-3.svg"
                          />
                          <span className="font-semibold text-base">
                            Start Converting Now
                          </span>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-[61px] px-[34px] py-[18px] bg-[#ffffff1a] text-white rounded-lg border-2 border-solid border-[#ffffff33] backdrop-blur-[2px]"
                          onClick={() => {
                            console.log('Learn More button clicked from hero');
                            setLocation('/learn-more');
                          }}
                        >
                          <img
                            className="mr-2"
                            alt="Margin wrap"
                            src="/figmaAssets/margin-wrap-5.svg"
                          />
                          <span className="font-semibold text-base">
                            Learn More
                          </span>
                        </Button>
                      </div>
                    </div>

                    <div className="pt-8">
                      <div className="flex items-center">
                        {trustIndicators.map((indicator, index) => {
                          // Different animation timing for each element
                          const animationDelay = index * 0.8; // 0s, 0.8s, 1.6s delays
                          const floatingVariants = {
                            animate: {
                              y: [-4, 4, -4],
                              transition: {
                                duration: 3 + index * 0.5, // Different durations: 3s, 3.5s, 4s
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: animationDelay,
                              }
                            }
                          };

                          return (
                            <motion.div
                              key={`indicator-${index}`}
                              className={`flex h-5 items-center ${indicator.className}`}
                              variants={floatingVariants}
                              animate="animate"
                              initial={{ y: 0 }}
                            >
                              {indicator.icon}
                              <span className="font-normal text-[#d0d5da] text-sm leading-5">
                                {indicator.text}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column - File upload card */}
                <Card className="flex flex-col w-full md:w-[584px] h-[405px] items-start p-[50px] bg-[#ffffff1a] rounded-3xl border-2 border-dashed border-[#6a7280] backdrop-blur-[2px]">
                  <div className="flex flex-col items-center justify-center w-full p-0">
                    <BouncingUploadIcon
                      className="mb-3"
                      iconType="lucide"
                      alt="Upload icon"
                      iconClassName="text-white"
                      size="md"
                      animationSpeed="fast"
                      bgColor="bg-red-500"
                    />

                    <h2 className="font-bold text-white text-xl text-center mb-3">
                      Drop your PDF here
                    </h2>

                    <p className="font-normal text-[#d0d5da] text-base text-center mb-8">
                      or click to browse files
                    </p>

                    <AnimatedSelectButton className="h-[57px] px-12 py-4 mb-8 rounded-xl shadow-[0px_10px_15px_-3px_#0000001a,0px_4px_6px_-4px_#0000001a]">
                      <UploadIcon className="mr-2 h-5 w-5" />
                      <span className="text-base">
                        Select PDF File
                      </span>
                    </AnimatedSelectButton>

                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                      {fileFormats.map((format, index) => (
                        <div
                          key={`format-${index}`}
                          className={`flex h-4 items-center ${format.className}`}
                        >
                          <img
                            className="mr-1"
                            alt={`${format.format} icon`}
                            src={`/figmaAssets/margin-wrap-${index === 0 ? "26" : index === 1 ? "4" : index === 2 ? "9" : "6"}.svg`}
                          />
                          <span className="font-normal text-[#9ca2af] text-xs text-center">
                            {format.format}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
};
