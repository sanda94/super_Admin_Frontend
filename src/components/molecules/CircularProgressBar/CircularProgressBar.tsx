import React, { useEffect, useState } from "react";
import "./circularProgressBar.scss";
import { useTheme } from "../../../context/Theme/ThemeContext";

interface CircularProgressBarProps {
  CurrentValue: number;
  StartValue: number;
  EndValue: number;
  LowValue: number;
  Units?: string;
  InnerColor?: string;
  TextColor?: string;
  Icon?: string;
  Title?: string;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  CurrentValue,
  StartValue,
  EndValue,
  LowValue,
  Units = "",
  InnerColor = "#222",
  TextColor = "#fff",
  Icon = "",
  Title = "",
}) => {
  const { colors } = useTheme();
  const radius = 80;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const maxRange = EndValue - StartValue;

  // Ensure CurrentValue stays within range
  const normalizedValue = Math.max(
    StartValue,
    Math.min(EndValue, CurrentValue)
  );

  // Adjust to reduce progress slightly (reduce by 1% or any value you prefer)
  const reductionFactor = 0.968; // Reduce by 1%
  const adjustedValue = normalizedValue * reductionFactor;

  // Calculate red and green progress based on the range
  const redPercentage = Math.min(
    (LowValue / maxRange) * 100,
    (adjustedValue / maxRange) * 100
  );
  const greenPercentage = Math.max(
    0,
    ((adjustedValue - LowValue) / maxRange) * 100
  );

  // Convert percentages to stroke values
  const redStroke = (redPercentage / 100) * circumference;
  const greenStroke = (greenPercentage / 100) * circumference;

  // State for animated value and fill color
  const [animatedValue, setAnimatedValue] = useState(StartValue);
  const [fillColor, setFillColor] = useState("#2ecc71"); // Default to green
  const [redProgress, setRedProgress] = useState(0);
  const [greenProgress, setGreenProgress] = useState(0);

  // Animation for counting the value
  useEffect(() => {
    const startTime = Date.now();
    const duration = 1500; // Duration of animation in ms

    const animateValue = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      const currentAnimatedValue =
        StartValue + (normalizedValue - StartValue) * progress;

      setAnimatedValue(Math.round(currentAnimatedValue));

      if (progress < 1) {
        requestAnimationFrame(animateValue);
      }
    };

    animateValue();
  }, [CurrentValue, StartValue, normalizedValue]);

  // Animation for stroke color based on value
  useEffect(() => {
    if (normalizedValue < LowValue) {
      setFillColor("#e74c3c"); // Red if value is below LowValue
    } else {
      setFillColor("#2ecc71"); // Green if value is above LowValue
    }
  }, [normalizedValue, LowValue]);

  // Animate red progress (filling the red area first)
  useEffect(() => {
    const startTime = Date.now();
    const redDuration = 1000; // Time for red progress to complete

    const animateRedProgress = () => {
      const elapsedTime = Date.now() - startTime;
      const redProgressValue = Math.min(elapsedTime / redDuration, 1);
      setRedProgress(redProgressValue * redStroke);

      if (redProgressValue < 1) {
        requestAnimationFrame(animateRedProgress);
      } else {
        // Once red is complete, start animating green
        const startGreenTime = Date.now();
        const greenDuration = 1000; // Time for green progress to complete

        const animateGreenProgress = () => {
          const elapsedTime = Date.now() - startGreenTime;
          const greenProgressValue = Math.min(elapsedTime / greenDuration, 1);
          setGreenProgress(greenProgressValue * greenStroke);

          if (greenProgressValue < 1) {
            requestAnimationFrame(animateGreenProgress);
          }
        };
        animateGreenProgress();
      }
    };

    animateRedProgress();
  }, [redStroke, greenStroke]);

  return (
    <div className="progress-bar">
      <svg width="180" height="180" className="c_svg">
        {/* Outer Circle with shadow */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke={colors.grey[700]}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          strokeLinecap="round"
        />

        {/* Red Progress Circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="#e74c3c"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${redProgress} ${circumference}`}
          strokeDashoffset={0} // Start from the top (no offset)
          strokeLinecap="square"
        />

        {/* Green Progress Circle */}
        {greenProgress > 0 && (
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke={fillColor} // Animated fill color
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${greenProgress} ${circumference}`}
            strokeDashoffset={-redProgress} // Start after the red progress
            strokeLinecap="square"
          />
        )}
      </svg>

      {/* Inner Circle Content with shadow */}
      <div className="outer">
        <div className="inner" style={{ backgroundColor: InnerColor }}>
          {Icon && <img src={Icon} alt="icon" className="icon" />}
          <div className="title" style={{ color: TextColor }}>
            {Title}
          </div>
          <div className="current-value" style={{ color: TextColor }}>
            {animatedValue} {Units}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgressBar;
