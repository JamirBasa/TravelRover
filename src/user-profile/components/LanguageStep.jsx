import { FaLanguage, FaGlobeAmericas } from "react-icons/fa";

const LanguageStep = ({ profileData, handleMultiSelect }) => {
  // Languages with flags/icons
  const languages = [
    { id: "english", label: "English", flag: "🇺🇸", desc: "Global language" },
    {
      id: "filipino",
      label: "Filipino/Tagalog",
      flag: "🇵🇭",
      desc: "National language",
    },
    { id: "cebuano", label: "Cebuano", flag: "🇵🇭", desc: "Visayan dialect" },
    {
      id: "ilocano",
      label: "Ilocano",
      flag: "🇵🇭",
      desc: "Northern Philippines",
    },
    { id: "arabic", label: "Arabic", flag: "🇸🇦", desc: "Middle Eastern" },
    {
      id: "spanish",
      label: "Spanish",
      flag: "🇪🇸",
      desc: "European & Latin America",
    },
    { id: "mandarin", label: "Mandarin", flag: "🇨🇳", desc: "Chinese" },
    { id: "japanese", label: "Japanese", flag: "🇯🇵", desc: "East Asian" },
    { id: "korean", label: "Korean", flag: "🇰🇷", desc: "East Asian" },
    { id: "french", label: "French", flag: "🇫🇷", desc: "European" },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Language Selection - Ultra Compact */}
      <div>
        <div className="mb-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="brand-gradient p-1.5 rounded-lg">
              <FaLanguage className="text-white text-base" />
            </div>
            <h3 className="text-base font-bold brand-gradient-text">
              Select Languages You Speak
            </h3>
          </div>
          <p className="text-xs text-gray-600">
            Helps us recommend destinations where you can communicate
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {languages.map((lang) => {
            const isSelected = profileData.languagePreferences.includes(
              lang.id
            );
            return (
              <div
                key={lang.id}
                className={`group p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "border-sky-500 brand-gradient text-white shadow-md"
                    : "border-gray-200 bg-white hover:border-sky-400 hover:shadow-sm"
                }`}
                onClick={() =>
                  handleMultiSelect("languagePreferences", lang.id)
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`${
                      isSelected
                        ? "bg-white/20"
                        : "bg-gradient-to-br from-sky-100 to-blue-100"
                    } p-2 rounded-lg text-2xl`}
                  >
                    {lang.flag}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-sm ${
                        isSelected ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {lang.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        isSelected ? "text-white/90" : "text-gray-600"
                      }`}
                    >
                      {lang.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-white bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageStep;
