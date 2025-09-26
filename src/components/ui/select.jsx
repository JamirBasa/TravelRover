import React from "react";

const Select = ({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full py-3 px-3 pr-10 border-2 border-gray-200 rounded-lg focus:border-black focus:outline-none bg-white text-base appearance-none leading-tight ${
        disabled ? "bg-gray-100 text-gray-400" : ""
      } ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: "right 0.75rem center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "1.25em 1.25em",
      }}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
