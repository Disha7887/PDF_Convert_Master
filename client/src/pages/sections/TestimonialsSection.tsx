import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { toolConfigs, isHeroTool, type ToolConfig } from "@/lib/toolConfig";
import { useLocation } from "wouter";

export const TestimonialsSection = (): JSX.Element => {
  const [, setLocation] = useLocation();

  // Every tool, in definition order (PDF conversions → image tools → PDF management)
  const tools = Object.values(toolConfigs);

  const handleToolClick = (tool: ToolConfig): void => {
    if (isHeroTool(tool.id)) {
      // PDF converters open IN PLACE on the homepage hero (same behavior as the
      // navbar dropdowns) — update the URL, then scroll up to the hero.
      setLocation(`/?tool=${tool.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tool.route) {
      // Image tools / PDF management open their dedicated upload pages.
      setLocation(tool.route);
    }
  };

  return (
    <section className="w-full py-24 bg-white relative overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground particleCount={25} />

      <div className="max-w-screen-xl mx-auto px-8 relative z-10">
        <div className="flex flex-col items-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 text-center leading-10 mb-4">
            Everything You Need for PDF Success
          </h2>
          <p className="text-xl text-gray-600 text-center max-w-screen-md">
            All your PDF and image tools in one place — click any tool to get
            started instantly
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => handleToolClick(tool)}
                className="group flex flex-col items-center text-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid={`card-tool-${tool.id}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.iconBgColor} transition-transform group-hover:scale-110`}
                >
                  <Icon className={`h-6 w-6 ${tool.iconColor}`} />
                </span>
                <span className="text-sm font-semibold text-gray-900 leading-snug">
                  {tool.title}
                </span>
                <span className="text-xs text-gray-500 leading-snug line-clamp-2">
                  {tool.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Ready to Transform Your PDF Workflow?
          </h3>
          <p className="text-base text-gray-600 text-center mb-8">
            Join millions of users who trust our platform for their document
            needs
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="font-semibold px-8 py-4 h-[59px] rounded-full">
              Get Started Free
            </Button>
            <Button
              variant="outline"
              className="bg-white text-gray-900 border-gray-200 font-semibold px-8 py-4 h-[59px] rounded-lg"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
