import React, { useState } from "react";

function InputSection({ step, inputSteps, onNext, onVerify }) {
  const [inputValue, setInputValue] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onNext(file);
  };

  const handleSubmit = () => {
    if (!inputValue) return;
    if (step < inputSteps.length) onNext(inputValue);
    else onVerify(inputValue);
    setInputValue("");
  };

  const currentStep = inputSteps[step];

  return (
    <div className="flex items-center space-x-2">
      {step < inputSteps.length ? (
        currentStep.key === "profile_image" ? (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-sm"
          />
        ) : (
          <input
            type={currentStep.key === "password" ? "password" : "text"}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentStep.label}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="flex-grow border rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        )
      ) : (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter OTP"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-grow border rounded-lg p-2 text-gray-700 focus:ring-2 focus:ring-indigo-500"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={!inputValue}
        className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
      >
        →
      </button>
    </div>
  );
}

export default InputSection;
