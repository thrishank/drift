import { useDriftStore } from "@/lib/store";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function SubaccountSelector() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { subaccounts, selectedSubaccountIndex, setSelectedSubaccountIndex } =
    useDriftStore();

  const currentSubaccount = subaccounts[selectedSubaccountIndex] || {
    name: "Loading...",
  };

  const handleSubaccountChange = (index: number) => {
    setSelectedSubaccountIndex(index);
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        className="flex items-center bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span className="mr-2">{currentSubaccount.name}</span>
        <ChevronDown size={16} />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-10">
          {subaccounts.map((account, index) => (
            <button
              key={account.index}
              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-white"
              onClick={() => handleSubaccountChange(index)}
            >
              {account.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
