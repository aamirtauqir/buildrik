/**
 * Aquibra Autocomplete Field
 * @license BSD-3-Clause
 */

import * as React from "react";

export interface AutocompleteOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface AutocompleteFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
  freeSolo?: boolean; // Allow custom values
  className?: string;
}

export const AutocompleteField: React.FC<AutocompleteFieldProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "Search...",
  disabled = false,
  error,
  loading = false,
  onSearch,
  freeSolo = false,
  className,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase()) ||
      opt.value.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setHighlightedIndex(0);
    onSearch?.(newQuery);

    if (freeSolo) {
      onChange(newQuery);
    }
  };

  const handleSelect = (option: AutocompleteOption) => {
    setQuery(option.label);
    onChange(option.value);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className={`aqb-autocomplete ${className || ""}`} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 500,
            marginBottom: 6,
            color: "var(--aqb-text-secondary)",
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: "100%",
            padding: "8px 12px",
            paddingRight: loading ? 36 : 12,
            background: "var(--aqb-bg-input)",
            border: `1px solid ${error ? "var(--aqb-danger)" : "var(--aqb-border)"}`,
            borderRadius: 6,
            color: "var(--aqb-text-primary)",
            fontSize: 13,
            outline: "none",
          }}
        />

        {loading && (
          <div
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              border: "2px solid var(--aqb-border)",
              borderTopColor: "var(--aqb-primary)",
              borderRadius: "50%",
              animation: "aqb-spin 0.6s linear infinite",
            }}
          />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--aqb-bg-panel)",
            border: "1px solid var(--aqb-border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
            maxHeight: 240,
            overflow: "auto",
            zIndex: 100,
          }}
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              style={{
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                background: index === highlightedIndex ? "var(--aqb-bg-hover)" : "transparent",
              }}
            >
              {option.icon && <span style={{ fontSize: 16 }}>{option.icon}</span>}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{option.label}</div>
                {option.description && (
                  <div style={{ fontSize: 11, color: "var(--aqb-text-muted)" }}>
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "var(--aqb-danger)", marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
};

export default AutocompleteField;
