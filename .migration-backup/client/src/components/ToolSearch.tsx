import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toolConfigs, isHeroTool, type ToolConfig } from "@/lib/toolConfig";

// Display order for the category groups inside the search dialog.
const CATEGORY_ORDER = ["Convert", "Image Tools", "Edit", "Organize"];

const groupedTools = (): { category: string; tools: ToolConfig[] }[] => {
  const tools = Object.values(toolConfigs);
  const byCategory = new Map<string, ToolConfig[]>();
  for (const tool of tools) {
    const list = byCategory.get(tool.category) ?? [];
    list.push(tool);
    byCategory.set(tool.category, list);
  }
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...Array.from(byCategory.keys()).filter((c) => !CATEGORY_ORDER.includes(c)),
  ];
  return ordered.map((category) => ({
    category,
    tools: byCategory.get(category) ?? [],
  }));
};

interface ToolSearchProps {
  variant?: "full" | "icon";
  className?: string;
}

export const ToolSearch = ({
  variant = "full",
  className = "",
}: ToolSearchProps): JSX.Element => {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const groups = groupedTools();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = (tool: ToolConfig) => {
    const target = isHeroTool(tool.id) ? `/?tool=${tool.id}` : tool.route;
    setOpen(false);
    if (target) setLocation(target);
  };

  return (
    <>
      {variant === "full" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 ${className}`}
          data-testid="button-tool-search"
        >
          <Search className="h-4 w-4" />
          <span className="hidden xl:inline">Search tools</span>
          <kbd className="hidden xl:inline rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] text-gray-400">
            ⌘K
          </kbd>
        </button>
      ) : (
        <button
          type="button"
          aria-label="Search tools"
          onClick={() => setOpen(true)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 ${className}`}
          data-testid="button-tool-search"
        >
          <Search className="h-5 w-5" />
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search tools…"
          data-testid="input-tool-search"
        />
        <CommandList>
          <CommandEmpty>No tools found.</CommandEmpty>
          {groups.map(({ category, tools }) => (
            <CommandGroup key={category} heading={category}>
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <CommandItem
                    key={tool.id}
                    value={`${tool.title} ${tool.description} ${tool.id}`}
                    onSelect={() => handleSelect(tool)}
                    className="gap-3"
                    data-testid={`search-tool-${tool.id}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tool.iconBgColor}`}
                    >
                      <Icon className={`h-4 w-4 ${tool.iconColor}`} />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm font-medium text-gray-800">
                        {tool.title}
                      </span>
                      <span className="truncate text-xs text-gray-500">
                        {tool.description}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
};
