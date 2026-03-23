import { useState, useMemo } from 'react';
import { Check, Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FontOption {
  value: string;
  label: string;
  style: string;
}

interface SearchableFontPickerProps {
  fonts: FontOption[];
  value: string;
  onValueChange: (value: string) => void;
}

export default function SearchableFontPicker({
  fonts,
  value,
  onValueChange,
}: SearchableFontPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFonts = useMemo(() => {
    if (!searchQuery) return fonts;
    return fonts.filter(font => 
      font.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fonts, searchQuery]);

  const selectedFont = fonts.find(f => f.value === value) || fonts[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 bg-white border-slate-200"
        >
          <span className="truncate" style={{ fontFamily: selectedFont?.value }}>
            {selectedFont?.label || "Select font..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="flex items-center border-b p-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search fonts..."
              autoFocus
              className="h-8 border-none bg-transparent focus-visible:ring-0 px-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1">
              {filteredFonts.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-500">
                  No fonts found.
                </div>
              )}
              {filteredFonts.map((font) => (
                <div
                  key={font.value}
                  className={`
                    flex items-center justify-between px-2 py-2 rounded-sm cursor-pointer hover:bg-slate-100 transition-colors
                    ${value === font.value ? 'bg-slate-50 text-amber-600' : 'text-slate-700'}
                  `}
                  onClick={() => {
                    onValueChange(font.value);
                    setOpen(false);
                  }}
                >
                  <span style={{ fontFamily: font.value }} className="text-sm">
                    {font.label}
                  </span>
                  {value === font.value && <Check className="h-4 w-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
