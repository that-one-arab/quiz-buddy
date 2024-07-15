import { useEffect, useState, useRef } from "react";

interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

interface Props {
  id?: string;
  placeholder?: string;
  value?: DropdownOption;
  options: DropdownOption[];
  onChange: (option: DropdownOption) => void;
  onTextFieldChange?: (text: string) => void;
}

export default function SearchableDropdown({
  id,
  placeholder,
  value,
  options,
  onChange,
  onTextFieldChange,
}: Props) {
  const [_value, setValue] = useState(value);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleClearDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const results = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(results);
    setHighlightIndex(-1); // Reset highlight index on search term change
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only proceed if the dropdown is currently open
      if (isDropdownOpen) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);

          // Optionally clear the search term or take other actions when the dropdown closes
          if (searchTerm) {
            // onChange({
            //   id: searchTerm.toLowerCase(),
            //   label: searchTerm,
            //   value: searchTerm.toLowerCase(),
            // });
            // Clear the search term if needed
            // setSearchTerm("");
          }
        }
      }
    };

    // Attach the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, searchTerm, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      setHighlightIndex((prevIndex) =>
        Math.min(prevIndex + 1, filteredOptions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      setHighlightIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      onChange(filteredOptions[highlightIndex]);
      setSearchTerm(filteredOptions[highlightIndex].label);
      handleClearDropdown();
      setValue(filteredOptions[highlightIndex]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        id={id}
        value={searchTerm}
        onChange={(e) => {
          if (!isDropdownOpen) {
            setIsDropdownOpen(true);
          }

          if (_value?.value !== e.target.value) {
            setValue(undefined);
          }

          onTextFieldChange && onTextFieldChange(e.target.value);
          setSearchTerm(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        className="block w-full rounded-md border-gray-300 sm:text-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500 focus:ring-opacity-50 focus:outline-none"
        placeholder={placeholder}
      />
      {isDropdownOpen && (
        <ul className="absolute z-10 w-full bg-white mt-1 max-h-60 overflow-auto border border-gray-300 rounded-md shadow-lg">
          {filteredOptions.map((option, index) => (
            <li
              key={option.id}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                index === highlightIndex ? "bg-gray-100" : ""
              }`}
              onClick={() => {
                onChange(option);
                setValue(option);
                setSearchTerm(option.label);
                setIsDropdownOpen(false);
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
