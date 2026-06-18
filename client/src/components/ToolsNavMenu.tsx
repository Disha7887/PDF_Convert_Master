import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { toolConfigs } from "@/lib/toolConfig";
import { useLocation } from "wouter";

// Tools grouped for the navbar dropdowns
const PDF_FROM = ["pdf-to-word", "pdf-to-excel", "pdf-to-powerpoint", "pdf-to-images"];
const PDF_TO = ["word-to-pdf", "excel-to-pdf", "powerpoint-to-pdf", "images-to-pdf", "html-to-pdf"];
const IMAGE_TOOLS = [
  "resize-images",
  "crop-images",
  "rotate-images",
  "convert-image-format",
  "compress-images",
  "upscale-images",
  "remove-background",
];

const triggerClass =
  "font-medium text-gray-600 text-base leading-6 bg-transparent hover:bg-transparent hover:text-gray-900 focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-gray-900 px-0 h-auto";

const ToolLink = ({ id }: { id: string }): JSX.Element | null => {
  const [, setLocation] = useLocation();
  const tool = toolConfigs[id];
  if (!tool) return null;
  const Icon = tool.icon;
  return (
    <NavigationMenuLink asChild>
      <button
        type="button"
        onClick={() => tool.route && setLocation(tool.route)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-blue-50"
        data-testid={`nav-tool-${tool.id}`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tool.iconBgColor}`}
        >
          <Icon className={`h-4 w-4 ${tool.iconColor}`} />
        </span>
        <span className="whitespace-nowrap text-sm font-medium text-gray-700">
          {tool.title}
        </span>
      </button>
    </NavigationMenuLink>
  );
};

const ColumnHeading = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
    {children}
  </p>
);

export const ToolsNavDropdowns = (): JSX.Element => {
  const [, setLocation] = useLocation();

  return (
    <>
      {/* PDF Converter */}
      <NavigationMenuItem>
        <NavigationMenuTrigger className={triggerClass} data-testid="nav-pdf-converter">
          PDF Converter
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid w-[520px] grid-cols-2 gap-x-6 gap-y-0.5 p-4">
            <div>
              <ColumnHeading>Convert from PDF</ColumnHeading>
              {PDF_FROM.map((id) => (
                <ToolLink key={id} id={id} />
              ))}
            </div>
            <div>
              <ColumnHeading>Convert to PDF</ColumnHeading>
              {PDF_TO.map((id) => (
                <ToolLink key={id} id={id} />
              ))}
            </div>
          </div>
          <div className="border-t border-gray-100 px-4 py-3">
            <NavigationMenuLink asChild>
              <button
                type="button"
                onClick={() => setLocation("/tools")}
                className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                data-testid="nav-view-all-tools"
              >
                View all tools →
              </button>
            </NavigationMenuLink>
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>

      {/* Image Tools */}
      <NavigationMenuItem>
        <NavigationMenuTrigger className={triggerClass} data-testid="nav-image-tools">
          Image Tools
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className="grid w-[520px] grid-cols-2 gap-x-6 gap-y-0.5 p-4">
            {IMAGE_TOOLS.map((id) => (
              <ToolLink key={id} id={id} />
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </>
  );
};
